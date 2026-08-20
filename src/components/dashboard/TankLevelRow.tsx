import { clsx } from "clsx";
import { fmtL } from "@/lib/money";
import { FUEL_LABEL } from "@/lib/fuel";
import type { Tank } from "@prisma/client";

export function TankLevelRow({ tank }: { tank: Tank }) {
  const pct = tank.levelL.div(tank.capacityL).mul(100).toNumber();
  const low = pct < tank.lowStockPct.toNumber();

  return (
    <div className="flex items-center justify-between rounded-[10px] border border-border bg-bg p-3.5">
      <div>
        <div className="text-sm font-semibold text-text">{FUEL_LABEL[tank.fuel]}</div>
        <div className="font-data mt-0.5 text-[11.5px] text-text-muted">{fmtL(tank.levelL)}</div>
      </div>
      <div className={clsx("font-data text-lg font-bold", low ? "text-error" : "text-accent")}>{pct.toFixed(0)}%</div>
    </div>
  );
}
