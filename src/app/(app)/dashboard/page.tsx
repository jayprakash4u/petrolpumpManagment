import { AlertTriangle, TrendingUp, Fuel, CreditCard, Users } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { TankLevelsCard } from "@/components/dashboard/TankLevelsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";

function formatCompactRs(amount: number): string {
  if (amount >= 100000) {
    return `Rs ${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `Rs ${(amount / 1000).toFixed(1)}K`;
  }
  return `Rs ${amount}`;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.stationId);

  const cashNum = data.cashTotal.toNumber();
  const creditNum = data.creditTotal.toNumber();
  const cashCreditText = `${formatCompactRs(cashNum)} / ${formatCompactRs(creditNum)}`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Low Stock Alert if any tank is below safety buffer */}
      {data.lowStockTanks.length > 0 && (
        <div className="animate-fade-in flex items-center justify-between rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-text">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-error animate-bounce" />
            <span className="text-[13px] font-medium">
              Low Stock Warning:{" "}
              <strong>{data.lowStockTanks.map((t) => FUEL_LABEL[t.fuel]).join(", ")}</strong>{" "}
              is below the safety threshold. Refill indent recommended.
            </span>
          </div>
          <a
            href="/purchases/fuel"
            className="rounded-lg bg-error px-3 py-1 text-[11.5px] font-bold text-white hover:bg-error/90"
          >
            Create Refill Indent
          </a>
        </div>
      )}

      {/* 1. TOP STATS BAR: Understand the station in 10 seconds */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={fmtRs(data.totalRevenue)}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Fuel Sold"
          value={fmtL(data.totalLiters)}
          icon={Fuel}
          tone="text"
        />
        <StatCard
          label="Cash / Credit"
          value={cashCreditText}
          icon={CreditCard}
          tone="text"
          small
        />
        <StatCard
          label="Staff On Shift"
          value={`${data.onShiftCount} / ${data.staffCount}`}
          icon={Users}
          tone="success"
        />
      </div>

      {/* 2. QUICK ACTIONS */}
      <QuickActions />

      {/* 3. TANK LEVELS & 4. RECENT ACTIVITY (Grid Layout) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Tank Levels (5 cols) */}
        <div className="lg:col-span-5">
          <TankLevelsCard tanks={data.tanks} />
        </div>

        {/* Recent Activity (7 cols) */}
        <div className="lg:col-span-7">
          <RecentActivityCard sales={data.recentSales} />
        </div>
      </div>
    </div>
  );
}
