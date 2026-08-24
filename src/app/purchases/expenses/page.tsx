import { Wallet, IndianRupee, Receipt, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { ExpensesTable } from "@/components/purchases/ExpensesTable";
import { MOCK_STATION_EXPENSES } from "@/lib/mock/purchases";
import { fmtRs } from "@/lib/money";

export default async function ExpensesPage() {
  await requireUser();

  const totalExpense = MOCK_STATION_EXPENSES.reduce((sum, e) => sum + e.amountNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Monthly Station Expenses" value={fmtRs(totalExpense)} icon={Wallet} tone="accent" />
        <StatCard label="Expense Vouchers" value={`${MOCK_STATION_EXPENSES.length} Vouchers`} icon={Receipt} tone="text" />
        <StatCard label="Cash Till Disbursements" value={fmtRs(12350)} icon={IndianRupee} tone="text" />
        <StatCard label="Voucher Verification" value="100% Approved" icon={ShieldCheck} tone="success" />
      </div>

      <Card>
        <ExpensesTable expenses={MOCK_STATION_EXPENSES} />
      </Card>
    </div>
  );
}
