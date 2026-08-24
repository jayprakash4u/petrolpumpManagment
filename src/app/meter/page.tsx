import Link from "next/link";
import { Gauge, Ruler, ArrowRightLeft, TrendingUp, Fuel, CheckCircle2, Droplets, ChevronRight, ShieldCheck, Warehouse } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { MeterSubnav } from "@/components/meter/MeterSubnav";
import { NozzleStatusGrid } from "@/components/meter/NozzleStatusGrid";
import { MOCK_DISPENSERS_AND_NOZZLES, MOCK_METER_SUMMARY, MOCK_TANK_DIPS, MOCK_SHIFT_RECONCILIATION } from "@/lib/mock/meter";
import { fmtL, fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export default async function MeterOverviewPage() {
  await requireUser();

  return (
    <div>
      <MeterSubnav />

      {/* Summary Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pumped Today"
          value={fmtL(MOCK_METER_SUMMARY.totalPumpedTodayL)}
          icon={Fuel}
          tone="text"
        />
        <StatCard
          label="Meter Revenue"
          value={fmtRs(MOCK_METER_SUMMARY.totalMeterRevenueRs)}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Nozzles Operational"
          value={`${MOCK_METER_SUMMARY.activeNozzlesCount} / ${MOCK_METER_SUMMARY.totalNozzlesCount}`}
          icon={Gauge}
          tone="success"
        />
        <StatCard
          label="Dip Variance (Loss)"
          value={`${fmtL(MOCK_METER_SUMMARY.physicalDipVarianceL)} (${MOCK_METER_SUMMARY.dipVariancePct}%)`}
          icon={Ruler}
          tone="text"
          small
        />
      </div>

      {/* Module Fast Jump Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/meter/nozzle"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Gauge size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Nozzle Readings</h3>
          <p className="mt-1 text-xs text-text-muted">
            Track opening & closing totalisers, 5L calibration test deductions, and pump volume per shift.
          </p>
          <div className="mt-3 flex items-center gap-1.5 font-data text-[11px] font-semibold text-accent">
            <span>6 Active Nozzles</span>
            <span>·</span>
            <span>All Calibrated</span>
          </div>
        </Link>

        <Link
          href="/meter/dip"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <Ruler size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Tank Dip Readings</h3>
          <p className="mt-1 text-xs text-text-muted">
            Physical dipstick height (cm) conversion, water finding paste detection, and density checks.
          </p>
          <div className="mt-3 flex items-center gap-1.5 font-data text-[11px] font-semibold text-success">
            <Droplets size={12} />
            <span>0 mm Water Dip</span>
            <span>·</span>
            <span>Normal</span>
          </div>
        </Link>

        <Link
          href="/meter/reconciliation"
          className="group rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-accent/60 hover:bg-surface-hi"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-black">
              <ArrowRightLeft size={18} />
            </div>
            <ChevronRight size={16} className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
          <h3 className="font-display text-[15px] font-bold text-text group-hover:text-accent">Shift Reconciliation</h3>
          <p className="mt-1 text-xs text-text-muted">
            Daily audit linking Nozzle deltas, Physical dip depletion, POS sales, and cash collections.
          </p>
          <div className="mt-3 flex items-center gap-1.5 font-data text-[11px] font-semibold text-success">
            <ShieldCheck size={12} />
            <span>Shift 1 Reconciled</span>
            <span>·</span>
            <span>Rs 0 Diff</span>
          </div>
        </Link>
      </div>

      {/* Live Dispensers & Nozzles Status */}
      <Card className="mb-6">
        <SectionTitle
          icon={Gauge}
          title="Active Dispensers & Nozzles"
          subtitle="Live totalisers, assigned attendants, and pump rates across all bays"
        />
        <NozzleStatusGrid nozzles={MOCK_DISPENSERS_AND_NOZZLES} />
      </Card>

      {/* Two Columns: Latest Physical Dips & Shift Audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={Ruler}
              title="Latest Tank Physical Dips"
              subtitle="Calibrated liquid level measurements"
            />
            <Link href="/meter/dip" className="text-xs font-semibold text-accent hover:underline">
              View Register →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {MOCK_TANK_DIPS.slice(0, 3).map((dip) => (
              <div key={dip.id} className="flex items-center justify-between rounded-lg border border-border bg-bg p-3">
                <div>
                  <div className="font-display text-[13.5px] font-semibold text-text">{dip.tankName}</div>
                  <div className="font-data text-[11px] text-text-muted">
                    Dip: <span className="font-semibold text-accent">{dip.dipHeightCm} cm</span> · Water: 0mm
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-data text-[13px] font-bold text-text">{fmtL(dip.physicalVolumeL)}</div>
                  <div className="font-data text-[11px] text-text-muted">Book: {fmtL(dip.bookStockL)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle
              icon={ShieldCheck}
              title="Shift Reconciliation Status"
              subtitle="Operational close & cash balancing"
            />
            <Link href="/meter/reconciliation" className="text-xs font-semibold text-accent hover:underline">
              Audit Matrix →
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-text">{MOCK_SHIFT_RECONCILIATION.shift}</span>
              <Badge tone="success">
                <CheckCircle2 size={11} />
                SIGNED OFF
              </Badge>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-border/50 pt-3 text-xs text-text-muted">
              <div className="flex justify-between">
                <span>Total Fuel Dispensed</span>
                <span className="font-data font-semibold text-text">
                  {fmtL(MOCK_SHIFT_RECONCILIATION.fuels.reduce((s, f) => s + f.nozzleTotaliserSoldL, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Meter Revenue</span>
                <span className="font-data font-bold text-accent">
                  {fmtRs(MOCK_SHIFT_RECONCILIATION.financials.totalMeterRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Settled Collections</span>
                <span className="font-data font-semibold text-text">
                  {fmtRs(MOCK_SHIFT_RECONCILIATION.financials.totalCollected)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-success">
                <span>Cash Variance</span>
                <span className="font-data">{fmtRs(MOCK_SHIFT_RECONCILIATION.financials.shortageSurplus)} (Exact)</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
