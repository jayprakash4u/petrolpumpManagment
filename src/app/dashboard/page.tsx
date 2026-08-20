import { AlertTriangle, TrendingUp, Fuel, CreditCard, Users } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { FuelRevenueChart } from "@/components/dashboard/FuelRevenueChart";
import { TankLevelRow } from "@/components/dashboard/TankLevelRow";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.stationId);

  return (
    <div>
      {data.lowStockTanks.length > 0 && (
        <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-[10px] border border-error/30 bg-error/8 px-[15px] py-[11px]">
          <AlertTriangle size={16} className="shrink-0 text-error" />
          <span className="text-[13.5px] text-text">
            Low stock alert: {data.lowStockTanks.map((t) => FUEL_LABEL[t.fuel]).join(", ")} below threshold — schedule a refill.
          </span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={fmtRs(data.totalRevenue)} icon={TrendingUp} tone="accent" />
        <StatCard label="Fuel Sold" value={fmtL(data.totalLiters)} icon={Fuel} tone="text" />
        <StatCard
          label="Cash / Credit"
          value={`${fmtRs(data.cashTotal)} / ${fmtRs(data.creditTotal)}`}
          icon={CreditCard}
          tone="text"
          small
        />
        <StatCard label="Staff On Shift" value={`${data.onShiftCount} / ${data.staffCount}`} icon={Users} tone="success" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp} title="Revenue Trend" subtitle="Sales through the day" />
          <RevenueTrendChart data={data.revenueTrend} />
        </Card>

        <Card>
          <SectionTitle icon={Fuel} title="Fuel-wise Sales" subtitle="Revenue split" />
          <FuelRevenueChart data={data.revenueByFuel} />
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Fuel} title="Tank Levels" subtitle="Live capacity across all tanks" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.tanks.map((t) => (
            <TankLevelRow key={t.id} tank={t} />
          ))}
        </div>
      </Card>
    </div>
  );
}
