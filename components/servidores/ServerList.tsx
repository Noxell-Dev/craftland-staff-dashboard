"use client";

import { useState } from "react";
import { PageHeader, SectionCard, Badge, GlowCard } from "@/components/ui";

const IP = "play.craftlandmc.com";

const SERVERS = [
  {
    name: "Craftland-Proxy",
    role: "Proxy · puerta de entrada de la red",
    detail: "Reparte a los jugadores entre los servidores.",
  },
  {
    name: "Craftland-Lobby",
    role: "Lobby principal",
    detail: "Purpur 1.21.11 · spawn principal.",
  },
  {
    name: "Craftland-Survival",
    role: "Supervivencia",
    detail: "Servidor de supervivencia.",
  },
  {
    name: "Craftland-Skyblock",
    role: "SkyBlock",
    detail: "Servidor de SkyBlock.",
  },
  {
    name: "Craftland-Creativo",
    role: "Creativo",
    detail: "Servidor creativo para construir.",
  },
];

const QUICK_LINKS = [
  { label: "Panel Pelican", url: "https://panel.craftlandmc.com", desc: "Consola, archivos y copias de seguridad" },
  { label: "Web pública", url: "https://craftlandmc.com", desc: "craftlandmc.com" },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* portapapeles no disponible */
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-lg border border-grape-600/60 bg-grape-600/10 px-3 py-1.5 font-mono text-xs text-grape-300 transition hover:bg-grape-600/20"
      title={label}
    >
      {copied ? "✓ Copiada" : `⧉ ${text}`}
    </button>
  );
}

export function ServerList() {
  return (
    <div>
      <PageHeader
        title="Servidores"
        description="La red de Craftland: 5 servidores en el nodo 1."
      />

      <SectionCard title="Conexión pública">
        <div className="flex flex-wrap items-center gap-4">
          <div className="ip-chip rounded-lg px-5 py-3">
            <p className="text-xs text-mist-500">IP para los jugadores</p>
            <p className="font-mono text-xl font-bold text-mist-50">{IP}</p>
          </div>
          <CopyButton text={IP} label="Copiar IP" />
          <span className="text-sm text-mist-500">
            IP pública de la red · todos los servidores están en el nodo 1
          </span>
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SERVERS.map((s) => (
          <GlowCard
            key={s.name}
            className="block-border border border-night-600/60 bg-night-800/80 p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg tracking-wide text-mist-50">
                {s.name.replace("Craftland-", "")}
              </h3>
              <Badge tone="default">Nodo 1</Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-grape-300">{s.role}</p>
            <p className="mt-2 text-sm text-mist-400">{s.detail}</p>
            <div className="mt-4 border-t border-night-600/50 pt-3">
              <CopyButton text={IP} label={`Copiar IP de ${s.name}`} />
            </div>
          </GlowCard>
        ))}

        <GlowCard className="block-border border border-dashed border-night-600 bg-night-800/40 p-5">
          <h3 className="font-display text-lg tracking-wide text-mist-400">
            Accesos rápidos
          </h3>
          <ul className="mt-3 space-y-2.5">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <span className="text-sm font-medium text-grape-300 group-hover:underline">
                    {l.label} ↗
                  </span>
                  <span className="block text-xs text-mist-500">{l.desc}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-mist-500">
            Las credenciales del panel están en la{" "}
            <a href="/contrasenas" className="text-grape-300 hover:underline">
              bóveda de contraseñas
            </a>
            .
          </p>
        </GlowCard>
      </div>
    </div>
  );
}
