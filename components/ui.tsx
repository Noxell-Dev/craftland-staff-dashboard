"use client";

import { useEffect, useRef, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// GlowCard: tarjeta con brillo de borde que sigue al cursor
// ---------------------------------------------------------------------------

export function GlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      const dist = Math.hypot(x, y);
      const max = Math.hypot(r.width, r.height) / 2;
      const proximity = Math.max(0, 100 - (dist / max) * 100);
      el.style.setProperty("--cursor-angle", `${angle}deg`);
      el.style.setProperty("--edge-proximity", `${proximity}`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} className={`glow-card ${className}`}>
      <div className="glow-edge" aria-hidden="true" />
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`block-border max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-y-auto border border-night-600 bg-night-800 p-6 shadow-2xl shadow-grape-700/20`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wide text-mist-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-mist-400 transition hover:bg-night-700 hover:text-mist-50"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

export const inputClasses =
  "w-full rounded-lg border border-night-600 bg-night-900/80 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-500 outline-none transition focus:border-grape-500 focus:ring-2 focus:ring-grape-500/30";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-mist-200"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-mist-500">{hint}</p>}
    </div>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {error}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  pendingText = "Guardando…",
  onClick,
}: {
  pending: boolean;
  children: ReactNode;
  pendingText?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={pending}
      className="btn-gloss rounded-lg bg-grape-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-grape-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function CancelButton({
  onClick,
  children = "Cancelar",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-night-600 px-4 py-2 text-sm font-medium text-mist-200 transition hover:bg-night-700"
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tarjetas y listados
// ---------------------------------------------------------------------------

export function StatCard({
  title,
  value,
  subtitle,
  accent = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <GlowCard
      className={`block-border border bg-night-800/80 p-5 ${accent ? "border-grape-600/60" : "border-night-600/60"}`}
    >
      <p className="text-sm font-medium text-mist-400">{title}</p>
      <p
        className={`mt-2 font-display text-4xl tracking-wide ${accent ? "text-grape-300" : "text-mist-50"}`}
      >
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-mist-500">{subtitle}</p>}
    </GlowCard>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="block-border border border-night-600/60 bg-night-800/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg tracking-wide text-mist-50">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-night-600 px-4 py-10 text-center">
      <p className="font-medium text-mist-200">{title}</p>
      <p className="mt-1 text-sm text-mist-500">{description}</p>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-mist-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-mist-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-gloss rounded-lg bg-grape-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-grape-500"
    >
      {children}
    </button>
  );
}

export function DangerButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  label,
  children,
  danger = false,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        danger
          ? "text-red-300 hover:bg-red-500/10"
          : "text-mist-400 hover:bg-night-700 hover:text-mist-50"
      }`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "grape" | "green" | "amber" | "red" | "sky";
}) {
  const tones: Record<string, string> = {
    default: "bg-night-700 text-mist-200 ring-night-600",
    grape: "bg-grape-600/15 text-grape-300 ring-grape-500/40",
    green: "bg-lime-online/10 text-lime-online ring-lime-online/30",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    red: "bg-red-500/10 text-red-300 ring-red-500/30",
    sky: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Esqueleto de carga para los loading.tsx
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-night-700/70 ${className}`}
    />
  );
}
