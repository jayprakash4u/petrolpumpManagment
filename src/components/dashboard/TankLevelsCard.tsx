import { Fuel, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import type { Tank } from "@prisma/client";

const FUEL_COLOR_CONFIG: Record<
  FuelId,
  { barColor: string; trackColor: string; badgeTone: string; accentColor: string }
> = {
  PETROL: {
    barColor: "bg-amber-500",
    trackColor: "bg-amber-500/15",
    badgeTone: "text-amber-400",
    accentColor: "border-amber-500/30",
  },
  DIESEL: {
    barColor: "bg-blue-500",
    trackColor: "bg-blue-500/15",
    badgeTone: "text-blue-400",
    accentColor: "border-blue-500/30",
  },
  CNG: {
    barColor: "bg-emerald-500",
    trackColor: "bg-emerald-500/15",
    badgeTone: "text-emerald-400",
    accentColor: "border-emerald-500/30",
  },
};

export function TankLevelsCard({ tanks }: { tanks: Tank[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Fuel size={17} />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-bold text-text">
              Tank Levels (ट्याङ्की मौज्दात)
            </h3>
            <p className="text-[11.5px] text-text-muted">
              Live underground tank capacity & remaining volume
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {tanks.map((tank) => {
          const fuelId = tank.fuel as FuelId;
          const config = FUEL_COLOR_CONFIG[fuelId] || FUEL_COLOR_CONFIG.PETROL;
          const pct = Math.min(
            100,
            Math.max(0, Math.round(tank.levelL.div(tank.capacityL).mul(100).toNumber()))
          );
          const isLow = pct <= tank.lowStockPct.toNumber();

          return (
            <div key={tank.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isLow ? "bg-error animate-ping" : config.barColor
                    }`}
                  />
                  <span className="font-display font-bold text-text">
                    {FUEL_LABEL[fuelId]}
                  </span>
                  <span className="text-[11.5px] text-text-muted">
                    ({fmtL(tank.levelL)} / {fmtL(tank.capacityL)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isLow && (
                    <span className="inline-flex items-center gap-1 rounded bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      <AlertTriangle size={12} /> Low Stock Refill
                    </span>
                  )}
                  <span
                    className={`font-data font-bold text-[14px] ${
                      isLow ? "text-error" : "text-text"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className={`h-3 w-full overflow-hidden rounded-full ${config.trackColor}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLow ? "bg-error" : config.barColor
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
