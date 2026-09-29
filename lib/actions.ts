"use server";

import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Bóveda: el servidor solo guarda metadatos + texto cifrado. El cifrado y la
// contraseña maestra nunca pasan por aquí (ver lib/vault-crypto.ts).
// ---------------------------------------------------------------------------

export async function getVaultCheck() {
  return prisma.vaultCheck.findFirst({ orderBy: { id: "asc" } });
}

export async function setupVault(input: {
  salt: string;
  iv: string;
  data: string;
}) {
  const existing = await prisma.vaultCheck.findFirst();
  if (existing) throw new Error("La bóveda ya está inicializada.");
  return prisma.vaultCheck.create({ data: input });
}

export async function listVaultEntries() {
  return prisma.vaultEntry.findMany({ orderBy: { title: "asc" } });
}

export async function createVaultEntry(input: {
  title: string;
  username?: string;
  url?: string;
  category: string;
  iv: string;
  data: string;
}) {
  return prisma.vaultEntry.create({
    data: {
      title: input.title.trim(),
      username: input.username?.trim() || null,
      url: input.url?.trim() || null,
      category: input.category,
      iv: input.iv,
      data: input.data,
    },
  });
}

export async function updateVaultEntry(
  id: number,
  input: {
    title: string;
    username?: string;
    url?: string;
    category: string;
    iv?: string;
    data?: string;
  },
) {
  return prisma.vaultEntry.update({
    where: { id },
    data: {
      title: input.title.trim(),
      username: input.username?.trim() || null,
      url: input.url?.trim() || null,
      category: input.category,
      ...(input.iv && input.data ? { iv: input.iv, data: input.data } : {}),
    },
  });
}

export async function deleteVaultEntry(id: number) {
  await prisma.vaultEntry.delete({ where: { id } });
}

// Cambiar la contraseña maestra: el cliente re-cifra cada secreto con la
// nueva sal y envía los nuevos blobs; aquí solo se sustituyen.
export async function reencryptVaultEntry(
  id: number,
  input: { iv: string; data: string },
) {
  await prisma.vaultEntry.update({
    where: { id },
    data: { iv: input.iv, data: input.data },
  });
}

export async function replaceVaultCheck(input: {
  salt: string;
  iv: string;
  data: string;
}) {
  const existing = await prisma.vaultCheck.findFirst({
    orderBy: { id: "asc" },
  });
  if (!existing) throw new Error("La bóveda no está inicializada.");
  await prisma.vaultCheck.update({ where: { id: existing.id }, data: input });
}

// ---------------------------------------------------------------------------
// Finanzas
// ---------------------------------------------------------------------------

export async function listExpenses() {
  return prisma.expense.findMany({ orderBy: { date: "desc" } });
}

export async function createExpense(input: {
  title: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  notes?: string;
}) {
  return prisma.expense.create({
    data: {
      title: input.title.trim(),
      amount: input.amount,
      category: input.category,
      date: new Date(input.date),
      recurring: input.recurring,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateExpense(
  id: number,
  input: {
    title: string;
    amount: number;
    category: string;
    date: string;
    recurring: boolean;
    notes?: string;
  },
) {
  return prisma.expense.update({
    where: { id },
    data: {
      title: input.title.trim(),
      amount: input.amount,
      category: input.category,
      date: new Date(input.date),
      recurring: input.recurring,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function deleteExpense(id: number) {
  await prisma.expense.delete({ where: { id } });
}

export async function listIncomes() {
  return prisma.income.findMany({ orderBy: { date: "desc" } });
}

export async function createIncome(input: {
  title: string;
  amount: number;
  source: string;
  date: string;
  buyer?: string;
  notes?: string;
}) {
  return prisma.income.create({
    data: {
      title: input.title.trim(),
      amount: input.amount,
      source: input.source,
      date: new Date(input.date),
      buyer: input.buyer?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateIncome(
  id: number,
  input: {
    title: string;
    amount: number;
    source: string;
    date: string;
    buyer?: string;
    notes?: string;
  },
) {
  return prisma.income.update({
    where: { id },
    data: {
      title: input.title.trim(),
      amount: input.amount,
      source: input.source,
      date: new Date(input.date),
      buyer: input.buyer?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
}

export async function deleteIncome(id: number) {
  await prisma.income.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export async function listTasks() {
  return prisma.task.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
  });
}

export async function createTask(input: {
  title: string;
  description?: string;
  status: "PENDIENTE" | "EN_CURSO" | "HECHA";
  priority: "BAJA" | "MEDIA" | "ALTA";
  assignee?: string;
  dueDate?: string;
}) {
  return prisma.task.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      assignee: input.assignee?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function updateTask(
  id: number,
  input: {
    title: string;
    description?: string;
    status: "PENDIENTE" | "EN_CURSO" | "HECHA";
    priority: "BAJA" | "MEDIA" | "ALTA";
    assignee?: string;
    dueDate?: string;
  },
) {
  return prisma.task.update({
    where: { id },
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status,
      priority: input.priority,
      assignee: input.assignee?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });
}

export async function setTaskStatus(
  id: number,
  status: "PENDIENTE" | "EN_CURSO" | "HECHA",
) {
  await prisma.task.update({ where: { id }, data: { status } });
}

export async function deleteTask(id: number) {
  await prisma.task.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Panel principal
// ---------------------------------------------------------------------------

export async function dashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [expenses, incomes, tasks, vaultCount] = await Promise.all([
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart } },
    }),
    prisma.income.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart } },
    }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.vaultEntry.count(),
  ]);
  const byStatus: Record<string, number> = {};
  for (const t of tasks) byStatus[t.status] = t._count;
  const [recentExpenses, recentIncomes, recentTasks] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.income.findMany({ orderBy: { date: "desc" }, take: 5 }),
    prisma.task.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);
  return {
    monthExpenses: expenses._sum.amount ?? 0,
    monthIncomes: incomes._sum.amount ?? 0,
    pendingTasks: (byStatus["PENDIENTE"] ?? 0) + (byStatus["EN_CURSO"] ?? 0),
    vaultCount,
    recentExpenses,
    recentIncomes,
    recentTasks,
  };
}
