import { Contact, Building, IndianRupee, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { SuppliersTable } from "@/components/purchases/SuppliersTable";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";
import { fmtRs } from "@/lib/money";

export default async function SuppliersPage() {
  await requireUser();

  const totalPayable = MOCK_SUPPLIERS.reduce((sum, s) => sum + s.balanceDueNpr, 0);
  const totalVolume = MOCK_SUPPLIERS.reduce((sum, s) => sum + s.totalPurchasedNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered Suppliers" value={`${MOCK_SUPPLIERS.length} Vendors`} icon={Contact} tone="text" />
        <StatCard label="Total Lifetime Volume" value={fmtRs(totalVolume)} icon={Building} tone="accent" />
        <StatCard
          label="Outstanding Payables"
          value={fmtRs(totalPayable)}
          icon={IndianRupee}
          tone={totalPayable > 0 ? "accent" : "success"}
        />
        <StatCard label="PAN / VAT Compliance" value="100% Verified" icon={ShieldCheck} tone="success" />
      </div>

      <Card>
        <SuppliersTable suppliers={MOCK_SUPPLIERS} />
      </Card>
    </div>
  );
}
