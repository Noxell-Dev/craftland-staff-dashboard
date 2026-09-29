# Craftland · Panel del staff

Panel interno del staff de **Craftland** para gestionar las contraseñas del
servidor (bóveda cifrada), las finanzas (gastos y cobros), las tareas y la
información de la red de servidores. Diseño con la identidad visual de
[craftlandmc.com](https://craftlandmc.com): noche, morado y estética blocky.

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Prisma ORM 7** con **PostgreSQL** en **Supabase**
- Mutaciones con **Server Actions** (sin rutas API separadas)
- Bóveda con **cifrado de conocimiento cero** (AES-256-GCM vía WebCrypto)

## Secciones

| Ruta           | Contenido                                                    |
| -------------- | ------------------------------------------------------------ |
| `/`            | Panel: balance del mes, tareas abiertas, últimos movimientos  |
| `/contrasenas` | Bóveda cifrada de contraseñas (categorías, buscador, copiar)  |
| `/finanzas`    | Gastos y cobros por mes, balance y flujo                     |
| `/tareas`      | Tablero kanban: pendientes / en curso / hechas               |
| `/servidores`  | Los 5 servidores de la red, IP pública y accesos rápidos      |

## Seguridad

- **Acceso al panel**: contraseña en `DASHBOARD_PASSWORD` (entorno). El
  `proxy.ts` redirige a `/login` toda visita sin sesión válida; la sesión es
  una cookie firmada con HMAC válida 30 días.
- **Bóveda**: la contraseña maestra se elige al abrir la sección por primera
  vez. Todo el cifrado/descifrado ocurre **en el navegador** (PBKDF2 con
  600.000 iteraciones → AES-256-GCM). El servidor solo guarda sal, IV y texto
  cifrado: sin la maestra son inútiles. La bóveda se **bloquea sola tras
  15 minutos** sin actividad y la clave maestra nunca se guarda en disco.
- Si se pierde la contraseña maestra, el contenido de la bóveda **no se puede
  recuperar**. Guárdala en un lugar seguro y comunícala al staff por un canal
  privado.

## Requisitos

- Node.js 20 o superior
- npm
- Un proyecto en [Supabase](https://supabase.com) (capa gratuita vale)

## Puesta en marcha

```bash
# 1. Instalar dependencias (el postinstall genera el cliente de Prisma)
npm install

# 2. Configurar el entorno: copia .env.example a .env y rellena las
#    dos variables:
#    - DATABASE_URL: en el dashboard de Supabase pulsa el botón "Connect"
#      (arriba del todo) y elige "Transaction pooler".
#    - DASHBOARD_PASSWORD: la contraseña para entrar al panel.
cp .env.example .env

# 3. Crear las tablas (UNA SOLA VEZ): en el SQL Editor del dashboard de
#    Supabase pega y ejecuta el contenido de prisma/full-setup.sql
#    (incluye las 6 tablas: VaultEntry, VaultCheck, Expense, Income y Task).
#    Si la base de datos ya existe de antes, ejecuta solo los archivos
#    nuevos de prisma/migrations/ en orden en lugar de este.

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador y entra
con la contraseña de `DASHBOARD_PASSWORD`.

> El archivo `.env` no se sube al repositorio.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [Vercel](https://vercel.com) → **Add New… → Project** → importa el
   repositorio.
3. En **Environment Variables** añade las dos variables:
   - `DATABASE_URL` → botón "Connect" → "Transaction pooler" del dashboard
     de Supabase
   - `DASHBOARD_PASSWORD` → la contraseña para entrar al panel
4. Despliega. El proyecto incluye el script `vercel-build`, que en cada
   despliegue genera el cliente de Prisma y compila (`prisma generate &&
   next build`). Las tablas ya tienen que existir (paso 3 de la puesta en
   marcha); no se ejecutan migraciones automáticas porque el motor de
   migraciones de Prisma no funciona bien a través del pooler de Supabase.

## Scripts

| Comando              | Descripción                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Servidor de desarrollo                    |
| `npm run build`      | Compilación de producción                 |
| `npm run start`      | Servidor de producción                    |
| `npm run lint`       | Linter                                    |
| `npx prisma studio`  | Interfaz visual para explorar la base de datos |

## Estructura

```
app/
  page.tsx              → Panel principal (balance, actividad reciente)
  login/page.tsx        → Acceso con contraseña
  contrasenas/          → Bóveda de contraseñas cifrada
  finanzas/             → Gastos y cobros
  tareas/               → Tablero kanban del staff
  servidores/           → Red de servidores e IP pública
  icon.svg              → Favicon (C morada estilo bloque)
  loading.tsx           → Esqueletos de carga por sección
proxy.ts                → Protege todas las rutas salvo /login
components/
  AppShell.tsx          → Estructura con navegación (oculta en /login)
  Sidebar.tsx           → Navegación lateral / superior + salir
  ui.tsx                → Primitivas de UI con la identidad de Craftland
  vault/                → Gestor de la bóveda (cifrado en cliente)
  finanzas/             → Gestor de gastos y cobros
  tareas/               → Tablero kanban
  servidores/           → Tarjetas de servidores
lib/
  prisma.ts             → Cliente de Prisma (singleton)
  actions.ts            → Server Actions (crear/editar/eliminar)
  auth.ts               → Sesión firmada con HMAC (sin dependencias)
  auth-actions.ts       → Acciones de login/logout
  vault-crypto.ts       → AES-256-GCM + PBKDF2 (solo navegador)
  utils.ts              → Utilidades (fechas, moneda, categorías)
prisma/
  schema.prisma         → Modelos: VaultEntry, VaultCheck, Expense, Income, Task
  full-setup.sql        → SQL completo para crear toda la base de datos
public/
  logo.webp             → Logo de Craftland (de craftlandmc.com)
```
