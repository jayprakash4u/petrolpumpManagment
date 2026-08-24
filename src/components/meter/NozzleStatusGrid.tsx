import { Gauge, UserCheck, CheckCircle2 } from "lucide-react";
import type { DispenserNozzle } from "@/lib/meter";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtRate, fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";

export function NozzleStatusGrid({ nozzles }: { nozzles: DispenserNozzle[] }) {
  // Group nozzles by dispenser
  const dispensers = nozzles.reduce<Record<string, { name: string; nozzles: DispenserNozzle[] }>>((acc, n) => {
    if (!acc[n.dispenserId]) {
      acc[n.dispenserId] = { name: n.dispenserName, nozzles: [] };
    }
    acc[n.dispenserId].nozzles.push(n);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(dispensers).map(([dispId, disp]) => (
        <div key={dispId} className="rounded-xl border border-border bg-bg p-4 transition-colors hover:border-border/80">
          <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-hi text-accent">
                <Gauge size={15} />
              </div>
              <span className="font-display text-[14px] font-semibold text-text">{disp.name}</span>
            </div>
            <Badge tone="success">
              <CheckCircle2 size={11} />
              ONLINE
            </Badge>
          </div>

          <div className="flex flex-col gap-3">
            {disp.nozzles.map((nz) => {
              const Icon = FUEL_ICON[nz.fuel];
              return (
                <div key={nz.id} className="rounded-lg border border-border/60 bg-surface/70 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-accent" />
                      <span className="font-display text-[13px] font-semibold text-text">
                        Nozzle {nz.nozzleNumber} · {FUEL_LABEL[nz.fuel]}
                      </span>
                    </div>
                    <span className="font-data text-[11px] font-medium text-text-muted">{fmtRate(nz.ratePerL)}/L</span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border/40 pt-2">
                    <div>
                      <div className="text-[10.5px] text-text-muted">Totaliser Meter</div>
                      <div className="font-data text-[13px] font-semibold text-text">
                        {fmtL(nz.currentElectronicTotaliser)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10.5px] text-text-muted">Attendant</div>
                      <div className="flex items-center justify-end gap-1 text-[12px] font-medium text-text">
                        <UserCheck size={12} className="text-accent" />
                        <span className="truncate">{nz.assignedAttendant.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
