"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getVaultCheck,
  setupVault,
  listVaultEntries,
  createVaultEntry,
  updateVaultEntry,
  deleteVaultEntry,
  reencryptVaultEntry,
  replaceVaultCheck,
} from "@/lib/actions";
import {
  createVaultCheck,
  verifyMasterPassword,
  encryptSecret,
  decryptSecret,
  type VaultSecret,
} from "@/lib/vault-crypto";
import { VAULT_CATEGORIES } from "@/lib/utils";
import {
  Modal,
  Field,
  FormError,
  SubmitButton,
  CancelButton,
  PrimaryButton,
  DangerButton,
  IconButton,
  Badge,
  EmptyState,
  PageHeader,
  GlowCard,
  Skeleton,
  inputClasses,
} from "@/components/ui";

type Entry = {
  id: number;
  title: string;
  username: string | null;
  url: string | null;
  category: string;
  iv: string;
  data: string;
};

type Check = { salt: string; iv: string; data: string };

const LOCK_AFTER_MS = 15 * 60 * 1000;

function randomPassword(length = 20): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?";
  const buf = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(buf, (b) => chars[b % chars.length]).join("");
}

function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);
  return { copied, copy };
}

export function VaultManager() {
  const [status, setStatus] = useState<
    "loading" | "setup" | "locked" | "unlocked"
  >("loading");
  const [check, setCheck] = useState<Check | null>(null);
  const [master, setMaster] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [secrets, setSecrets] = useState<Record<number, VaultSecret>>({});
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  // Modales
  const [setupPw, setSetupPw] = useState({ a: "", b: "" });
  const [unlockPw, setUnlockPw] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null); // null = crear
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [changePw, setChangePw] = useState({ old: "", a: "", b: "" });

  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    setMaster(null);
    setSecrets({});
    setVisible({});
    setStatus(check ? "locked" : "setup");
  }, [check]);

  const poke = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(lock, LOCK_AFTER_MS);
  }, [lock]);

  useEffect(() => {
    if (status !== "unlocked") return;
    poke();
    const onActivity = () => poke();
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [status, poke]);

  useEffect(() => {
    getVaultCheck()
      .then((c) => {
        setCheck(c as Check | null);
        setStatus(c ? "locked" : "setup");
      })
      .catch(() => setError("No se pudo conectar con la base de datos."));
  }, []);

  const reload = useCallback(async () => {
    const list = await listVaultEntries();
    setEntries(list as Entry[]);
  }, []);

  async function handleSetup() {
    setError(undefined);
    if (setupPw.a.length < 8) {
      setError("La contraseña maestra debe tener al menos 8 caracteres.");
      return;
    }
    if (setupPw.a !== setupPw.b) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const c = await createVaultCheck(setupPw.a);
      await setupVault(c);
      setCheck(c);
      setMaster(setupPw.a);
      setSetupPw({ a: "", b: "" });
      await reload();
      setStatus("unlocked");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al inicializar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnlock() {
    setError(undefined);
    if (!check || !unlockPw) return;
    setBusy(true);
    try {
      const ok = await verifyMasterPassword(unlockPw, check);
      if (!ok) {
        setError("Contraseña maestra incorrecta.");
        return;
      }
      setMaster(unlockPw);
      setUnlockPw("");
      await reload();
      setStatus("unlocked");
    } finally {
      setBusy(false);
    }
  }

  async function reveal(entry: Entry): Promise<VaultSecret | null> {
    if (!master || !check) return null;
    const cached = secrets[entry.id];
    if (cached) return cached;
    try {
      const s = await decryptSecret(master, check.salt, entry.iv, entry.data);
      setSecrets((prev) => ({ ...prev, [entry.id]: s }));
      return s;
    } catch {
      setError("No se pudo descifrar (¿cambió la contraseña maestra?).");
      return null;
    }
  }

  async function handleChangeMaster() {
    setError(undefined);
    if (!master || !check) return;
    if (changePw.a.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (changePw.a !== changePw.b) {
      setError("Las nuevas contraseñas no coinciden.");
      return;
    }
    const okOld = await verifyMasterPassword(changePw.old, check);
    if (!okOld) {
      setError("La contraseña actual no es correcta.");
      return;
    }
    setBusy(true);
    try {
      // 1. Descifrar TODO con la clave actual antes de tocar nada.
      //    Si algo no descifra, se aborta sin haber modificado la base.
      const plain: { id: number; iv: string; data: string; secret: VaultSecret }[] = [];
      for (const e of entries) {
        const s = await decryptSecret(master, check.salt, e.iv, e.data);
        plain.push({ id: e.id, iv: e.iv, data: e.data, secret: s });
      }
      // 2. Cifrar todo en memoria con la nueva clave (operación local).
      const newCheck = await createVaultCheck(changePw.a);
      const reenc = await Promise.all(
        plain.map(async (p) => ({
          id: p.id,
          ...(await encryptSecret(changePw.a, newCheck.salt, p.secret)),
        })),
      );
      // 3. Escribir las entradas; si una falla, revertir las ya escritas
      //    para no dejar la bóveda a medias (mitad con cada clave).
      const written: number[] = [];
      try {
        for (const r of reenc) {
          await reencryptVaultEntry(r.id, { iv: r.iv, data: r.data });
          written.push(r.id);
        }
      } catch (writeErr) {
        for (const p of plain) {
          if (written.includes(p.id)) {
            try {
              await reencryptVaultEntry(p.id, { iv: p.iv, data: p.data });
            } catch {
              /* mejor esfuerzo: se informa abajo */
            }
          }
        }
        throw writeErr;
      }
      // 4. Solo cuando todo está escrito, sustituir el verificador.
      await replaceVaultCheck(newCheck);
      setCheck(newCheck);
      setMaster(changePw.a);
      setSecrets({});
      setVisible({});
      setChangePw({ old: "", a: "", b: "" });
      setShowChangePw(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar la clave.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = entries.filter((e) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.username ?? "").toLowerCase().includes(q) ||
      (e.url ?? "").toLowerCase().includes(q);
    return matchQ && (category === "Todas" || e.category === category);
  });

  if (status === "loading") {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  // --- Configuración inicial ---
  if (status === "setup") {
    return (
      <GlowCard className="block-border mx-auto max-w-xl border border-grape-600/50 bg-night-800/90 p-8">
        <h2 className="font-display text-2xl tracking-wide text-mist-50">
          Crear la bóveda
        </h2>
        <p className="mt-2 text-sm text-mist-400">
          Elige una <strong className="text-mist-200">contraseña maestra</strong>.
          Con ella se cifran todas las contraseñas en tu navegador: el servidor
          nunca la ve ni la guarda. Si la pierdes, no hay forma de recuperar el
          contenido.
        </p>
        <div className="mt-5 space-y-4">
          <FormError error={error} />
          <Field label="Contraseña maestra" htmlFor="setup-a">
            <input
              id="setup-a"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={setupPw.a}
              onChange={(e) => setSetupPw({ ...setupPw, a: e.target.value })}
            />
          </Field>
          <Field label="Repite la contraseña" htmlFor="setup-b">
            <input
              id="setup-b"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={setupPw.b}
              onChange={(e) => setSetupPw({ ...setupPw, b: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSetup()}
            />
          </Field>
          <SubmitButton pending={busy} pendingText="Creando bóveda…" onClick={handleSetup}>
            Crear bóveda cifrada
          </SubmitButton>
        </div>
      </GlowCard>
    );
  }

  // --- Bloqueada ---
  if (status === "locked" || !master || !check) {
    return (
      <GlowCard className="block-border mx-auto max-w-xl border border-grape-600/50 bg-night-800/90 p-8">
        <h2 className="font-display text-2xl tracking-wide text-mist-50">
          Bóveda bloqueada
        </h2>
        <p className="mt-2 text-sm text-mist-400">
          Introduce la contraseña maestra para descifrar las contraseñas. Se
          bloquea sola tras 15 minutos sin actividad.
        </p>
        <div className="mt-5 space-y-4">
          <FormError error={error} />
          <Field label="Contraseña maestra" htmlFor="unlock">
            <input
              id="unlock"
              type="password"
              autoComplete="current-password"
              className={inputClasses}
              value={unlockPw}
              onChange={(e) => setUnlockPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              autoFocus
            />
          </Field>
          <SubmitButton pending={busy} pendingText="Descifrando…" onClick={handleUnlock}>
            Desbloquear
          </SubmitButton>
        </div>
      </GlowCard>
    );
  }

  // --- Desbloqueada ---
  return (
    <div>
      <PageHeader
        title="Contraseñas"
        description="Bóveda cifrada de conocimiento cero: solo quien tenga la contraseña maestra puede leer el contenido."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowChangePw(true)}
              className="rounded-lg border border-night-600 px-4 py-2 text-sm font-medium text-mist-200 transition hover:bg-night-700"
            >
              Cambiar maestra
            </button>
            <button
              type="button"
              onClick={lock}
              className="rounded-lg border border-night-600 px-4 py-2 text-sm font-medium text-mist-200 transition hover:bg-night-700"
            >
              🔒 Bloquear
            </button>
            <PrimaryButton
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
            >
              + Nueva
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar por título, usuario o URL…"
          className={`${inputClasses} max-w-sm`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${inputClasses} w-auto`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="Todas">Todas las categorías</option>
          {VAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-sm text-mist-500">
          {filtered.length} de {entries.length} · 🔓 desbloqueada
        </span>
      </div>

      <FormError error={error} />

      {filtered.length === 0 ? (
        <EmptyState
          title={entries.length === 0 ? "Bóveda vacía" : "Sin resultados"}
          description={
            entries.length === 0
              ? "Guarda la primera contraseña del servidor con «+ Nueva»."
              : "Prueba con otra búsqueda o categoría."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              secret={secrets[e.id]}
              showSecret={!!visible[e.id]}
              onReveal={() => reveal(e)}
              onToggleShow={() =>
                setVisible((v) => ({ ...v, [e.id]: !v[e.id] }))
              }
              onEdit={() => {
                setEditing(e);
                setShowForm(true);
              }}
              onDelete={() => setDeleting(e)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <EntryForm
          entry={editing}
          master={master}
          salt={check.salt}
          busy={busy}
          setBusy={setBusy}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await reload();
          }}
        />
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar contraseña"
      >
        <p className="text-sm text-mist-400">
          ¿Eliminar <strong className="text-mist-200">“{deleting?.title}”</strong> de
          la bóveda? Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <CancelButton onClick={() => setDeleting(null)} />
          <DangerButton
            onClick={async () => {
              if (!deleting) return;
              setBusy(true);
              await deleteVaultEntry(deleting.id);
              setDeleting(null);
              setBusy(false);
              await reload();
            }}
          >
            {busy ? "Eliminando…" : "Eliminar"}
          </DangerButton>
        </div>
      </Modal>

      <Modal
        open={showChangePw}
        onClose={() => setShowChangePw(false)}
        title="Cambiar contraseña maestra"
      >
        <p className="mb-4 text-sm text-mist-400">
          Se re-cifrarán todas las contraseñas con la nueva clave. No olvides
          comunicarla al resto del staff por un canal seguro.
        </p>
        <div className="space-y-4">
          <FormError error={error} />
          <Field label="Contraseña maestra actual" htmlFor="ch-old">
            <input
              id="ch-old"
              type="password"
              className={inputClasses}
              value={changePw.old}
              onChange={(e) => setChangePw({ ...changePw, old: e.target.value })}
            />
          </Field>
          <Field label="Nueva contraseña maestra" htmlFor="ch-a">
            <input
              id="ch-a"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={changePw.a}
              onChange={(e) => setChangePw({ ...changePw, a: e.target.value })}
            />
          </Field>
          <Field label="Repite la nueva contraseña" htmlFor="ch-b">
            <input
              id="ch-b"
              type="password"
              autoComplete="new-password"
              className={inputClasses}
              value={changePw.b}
              onChange={(e) => setChangePw({ ...changePw, b: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-3">
            <CancelButton onClick={() => setShowChangePw(false)} />
            <SubmitButton pending={busy} pendingText="Re-cifrando…" onClick={handleChangeMaster}>
              Cambiar
            </SubmitButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EntryCard({
  entry,
  secret,
  showSecret,
  onReveal,
  onToggleShow,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  secret?: VaultSecret;
  showSecret: boolean;
  onReveal: () => Promise<VaultSecret | null>;
  onToggleShow: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { copied, copy } = useCopyFeedback();
  const [revealing, setRevealing] = useState(false);

  // Devuelve el secreto descifrado (recién descifrado o ya en caché).
  // Así "copiar" funciona al primer clic, sin depender del prop
  // `secret` que aún no se ha actualizado tras el re-render.
  async function ensure(): Promise<VaultSecret | null> {
    if (secret) return secret;
    setRevealing(true);
    try {
      return await onReveal();
    } finally {
      setRevealing(false);
    }
  }

  return (
    <GlowCard className="block-border border border-night-600/60 bg-night-800/80 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-mist-50">{entry.title}</h3>
          {entry.username && (
            <p className="mt-0.5 truncate font-mono text-xs text-mist-400">
              {entry.username}
            </p>
          )}
        </div>
        <Badge tone="grape">{entry.category}</Badge>
      </div>

      {entry.url && (
        <a
          href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate text-xs text-grape-300 hover:underline"
        >
          {entry.url}
        </a>
      )}

      <div className="mt-3 rounded-lg bg-night-900/80 px-3 py-2">
        {secret ? (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate font-mono text-sm text-mist-50">
              {showSecret ? secret.password : "••••••••••••"}
            </code>
            <IconButton
              onClick={async () => {
                const s = await ensure();
                if (s) onToggleShow();
              }}
              label={showSecret ? "Ocultar" : "Mostrar"}
            >
              {showSecret ? "🙈" : "👁"}
            </IconButton>
            <IconButton
              onClick={async () => {
                const s = await ensure();
                if (s) await copy(s.password);
              }}
              label="Copiar contraseña"
            >
              {copied ? "✓" : "⧉"}
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void ensure()}
            disabled={revealing}
            className="w-full py-1 text-center text-xs font-medium text-grape-300 transition hover:text-grape-400"
          >
            {revealing ? "Descifrando…" : "🔓 Descifrar contraseña"}
          </button>
        )}
      </div>

      {secret?.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-mist-500">{secret.notes}</p>
      )}

      <div className="mt-3 flex justify-end gap-1 border-t border-night-600/50 pt-2">
        <IconButton onClick={onEdit} label="Editar">
          ✎ Editar
        </IconButton>
        <IconButton onClick={onDelete} label="Eliminar" danger>
          🗑
        </IconButton>
      </div>
    </GlowCard>
  );
}

function EntryForm({
  entry,
  master,
  salt,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  entry: Entry | null;
  master: string;
  salt: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [username, setUsername] = useState(entry?.username ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [category, setCategory] = useState(entry?.category ?? "Servidor");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string>();
  const [loadedSecret, setLoadedSecret] = useState(false);

  // Al editar, descifrar el secreto actual una sola vez
  useEffect(() => {
    if (!entry || loadedSecret) return;
    decryptSecret(master, salt, entry.iv, entry.data)
      .then((s) => {
        setPassword(s.password);
        setNotes(s.notes);
        setLoadedSecret(true);
      })
      .catch(() => setError("No se pudo descifrar el secreto actual."));
  }, [entry, loadedSecret, master, salt]);

  async function save() {
    setError(undefined);
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    if (!password) {
      setError("La contraseña es obligatoria.");
      return;
    }
    setBusy(true);
    try {
      const enc = await encryptSecret(master, salt, { password, notes });
      if (entry) {
        await updateVaultEntry(entry.id, {
          title,
          username,
          url,
          category,
          iv: enc.iv,
          data: enc.data,
        });
      } else {
        await createVaultEntry({
          title,
          username,
          url,
          category,
          iv: enc.iv,
          data: enc.data,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? "Editar contraseña" : "Nueva contraseña"}
      wide
    >
      <div className="space-y-4">
        <FormError error={error} />
        <Field label="Título" htmlFor="ve-title">
          <input
            id="ve-title"
            className={inputClasses}
            placeholder="p. ej. Panel Pelican (admin)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Usuario" htmlFor="ve-user">
            <input
              id="ve-user"
              className={inputClasses}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Categoría" htmlFor="ve-cat">
            <select
              id="ve-cat"
              className={inputClasses}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {VAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="URL" htmlFor="ve-url">
          <input
            id="ve-url"
            className={inputClasses}
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>
        <Field label="Contraseña" htmlFor="ve-pw">
          <div className="flex gap-2">
            <input
              id="ve-pw"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              className={`${inputClasses} font-mono`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Ocultar" : "Mostrar"}
              className="shrink-0 rounded-lg border border-night-600 px-3 text-sm text-mist-200 transition hover:bg-night-700"
            >
              {showPw ? "🙈" : "👁"}
            </button>
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              title="Generar contraseña segura"
              className="shrink-0 rounded-lg border border-night-600 px-3 text-sm text-mist-200 transition hover:bg-night-700"
            >
              🎲
            </button>
          </div>
        </Field>
        <Field label="Notas (cifradas)" htmlFor="ve-notes">
          <textarea
            id="ve-notes"
            rows={2}
            className={inputClasses}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-3">
          <CancelButton onClick={onClose} />
          <SubmitButton pending={busy} onClick={save}>
            Guardar cifrada
          </SubmitButton>
        </div>
      </div>
    </Modal>
  );
}
