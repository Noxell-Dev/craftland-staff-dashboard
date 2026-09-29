"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-actions";

const LINKS = [
  { href: "/", label: "Panel", icon: "▦" },
  { href: "/contrasenas", label: "Contraseñas", icon: "🔑" },
  { href: "/finanzas", label: "Finanzas", icon: "💰" },
  { href: "/tareas", label: "Tareas", icon: "☑" },
  { href: "/servidores", label: "Servidores", icon: "🖥" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2">
      <Image
        src="/logo.webp"
        alt="Logo de Craftland"
        width={46}
        height={46}
        className="rounded-lg"
      />
      <span>
        <span className="block font-display text-xl tracking-wide text-mist-50">
          CRAFTLAND
        </span>
        <span className="block text-xs text-mist-500">Panel del staff</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-grape-600/20 text-grape-300 ring-1 ring-grape-500/40"
                : "text-mist-400 hover:bg-night-700/60 hover:text-mist-50"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {link.icon}
            </span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-mist-500 transition hover:bg-night-700/60 hover:text-mist-50"
      >
        <span aria-hidden="true" className="text-base">
          ⏻
        </span>
        Salir
      </button>
    </form>
  );
}

function MobileHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  return (
    <header className="sticky top-0 z-40 border-b border-night-600/80 bg-night-950/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-mist-200 ring-1 ring-night-600 transition hover:bg-night-700/60"
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-night-600/80 px-4 py-3">
          <NavLinks onNavigate={() => setOpen(false)} />
          <div className="mt-2 border-t border-night-600/60 pt-2">
            <LogoutButton />
          </div>
        </div>
      )}
    </header>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-night-600/80 bg-night-950 px-4 py-6 md:flex">
        <div className="mb-8">
          <Logo />
        </div>
        <NavLinks />
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>

      {/* Móvil: cabecera con menú desplegable */}
      <MobileHeader />
    </>
  );
}
