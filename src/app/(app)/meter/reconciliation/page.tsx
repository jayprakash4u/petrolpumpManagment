import { ArrowRightLeft, TrendingUp, IndianRupee, ShieldCheck, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { MeterSubnav } from "@/components/meter/MeterSubnav";
import { ReconciliationMatrix } from "@/components/meter/ReconciliationMatrix";
import { MOCK_SHIFT_RECONCILIATION } from "@/lib/mock/meter";
import { fmtL, fmtRs } from "@/lib/money";

export default async function ShiftReconciliationPage() {
  await requireUser();

  const totalVol = MOCK_SHIFT_RECONCILIATION.fuels.reduce((sum, f) => sum + f.nozzleTotaliserSoldL, 0);

  return (
    <div>
      <MeterSubnav />

      {/* Summary Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Shift Sales" value={fmtL(totalVol)} icon={ArrowRightLeft} tone="text" />
        <StatCard
          label="Expected Meter Sales"
          value={fmtRs(MOCK_SHIFT_RECONCILIATION.financials.totalMeterRevenue)}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Settled Collections"
          value={fmtRs(MOCK_SHIFT_RECONCILIATION.financials.totalCollected)}
          icon={IndianRupee}
          tone="text"
        />
        <StatCard
          label="Cash Variance"
          value={`${fmtRs(MOCK_SHIFT_RECONCILIATION.financials.shortageSurplus)} (Nil)`}
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      {/* Notice Banner */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Shift reconciliation is the primary daily supervisory control at the petrol pump. It reconciles dispenser
          totalisers, POS sales bills, physical underground tank dips, and collected cash/credit chits to flag any
          discrepancy prior to attendant handover.
        </p>
      </div>

      {/* Reconciliation Matrix Card */}
      <Card>
        <SectionTitle
          icon={ShieldCheck}
          title="Daily Shift Reconciliation & Handover Matrix"
          subtitle="Three-way reconciliation: Dispenser Meters vs Physical Tank Depletion vs Collections"
        />
        <ReconciliationMatrix data={MOCK_SHIFT_RECONCILIATION} />
      </Card>
    </div>
  );
}
