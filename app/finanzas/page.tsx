import { listExpenses, listIncomes } from "@/lib/actions";
import { FinanceManager } from "@/components/finanzas/FinanceManager";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const [expenses, incomes] = await Promise.all([
    listExpenses(),
    listIncomes(),
  ]);
  return (
    <FinanceManager
      initialExpenses={expenses}
      initialIncomes={incomes}
    />
  );
}
