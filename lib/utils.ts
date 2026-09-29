export function tagsToList(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function formatEUR(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function toInputDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export const EXPENSE_CATEGORIES = [
  "Servidor",
  "Dominio",
  "Plugins",
  "Publicidad",
  "Diseño",
  "Otros",
];

export const INCOME_SOURCES = [
  "Tienda",
  "Donación",
  "Patrocinio",
  "Otros",
];

export const VAULT_CATEGORIES = [
  "Servidor",
  "Panel",
  "Base de datos",
  "Dominio",
  "Redes",
  "Tienda",
  "Otros",
];
