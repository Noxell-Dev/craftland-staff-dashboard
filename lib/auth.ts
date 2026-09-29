// Sesión del panel: cookie firmada con HMAC (Web Crypto), sin dependencias
// ni base de datos. Vale en Node y en el Edge Runtime del proxy.

export const SESSION_COOKIE = "craftland_staff_auth";
const SESSION_DAYS = 30;

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/"));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function signingKey(): Promise<CryptoKey> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) throw new Error("Falta DASHBOARD_PASSWORD en el entorno.");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`craftland-staff-auth:${password}`),
  );
  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export async function createSession(): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `v1.${exp}`;
  const sig = await crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifySession(
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  const [v, exp, sig] = cookieValue.split(".");
  if (v !== "v1" || !exp || !sig || Number(exp) < Date.now()) return false;
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      b64urlDecode(sig),
      new TextEncoder().encode(`v1.${exp}`),
    );
  } catch {
    return false;
  }
}
