import { Warehouse, IndianRupee, ShieldCheck, Wrench } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FixedAssetsTable } from "@/components/purchases/FixedAssetsTable";
import { MOCK_FIXED_ASSETS } from "@/lib/mock/purchases";
import { fmtRs } from "@/lib/money";

export default async function FixedAssetsPage() {
  await requireUser();

  const totalCapValue = MOCK_FIXED_ASSETS.reduce((sum, a) => sum + a.purchaseCostNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Capital Assets" value={fmtRs(totalCapValue)} icon={Warehouse} tone="accent" />
        <StatCard label="Dispensers & Tanks" value="5 Units" icon={Wrench} tone="text" />
        <StatCard label="Equipment Condition" value="100% Operational" icon={ShieldCheck} tone="success" />
        <StatCard label="Warranty & AMC" value="All Active" icon={IndianRupee} tone="text" />
      </div>

      <Card>
        <FixedAssetsTable assets={MOCK_FIXED_ASSETS} />
      </Card>
    </div>
  );
}
