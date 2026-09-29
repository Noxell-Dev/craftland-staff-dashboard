"use client";

import { useMemo, useState } from "react";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  createIncome,
  updateIncome,
  deleteIncome,
} from "@/lib/actions";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  formatEUR,
  formatDate,
  toInputDate,
} from "@/lib/utils";
import {
  Modal,
  Field,
  FormError,
  SubmitButton,
  CancelButton,
  PrimaryButton,
  DangerButton,
  IconButton,
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
  inputClasses,
} from "@/components/ui";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: Date;
  recurring: boolean;
  notes: string | null;
};

type Income = {
  id: number;
  title: string;
  amount: number;
  source: string;
  date: Date;
  buyer: string | null;
  notes: string | null;
};

function monthKey(d: Date): string {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function FinanceManager({
  initialExpenses,
  initialIncomes,
}: {
  initialExpenses: Expense[];
  initialIncomes: Income[];
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [incomes, setIncomes] = useState(initialIncomes);
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [tab, setTab] = useState<"gastos" | "cobros">("gastos");
  const [busy, setBusy] = useState(false);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [deleting, setDeleting] = useState<
    { kind: "gasto" | "cobro"; id: number; title: string } | null
  >(null);

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) set.add(monthKey(e.date));
    for (const i of incomes) set.add(monthKey(i.date));
    set.add(monthKey(new Date()));
    return [...set].sort().reverse();
  }, [expenses, incomes]);

  const monthExpenses = expenses.filter((e) => monthKey(e.date) === month);
  const monthIncomes = incomes.filter((i) => monthKey(i.date) === month);
  const totalOut = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIn = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const balance = totalIn - totalOut;
  const maxBar = Math.max(totalIn, totalOut, 1);

  async function reload() {
    const [{ listExpenses }, { listIncomes }] = [
      await import("@/lib/actions"),
      await import("@/lib/actions"),
    ];
    setExpenses((await listExpenses()) as Expense[]);
    setIncomes((await listIncomes()) as Income[]);
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    if (deleting.kind === "gasto") await deleteExpense(deleting.id);
    else await deleteIncome(deleting.id);
    setDeleting(null);
    setBusy(false);
    await reload();
  }

  return (
    <div>
      <PageHeader
        title="Finanzas"
        description="Gastos del servidor y cobros de la tienda, mes a mes."
        action={
          <div className="flex gap-2">
            <PrimaryButton
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
            >
              + Gasto
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                setEditingIncome(null);
                setShowIncomeForm(true);
              }}
            >
              + Cobro
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          className={`${inputClasses} w-auto`}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Mes"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-night-600 p-0.5">
          {(["gastos", "cobros"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                tab === t
                  ? "bg-grape-600 text-white"
                  : "text-mist-400 hover:text-mist-50"
              }`}
            >
              {t === "gastos" ? "Gastos" : "Cobros"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title={`Cobros · ${monthLabel(month)}`}
          value={formatEUR(totalIn)}
          subtitle={`${monthIncomes.length} movimientos`}
          accent
        />
        <StatCard
          title={`Gastos · ${monthLabel(month)}`}
          value={formatEUR(totalOut)}
          subtitle={`${monthExpenses.length} movimientos`}
        />
        <StatCard
          title="Balance del mes"
          value={`${balance >= 0 ? "+" : ""}${formatEUR(balance)}`}
          subtitle={balance >= 0 ? "En positivo ✓" : "En negativo"}
          accent={balance >= 0}
        />
      </div>

      <SectionCard title={`Flujo de ${monthLabel(month)}`}>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-mist-400">
              <span>Cobros</span>
              <span className="font-semibold text-lime-online">
                {formatEUR(totalIn)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-night-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-online/70 to-lime-online transition-all"
                style={{ width: `${(totalIn / maxBar) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-mist-400">
              <span>Gastos</span>
              <span className="font-semibold text-red-300">
                {formatEUR(totalOut)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-night-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500/70 to-red-400 transition-all"
                style={{ width: `${(totalOut / maxBar) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="mt-6">
        {tab === "gastos" ? (
          <MovementList
            items={monthExpenses.map((e) => ({
              id: e.id,
              title: e.title,
              amount: e.amount,
              date: e.date,
              badge: e.category,
              extra: e.recurring ? "🔁 recurrente" : e.notes,
              negative: true,
            }))}
            emptyTitle="Sin gastos este mes"
            emptyDescription="Registra el primer gasto con «+ Gasto»."
            onEdit={(id) => {
              setEditingExpense(monthExpenses.find((e) => e.id === id)!);
              setShowExpenseForm(true);
            }}
            onDelete={(id, title) =>
              setDeleting({ kind: "gasto", id, title })
            }
          />
        ) : (
          <MovementList
            items={monthIncomes.map((i) => ({
              id: i.id,
              title: i.title,
              amount: i.amount,
              date: i.date,
              badge: i.source,
              extra: i.buyer ? `Comprador: ${i.buyer}` : i.notes,
              negative: false,
            }))}
            emptyTitle="Sin cobros este mes"
            emptyDescription="Registra el primer cobro con «+ Cobro»."
            onEdit={(id) => {
              setEditingIncome(monthIncomes.find((i) => i.id === id)!);
              setShowIncomeForm(true);
            }}
            onDelete={(id, title) =>
              setDeleting({ kind: "cobro", id, title })
            }
          />
        )}
      </div>

      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          busy={busy}
          setBusy={setBusy}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSaved={async () => {
            setShowExpenseForm(false);
            setEditingExpense(null);
            await reload();
          }}
        />
      )}

      {showIncomeForm && (
        <IncomeForm
          income={editingIncome}
          busy={busy}
          setBusy={setBusy}
          onClose={() => {
            setShowIncomeForm(false);
            setEditingIncome(null);
          }}
          onSaved={async () => {
            setShowIncomeForm(false);
            setEditingIncome(null);
            await reload();
          }}
        />
      )}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleting?.kind === "gasto" ? "Eliminar gasto" : "Eliminar cobro"}
      >
        <p className="text-sm text-mist-400">
          ¿Eliminar <strong className="text-mist-200">“{deleting?.title}”</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <CancelButton onClick={() => setDeleting(null)} />
          <DangerButton onClick={handleDelete}>
            {busy ? "Eliminando…" : "Eliminar"}
          </DangerButton>
        </div>
      </Modal>
    </div>
  );
}

function MovementList({
  items,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete,
}: {
  items: {
    id: number;
    title: string;
    amount: number;
    date: Date;
    badge: string;
    extra?: string | null;
    negative: boolean;
  }[];
  emptyTitle: string;
  emptyDescription: string;
  onEdit: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-night-600/60">
      {items.map((it, idx) => (
        <div
          key={it.id}
          className={`flex items-center gap-3 bg-night-800/60 px-4 py-3 transition hover:bg-night-700/50 ${idx > 0 ? "border-t border-night-600/40" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-mist-50">{it.title}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mist-500">
              <span>{formatDate(it.date)}</span>
              <Badge>{it.badge}</Badge>
              {it.extra && <span className="truncate">{it.extra}</span>}
            </p>
          </div>
          <span
            className={`font-display text-lg tracking-wide ${it.negative ? "text-red-300" : "text-lime-online"}`}
          >
            {it.negative ? "−" : "+"}
            {formatEUR(it.amount)}
          </span>
          <div className="flex shrink-0 gap-1">
            <IconButton onClick={() => onEdit(it.id)} label="Editar">
              ✎
            </IconButton>
            <IconButton
              onClick={() => onDelete(it.id, it.title)}
              label="Eliminar"
              danger
            >
              🗑
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpenseForm({
  expense,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  expense: Expense | null;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState(expense?.category ?? "Servidor");
  const [date, setDate] = useState(
    expense ? toInputDate(expense.date) : toInputDate(new Date()),
  );
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [error, setError] = useState<string>();

  async function save() {
    setError(undefined);
    const value = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return setError("El título es obligatorio.");
    if (Number.isNaN(value) || value <= 0)
      return setError("Introduce un importe válido.");
    if (!date) return setError("La fecha es obligatoria.");
    setBusy(true);
    try {
      const input = {
        title,
        amount: value,
        category,
        date,
        recurring,
        notes,
      };
      if (expense) await updateExpense(expense.id, input);
      else await createExpense(input);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={expense ? "Editar gasto" : "Nuevo gasto"}>
      <div className="space-y-4">
        <FormError error={error} />
        <Field label="Título" htmlFor="ex-title">
          <input
            id="ex-title"
            className={inputClasses}
            placeholder="p. ej. VPS mensual"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Importe (€)" htmlFor="ex-amount">
            <input
              id="ex-amount"
              inputMode="decimal"
              className={inputClasses}
              placeholder="9,99"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Categoría" htmlFor="ex-cat">
            <select
              id="ex-cat"
              className={inputClasses}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha" htmlFor="ex-date">
            <input
              id="ex-date"
              type="date"
              className={inputClasses}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-mist-200">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="h-4 w-4 accent-[#8a2be2]"
          />
          Gasto recurrente
        </label>
        <Field label="Notas" htmlFor="ex-notes">
          <textarea
            id="ex-notes"
            rows={2}
            className={inputClasses}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-3">
          <CancelButton onClick={onClose} />
          <SubmitButton pending={busy} onClick={save}>
            Guardar
          </SubmitButton>
        </div>
      </div>
    </Modal>
  );
}

function IncomeForm({
  income,
  busy,
  setBusy,
  onClose,
  onSaved,
}: {
  income: Income | null;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(income?.title ?? "");
  const [amount, setAmount] = useState(income ? String(income.amount) : "");
  const [source, setSource] = useState(income?.source ?? "Tienda");
  const [date, setDate] = useState(
    income ? toInputDate(income.date) : toInputDate(new Date()),
  );
  const [buyer, setBuyer] = useState(income?.buyer ?? "");
  const [notes, setNotes] = useState(income?.notes ?? "");
  const [error, setError] = useState<string>();

  async function save() {
    setError(undefined);
    const value = parseFloat(amount.replace(",", "."));
    if (!title.trim()) return setError("El título es obligatorio.");
    if (Number.isNaN(value) || value <= 0)
      return setError("Introduce un importe válido.");
    if (!date) return setError("La fecha es obligatoria.");
    setBusy(true);
    try {
      const input = { title, amount: value, source, date, buyer, notes };
      if (income) await updateIncome(income.id, input);
      else await createIncome(input);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={income ? "Editar cobro" : "Nuevo cobro"}>
      <div className="space-y-4">
        <FormError error={error} />
        <Field label="Título" htmlFor="in-title">
          <input
            id="in-title"
            className={inputClasses}
            placeholder="p. ej. Rango VIP Eterno"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Importe (€)" htmlFor="in-amount">
            <input
              id="in-amount"
              inputMode="decimal"
              className={inputClasses}
              placeholder="19,99"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Origen" htmlFor="in-source">
            <select
              id="in-source"
              className={inputClasses}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fecha" htmlFor="in-date">
            <input
              id="in-date"
              type="date"
              className={inputClasses}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Comprador (opcional)" htmlFor="in-buyer">
          <input
            id="in-buyer"
            className={inputClasses}
            placeholder="Nick de Minecraft"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          />
        </Field>
        <Field label="Notas" htmlFor="in-notes">
          <textarea
            id="in-notes"
            rows={2}
            className={inputClasses}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-3">
          <CancelButton onClick={onClose} />
          <SubmitButton pending={busy} onClick={save}>
            Guardar
          </SubmitButton>
        </div>
      </div>
    </Modal>
  );
}
