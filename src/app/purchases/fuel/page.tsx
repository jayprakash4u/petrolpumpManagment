import { Truck, Fuel, IndianRupee, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FuelPurchasesTable } from "@/components/purchases/FuelPurchasesTable";
import { MOCK_FUEL_PURCHASES } from "@/lib/mock/purchases";
import { fmtL, fmtRs } from "@/lib/money";

export default async function FuelPurchasesPage() {
  await requireUser();

  const totalLitres = MOCK_FUEL_PURCHASES.reduce((sum, f) => sum + f.litresDelivered, 0);
  const totalCost = MOCK_FUEL_PURCHASES.reduce((sum, f) => sum + f.totalAmountNpr, 0);

  return (
    <div>
      <PurchaseSubnav />

      {/* Summary KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Fuel Received" value={fmtL(totalLitres)} icon={Fuel} tone="text" />
        <StatCard label="Total Procurement Cost" value={fmtRs(totalCost)} icon={IndianRupee} tone="accent" />
        <StatCard label="Tanker Decantations" value={`${MOCK_FUEL_PURCHASES.length} Shipments`} icon={Truck} tone="text" />
        <StatCard label="Density & QA Checks" value="100% Passed" icon={ShieldCheck} tone="success" />
      </div>

      <Card>
        <FuelPurchasesTable deliveries={MOCK_FUEL_PURCHASES} />
      </Card>
    </div>
  );
}
