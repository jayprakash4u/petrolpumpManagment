import { clsx } from "clsx";
import { AlertTriangle } from "lucide-react";
import type { StockPageData } from "@/lib/queries/stock";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL, fmtRate, toNum } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

/**
 * A tank at a glance: how full it is, what it's priced at, and how much room
 * is left for the next delivery. The bar is a plain scaled div rather than a
 * chart — it reads instantly and costs no client JS.
 */
export function TankGauge({ tank }: { tank: StockPageData["tanks"][number] }) {
  const pct = toNum(tank.pct);
  const Icon = FUEL_ICON[tank.fuel];

  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={tank.low ? "text-error" : "text-accent"} />
          <div>
            <div className="font-display text-[14.5px] font-semibold text-text">{FUEL_LABEL[tank.fuel]}</div>
            <div className="font-data text-[11px] text-text-muted">{fmtRate(tank.ratePerL)}/L</div>
          </div>
        </div>
        {tank.low && (
          <Badge tone="error">
            <AlertTriangle size={10} />
            LOW
          </Badge>
        )}
      </div>

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-hi">
        <div
          className={clsx("h-full rounded-full transition-[width]", tank.low ? "bg-error" : "bg-accent")}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between">
        <span className="font-data text-[13px] font-semibold text-text">{fmtL(tank.levelL)}</span>
        <span className={clsx("font-data text-[13px] font-bold", tank.low ? "text-error" : "text-accent")}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between text-[11.5px] text-text-muted">
        <span>of {fmtL(tank.capacityL)}</span>
        <span className="font-data">{fmtL(tank.room)} room</span>
      </div>
    </div>
  );
}
