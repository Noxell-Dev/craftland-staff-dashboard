-- Craftland Staff · SQL completo de creación (ejecutar UNA SOLA VEZ en el
-- SQL Editor de Supabase). Crea las 5 tablas del panel.
-- Si la base ya existe de antes, ejecuta solo los archivos nuevos de
-- prisma/migrations/ en orden en lugar de este.

CREATE TYPE "TaskStatus" AS ENUM ('PENDIENTE', 'EN_CURSO', 'HECHA');
CREATE TYPE "Priority" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

CREATE TABLE "VaultEntry" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "username" TEXT,
  "url" TEXT,
  "category" TEXT NOT NULL DEFAULT 'General',
  "iv" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "VaultCheck" (
  "id" SERIAL PRIMARY KEY,
  "salt" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "data" TEXT NOT NULL
);

CREATE TABLE "Expense" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Servidor',
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "recurring" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Income" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'Tienda',
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "buyer" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Task" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDIENTE',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIA',
  "assignee" TEXT,
  "dueDate" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "VaultEntry_category_idx" ON "VaultEntry"("category");
CREATE INDEX "Expense_date_idx" ON "Expense"("date" DESC);
CREATE INDEX "Income_date_idx" ON "Income"("date" DESC);
CREATE INDEX "Task_status_idx" ON "Task"("status");
