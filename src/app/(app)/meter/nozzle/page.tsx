import { Gauge, TrendingUp, Fuel, Info, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { MeterSubnav } from "@/components/meter/MeterSubnav";
import { NozzleReadingsTable } from "@/components/meter/NozzleReadingsTable";
import { NozzleEntryModal } from "@/components/meter/NozzleEntryModal";
import { MOCK_NOZZLE_READINGS, MOCK_DISPENSERS_AND_NOZZLES } from "@/lib/mock/meter";
import { fmtL, fmtRs } from "@/lib/money";

export default async function NozzleReadingsPage() {
  await requireUser();

  const totalSoldL = MOCK_NOZZLE_READINGS.reduce((sum, r) => sum + r.netSoldL, 0);
  const totalRevenue = MOCK_NOZZLE_READINGS.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalTestMeasuresL = MOCK_NOZZLE_READINGS.reduce((sum, r) => sum + r.testMeasureL, 0);

  return (
    <div>
      <MeterSubnav />

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Fuel Pumped" value={fmtL(totalSoldL)} icon={Fuel} tone="text" />
        <StatCard label="Total Expected Revenue" value={fmtRs(totalRevenue)} icon={TrendingUp} tone="accent" />
        <StatCard
          label="Test Measures Deducted"
          value={fmtL(totalTestMeasuresL)}
          icon={Gauge}
          tone="text"
        />
        <StatCard
          label="Active Dispensers"
          value={`${MOCK_DISPENSERS_AND_NOZZLES.length} Nozzles`}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Operations Info Banner */}
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-xs leading-relaxed text-text-muted">
          Dispenser totalisers are recorded per shift. Calibration test measures (e.g. 5L standard measure can) are
          automatically deducted from the totaliser delta so attendants are not held liable for fuel poured back into
          underground tanks.
        </p>
      </div>

      {/* Table Card with Modal Action */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            icon={Gauge}
            title="Nozzle Totaliser Readings"
            subtitle="Opening, closing, and net sold volume logs per shift"
          />
          <NozzleEntryModal />
        </div>

        <NozzleReadingsTable readings={MOCK_NOZZLE_READINGS} />
      </Card>
    </div>
  );
}
