import { Fuel, IndianRupee, Truck, History, AlertTriangle, Warehouse } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getStockPageData } from "@/lib/queries/stock";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { TankGauge } from "@/components/stock/TankGauge";
import { RateEditor } from "@/components/stock/RateEditor";
import { DeliveryForm } from "@/components/stock/DeliveryForm";
import { PurchaseHistory, RateHistory } from "@/components/stock/StockHistory";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";

export default async function StockPage() {
  const user = await requireUser();
  const data = await getStockPageData(user.stationId);

  const lowTanks = data.tanks.filter((t) => t.low);

  return (
    <div>
      {lowTanks.length > 0 && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-[10px] border border-error/30 bg-error/8 px-[15px] py-[11px]">
          <AlertTriangle size={16} className="shrink-0 text-error" />
          <span className="text-[13.5px] text-text">
            {lowTanks.map((t) => FUEL_LABEL[t.fuel]).join(", ")} below the reorder threshold — schedule a delivery.
          </span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Fuel In Ground" value={fmtL(data.totalStockL)} icon={Warehouse} tone="text" />
        <StatCard label="Stock Value" value={fmtRs(data.stockValue)} icon={IndianRupee} tone="accent" />
        <StatCard label="Total Capacity" value={fmtL(data.totalCapacityL)} icon={Fuel} tone="text" />
        <StatCard
          label="Tanks Low"
          value={`${data.lowStockCount} / ${data.tanks.length}`}
          icon={AlertTriangle}
          tone={data.lowStockCount > 0 ? "accent" : "success"}
        />
      </div>

      <Card className="mb-4">
        <SectionTitle icon={Fuel} title="Tank Levels" subtitle="Live stock, pump rate, and room for the next delivery" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tanks.map((t) => (
            <TankGauge key={t.id} tank={t} />
          ))}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Truck} title="Record Delivery" subtitle="Adds fuel to the tank against a supplier invoice" />
          <DeliveryForm tanks={data.tankOptions} canRecord={can(user.role, "recordPurchase")} />
        </Card>

        <Card>
          <SectionTitle icon={IndianRupee} title="Change Pump Rate" subtitle="Applies to every sale from now on" />
          <RateEditor tanks={data.tankOptions} canEdit={can(user.role, "editFuelRate")} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <SectionTitle icon={Truck} title="Recent Deliveries" subtitle="Cost per litre and margin at today's rate" />
          <PurchaseHistory purchases={data.purchases} />
        </Card>

        <Card>
          <SectionTitle icon={History} title="Rate Changes" subtitle="Who repriced what, and when" />
          <RateHistory history={data.rateHistory} />
        </Card>
      </div>
    </div>
  );
}
