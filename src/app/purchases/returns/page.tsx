import { Undo2, IndianRupee, ShieldCheck, FileText } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { PurchaseReturnsTable } from "@/components/purchases/PurchaseReturnsTable";
import { MOCK_PURCHASE_RETURNS } from "@/lib/mock/purchases";
import { fmtRs } from "@/lib/money";

export default async function PurchaseReturnsPage() {
  await requireUser();

  const totalReturnsVal = MOCK_PURCHASE_RETURNS.reduce((sum, r) => sum + r.totalReturnAmountNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Debit Notes Issued" value={`${MOCK_PURCHASE_RETURNS.length} Notes`} icon={Undo2} tone="text" />
        <StatCard label="Total Credit Claimed" value={fmtRs(totalReturnsVal)} icon={IndianRupee} tone="accent" />
        <StatCard label="Vendor Settlement" value="100% Adjusted" icon={ShieldCheck} tone="success" />
        <StatCard label="Tax Credit Impact" value="VAT Adjusted" icon={FileText} tone="text" />
      </div>

      <Card>
        <PurchaseReturnsTable returns={MOCK_PURCHASE_RETURNS} />
      </Card>
    </div>
  );
}
