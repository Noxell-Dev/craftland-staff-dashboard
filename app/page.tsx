import Link from "next/link";
import { dashboardStats } from "@/lib/actions";
import { formatEUR, formatDate } from "@/lib/utils";
import {
  PageHeader,
  StatCard,
  SectionCard,
  Badge,
  EmptyState,
  GlowCard,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const SERVERS = [
  { name: "Proxy", desc: "Entrada de la red" },
  { name: "Lobby", desc: "Lobby principal" },
  { name: "Survival", desc: "Supervivencia" },
  { name: "Skyblock", desc: "Islas" },
  { name: "Creativo", desc: "Creativo + WE" },
];

export default async function Home() {
  const stats = await dashboardStats();
  const balance = stats.monthIncomes - stats.monthExpenses;

  return (
    <div>
      <PageHeader
        title="Panel del staff"
        description="Vista general de Craftland: dinero, tareas, contraseñas y servidores."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Balance del mes"
          value={`${balance >= 0 ? "+" : ""}${formatEUR(balance)}`}
          subtitle={`${formatEUR(stats.monthIncomes)} cobros · ${formatEUR(stats.monthExpenses)} gastos`}
          accent
        />
        <StatCard
          title="Tareas abiertas"
          value={stats.pendingTasks}
          subtitle="Pendientes + en curso"
        />
        <StatCard
          title="Contraseñas"
          value={stats.vaultCount}
          subtitle="En la bóveda cifrada"
        />
        <Link href="/servidores">
          <StatCard
            title="Red"
            value="5/5"
            subtitle="play.craftlandmc.com"
          />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="Últimos movimientos"
          action={
            <Link
              href="/finanzas"
              className="text-sm font-medium text-grape-300 hover:underline"
            >
              Ver finanzas →
            </Link>
          }
        >
          {stats.recentIncomes.length === 0 &&
          stats.recentExpenses.length === 0 ? (
            <EmptyState
              title="Sin movimientos todavía"
              description="Registra gastos y cobros en la sección Finanzas."
            />
          ) : (
            <ul className="space-y-2.5">
              {stats.recentIncomes.map((i) => (
                <li
                  key={`in-${i.id}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-mist-50">
                      {i.title}
                    </span>
                    <span className="text-xs text-mist-500">
                      {formatDate(i.date)} · {i.source}
                    </span>
                  </span>
                  <span className="font-display tracking-wide text-lime-online">
                    +{formatEUR(i.amount)}
                  </span>
                </li>
              ))}
              {stats.recentExpenses.map((e) => (
                <li
                  key={`ex-${e.id}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-mist-50">
                      {e.title}
                    </span>
                    <span className="text-xs text-mist-500">
                      {formatDate(e.date)} · {e.category}
                    </span>
                  </span>
                  <span className="font-display tracking-wide text-red-300">
                    −{formatEUR(e.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Tareas recientes"
          action={
            <Link
              href="/tareas"
              className="text-sm font-medium text-grape-300 hover:underline"
            >
              Ver tablero →
            </Link>
          }
        >
          {stats.recentTasks.length === 0 ? (
            <EmptyState
              title="Sin tareas"
              description="Crea la primera en la sección Tareas."
            />
          ) : (
            <ul className="space-y-2.5">
              {stats.recentTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-mist-50">
                    {t.title}
                  </span>
                  <Badge
                    tone={
                      t.status === "HECHA"
                        ? "green"
                        : t.status === "EN_CURSO"
                          ? "sky"
                          : "amber"
                    }
                  >
                    {t.status === "HECHA"
                      ? "Hecha"
                      : t.status === "EN_CURSO"
                        ? "En curso"
                        : "Pendiente"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="Servidores"
          action={
            <Link
              href="/servidores"
              className="text-sm font-medium text-grape-300 hover:underline"
            >
              Ver detalle →
            </Link>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {SERVERS.map((s) => (
              <GlowCard
                key={s.name}
                className="block-border border border-night-600/60 bg-night-900/70 p-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full bg-lime-online shadow-[0_0_8px_#33cc33]"
                    aria-label="Online"
                  />
                  <p className="font-display tracking-wide text-mist-50">
                    {s.name}
                  </p>
                </div>
                <p className="mt-1 text-xs text-mist-500">{s.desc}</p>
              </GlowCard>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
