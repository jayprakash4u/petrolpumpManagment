import { Truck, Fuel, IndianRupee, ListOrdered } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { FuelPurchasesTable } from "@/components/purchases/FuelPurchasesTable";
import { DeliveryForm } from "@/components/stock/DeliveryForm";
import { getFuelPurchasesPageData } from "@/lib/queries/fuel-purchases";
import { fmtL, fmtRs } from "@/lib/money";

export default async function FuelPurchasesPage() {
  await requireUser();
  const data = await getFuelPurchasesPageData();

  return (
    <div>
      <PurchaseSubnav />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Fuel Received" value={fmtL(data.totalLitersL)} icon={Fuel} tone="text" />
        <StatCard label="Total Procurement Cost" value={fmtRs(data.totalCost)} icon={IndianRupee} tone="accent" />
        <StatCard label="Deliveries Recorded" value={`${data.deliveryCount}`} icon={ListOrdered} tone="text" />
        <StatCard
          label="Tanks Fed"
          value={`${new Set(data.deliveries.map((d) => d.fuel)).size} / ${data.tankOptions.length}`}
          icon={Truck}
          tone="success"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <SectionTitle icon={Truck} title="Record Delivery" subtitle="Adds fuel to the tank against a supplier invoice" />
          <DeliveryForm tanks={data.tankOptions} />
        </Card>

        <Card>
          <SectionTitle icon={ListOrdered} title="Delivery History" subtitle="Every tanker received, cost per litre and margin at today's rate" />
          <FuelPurchasesTable deliveries={data.deliveries} />
        </Card>
      </div>
    </div>
  );
}
