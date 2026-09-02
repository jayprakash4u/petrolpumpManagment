import { Ruler, Droplets, Warehouse, ShieldCheck, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { MeterSubnav } from "@/components/meter/MeterSubnav";
import { TankDipTable } from "@/components/meter/TankDipTable";
import { TankDipModal } from "@/components/meter/TankDipModal";
import { DipCalculatorWidget } from "@/components/meter/DipCalculatorWidget";
import { MOCK_TANK_DIPS } from "@/lib/mock/meter";
import { fmtL } from "@/lib/money";

export default async function TankDipReadingsPage() {
  await requireUser();

  const totalPhysicalStock = MOCK_TANK_DIPS.slice(0, 3).reduce((sum, d) => sum + d.physicalVolumeL, 0);
  const totalBookStock = MOCK_TANK_DIPS.slice(0, 3).reduce((sum, d) => sum + d.bookStockL, 0);
  const totalVarianceL = totalPhysicalStock - totalBookStock;
  const variancePct = totalBookStock > 0 ? (totalVarianceL / totalBookStock) * 100 : 0;

  return (
    <div>
      <MeterSubnav />

      {/* Summary Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Physical Tank Stock" value={fmtL(totalPhysicalStock)} icon={Warehouse} tone="text" />
        <StatCard label="Ledger Book Stock" value={fmtL(totalBookStock)} icon={Ruler} tone="text" />
        <StatCard
          label="Cumulative Variance"
          value={`${fmtL(totalVarianceL)} (${variancePct.toFixed(2)}%)`}
          icon={ShieldCheck}
          tone={Math.abs(variancePct) <= 0.2 ? "success" : "accent"}
        />
        <StatCard
          label="Water Dip Detected"
          value="0 mm (Nil)"
          icon={Droplets}
          tone="success"
        />
      </div>

      {/* Supervisory Notice */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Physical dip readings measure the actual liquid volume in underground tanks using dipsticks and tank
          calibration charts. Checking water paste (Kolor Kut) prevents water contamination, while temperature & density
          readings verify fuel quality standards.
        </p>
      </div>

      {/* Interactive Dip-to-Litre Tool */}
      <div className="mb-6">
        <DipCalculatorWidget />
      </div>

      {/* Tank Dip Register */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            icon={Ruler}
            title="Tank Dip Reading Register"
            subtitle="Physical vs book stock comparison and water level audit trail"
          />
          <TankDipModal />
        </div>

        <TankDipTable dips={MOCK_TANK_DIPS} />
      </Card>
    </div>
  );
}
