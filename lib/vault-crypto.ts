// Bóveda de contraseñas con cifrado de conocimiento cero.
//
// Todo el cifrado/descifrado ocurre en el navegador con WebCrypto:
// la contraseña maestra NUNCA se envía al servidor. El servidor solo
// guarda sal, IV y texto cifrado (AES-256-GCM), inútiles sin la maestra.
//
// La clave maestra vive únicamente en memoria (estado de React) mientras
// la bóveda está desbloqueada; al bloquear o cerrar la pestaña desaparece.

const ITERATIONS = 600_000;
const CHECK_PLAINTEXT = "craftland-vault-ok/v1";

export interface VaultSecret {
  password: string;
  notes: string;
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomB64(nBytes: number): string {
  return b64encode(crypto.getRandomValues(new Uint8Array(nBytes)));
}

async function deriveKey(
  masterPassword: string,
  saltB64: string,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64decode(saltB64),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSecret(
  masterPassword: string,
  saltB64: string,
  secret: VaultSecret,
): Promise<{ iv: string; data: string }> {
  const key = await deriveKey(masterPassword, saltB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(secret)),
  );
  return { iv: b64encode(iv), data: b64encode(new Uint8Array(ct)) };
}

export async function decryptSecret(
  masterPassword: string,
  saltB64: string,
  ivB64: string,
  dataB64: string,
): Promise<VaultSecret> {
  const key = await deriveKey(masterPassword, saltB64);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64decode(ivB64) },
    key,
    b64decode(dataB64),
  );
  const parsed = JSON.parse(new TextDecoder().decode(pt));
  return {
    password: String(parsed.password ?? ""),
    notes: String(parsed.notes ?? ""),
  };
}

// Crea el verificador inicial: sal nueva + secreto conocido cifrado.
// Desbloquear = descifrar este secreto y comparar.
export async function createVaultCheck(
  masterPassword: string,
): Promise<{ salt: string; iv: string; data: string }> {
  const salt = randomB64(16);
  const { iv, data } = await encryptSecret(masterPassword, salt, {
    password: CHECK_PLAINTEXT,
    notes: "",
  });
  return { salt, iv, data };
}

export async function verifyMasterPassword(
  masterPassword: string,
  check: { salt: string; iv: string; data: string },
): Promise<boolean> {
  try {
    const secret = await decryptSecret(
      masterPassword,
      check.salt,
      check.iv,
      check.data,
    );
    return secret.password === CHECK_PLAINTEXT;
  } catch {
    return false;
  }
}
