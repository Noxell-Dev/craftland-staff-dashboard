"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
import { login } from "@/lib/auth-actions";
import { inputClasses, GlowCard } from "@/components/ui";

function LoginForm() {
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const failed = params.get("error") === "1";

  return (
    <GlowCard className="block-border w-full max-w-md border border-grape-600/40 bg-night-800/90 p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/logo.webp"
          alt="Logo de Craftland"
          width={72}
          height={72}
          className="rounded-xl"
        />
        <h1 className="mt-4 font-display text-3xl tracking-wide text-mist-50">
          CRAFTLAND
        </h1>
        <p className="mt-1 text-sm text-mist-400">
          Acceso restringido al staff
        </p>
      </div>
      {failed && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Contraseña incorrecta.
        </p>
      )}
      <form
        action={async (fd) => {
          setPending(true);
          await login(fd);
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-mist-200"
          >
            Contraseña del panel
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClasses}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="btn-gloss w-full rounded-lg bg-grape-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-grape-500 disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </GlowCard>
  );
}

export default function LoginPage() {
  return (
    <div className="blocky-grid flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
