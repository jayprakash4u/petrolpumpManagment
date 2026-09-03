import Link from "next/link";
import { Fuel, IndianRupee, History, AlertTriangle, TruckIcon } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can, type Role } from "@/lib/permissions";
import { getStockPageData } from "@/lib/queries/stock";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TankGauge } from "@/components/stock/TankGauge";
import { RateEditor } from "@/components/stock/RateEditor";
import { RateHistory } from "@/components/stock/StockHistory";
import { FUEL_LABEL } from "@/lib/fuel";

export default async function StockPage() {
  const user = await requireUser();
  const data = await getStockPageData(user.stationId);

  const lowTanks = data.tanks.filter((t) => t.low);

  return (
    <div>
      {lowTanks.length > 0 && (
        <div className="animate-fade-in mb-5 flex items-center justify-between gap-2 rounded-[10px] border border-error/30 bg-error/8 px-[15px] py-[11px]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-error" />
            <span className="text-[13.5px] text-text">
              {lowTanks.map((t) => FUEL_LABEL[t.fuel]).join(", ")} below the reorder threshold.
            </span>
          </div>
          <Link
            href="/purchases/fuel"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-error px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-error/90"
          >
            <TruckIcon size={13} /> Record Delivery
          </Link>
        </div>
      )}

      <Card className="mb-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle icon={Fuel} title="Tank Levels" subtitle="Live stock, pump rate, and room for the next delivery" />
          <Link
            href="/purchases/fuel"
            className="flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-accent hover:underline"
          >
            <TruckIcon size={13} /> Record a Delivery
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tanks.map((t) => (
            <TankGauge key={t.id} tank={t} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <SectionTitle icon={IndianRupee} title="Change Pump Rate" subtitle="Applies to every sale from now on" />
          <RateEditor tanks={data.tankOptions} canEdit={can(user.role as Role, "editFuelRate")} />
        </Card>

        <Card>
          <SectionTitle icon={History} title="Rate Changes" subtitle="Who repriced what, and when" />
          <RateHistory history={data.rateHistory} />
        </Card>
      </div>
    </div>
  );
}
