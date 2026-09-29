# AGENTS.md — Craftland · Panel del staff

Panel interno del staff de Craftland: Next.js 16 (App Router), React 19,
TypeScript, Tailwind CSS v4, Prisma 7 + PostgreSQL (Supabase).

## Convenciones

- Las mutaciones van con **Server Actions** en `lib/actions.ts`; no crear
  rutas API salvo que sea imprescindible.
- Las páginas son Server Components con `export const dynamic =
  "force-dynamic"`; la interactividad vive en `components/*/`.
- Cada sección tiene su página en `app/<seccion>/`, su `loading.tsx` con
  esqueletos y su manager en `components/<seccion>/` con este patrón:
  `PageHeader`, búsqueda/filtros, tarjetas o listas, modal de crear/editar,
  modal de confirmar borrado.
- **La bóveda es conocimiento cero**: `lib/vault-crypto.ts` solo se usa en el
  navegador. Las Server Actions de la bóveda solo guardan sal/IV/cifrado;
  jamás reciben la contraseña maestra ni el texto en claro. No romper esta
  separación.
- El color de acento es el **morado** `#8A2BE2` de la identidad de Craftland;
  los estados semánticos usan lime-online (éxito), sky (info), amber (aviso)
  y red (peligro). Tipografías: Anton (display) + Rubik (cuerpo).
- Detalles visuales propios: `block-border` (esquinas recortadas estilo
  Minecraft), `blocky-grid` (retícula de fondo), `glow-card` (brillo que sigue
  al cursor), `btn-gloss` (brillo superior en botones primarios).
- La base de datos se gestiona a mano: los SQL de `prisma/migrations/` se
  ejecutan una vez en el SQL Editor de Supabase; no hay `migrate deploy`
  en el build (el pooler de Supabase no lo soporta).
- Proteger rutas nuevas no hace falta: `proxy.ts` ya protege todo salvo
  `/login` y los assets públicos listados en su `matcher`.
- `npm run build` y `npm run lint` en verde antes de dar por terminado un
  cambio.
