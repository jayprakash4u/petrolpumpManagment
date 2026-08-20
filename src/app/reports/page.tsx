import { BarChart3, TrendingUp, Fuel, Receipt, Users, Banknote, Lock, CalendarRange } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getReportData } from "@/lib/queries/reports";
import { resolveRange, describeRange } from "@/lib/reports";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { DailyTrendChart } from "@/components/reports/DailyTrendChart";
import { RangePicker, FuelBreakdown, StaffBreakdown, CashMovement } from "@/components/reports/ReportViews";
import { fmtRs, fmtL } from "@/lib/money";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const user = await requireUser();

  // The nav hides this page from roles that can't use it, but hiding a link
  // is never the control — the page itself refuses.
  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <div className="mb-3 flex justify-center text-text-muted">
          <Lock size={28} />
        </div>
        <h2 className="font-display text-[17px] font-semibold text-text">Reports are restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">
          Station reports are available to owners and managers. Your shift figures are on the Employees page.
        </p>
      </Card>
    );
  }

  const params = await searchParams;
  const range = resolveRange(first(params.preset), first(params.from), first(params.to));
  const data = await getReportData(user.stationId, range);

  return (
    <div>
      <RangePicker range={range} />

      <div className="mb-4 flex items-center gap-2 text-[13px] text-text-muted">
        <CalendarRange size={15} className="text-accent" />
        <span className="text-text">{describeRange(range)}</span>
        <span>
          · {data.totalDays} {data.totalDays === 1 ? "day" : "days"} · {data.saleCount} sales
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={fmtRs(data.revenue)} icon={TrendingUp} tone="accent" />
        <StatCard label="Fuel Sold" value={fmtL(data.liters)} icon={Fuel} tone="text" />
        <StatCard
          label="Cash / Credit"
          value={`${fmtRs(data.cash)} / ${fmtRs(data.credit)}`}
          icon={Banknote}
          tone="text"
          small
        />
        <StatCard label="Revenue / Day" value={fmtRs(data.dailyAverage)} icon={BarChart3} tone="success" />
      </div>

      <Card className="mb-4">
        <SectionTitle icon={TrendingUp} title="Revenue Trend" subtitle={`Daily takings across ${describeRange(range).toLowerCase()}`} />
        <DailyTrendChart data={data.trend} />
      </Card>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle icon={Fuel} title="Fuel-wise Breakdown" subtitle="Sold and bought, with realised rate per litre" />
          <FuelBreakdown rows={data.fuelRows} />
        </Card>

        <Card>
          <SectionTitle icon={Banknote} title="Cash Movement" subtitle="In and out over the period" />
          <CashMovement data={data} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionTitle icon={Users} title="Staff-wise Breakdown" subtitle="Who sold what, ranked by revenue" />
          <StaffBreakdown rows={data.staffRows} />
        </Card>

        <Card className="h-fit">
          <SectionTitle icon={Receipt} title="Period Summary" subtitle="At a glance" />
          <dl className="flex flex-col gap-2">
            <Row label="Sales recorded" value={String(data.saleCount)} />
            <Row label="Average sale" value={data.averageSale ? fmtRs(data.averageSale) : "—"} />
            <Row label="Deliveries received" value={`${data.purchaseCount} · ${fmtRs(data.purchaseTotal)}`} />
            <Row label="Credit payments" value={`${data.paymentsCount} · ${fmtRs(data.paymentsCollected)}`} />
            <Row label="Voided sales" value={`${data.voidedCount} · ${fmtRs(data.voidedValue)}`} />
          </dl>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-lg border border-border bg-bg px-3 py-2.5">
      <dt className="text-[12.5px] text-text-muted">{label}</dt>
      <dd className="font-data text-[13px] font-semibold text-text">{value}</dd>
    </div>
  );
}
