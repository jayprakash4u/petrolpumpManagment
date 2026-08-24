"use client";

import { useState } from "react";
import { Ruler, Droplets, AlertTriangle, CheckCircle2, ShieldCheck, Thermometer, Filter } from "lucide-react";
import type { TankDipEntry } from "@/lib/meter";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";

export function TankDipTable({ dips }: { dips: TankDipEntry[] }) {
  const [selectedTank, setSelectedTank] = useState<string>("ALL");
  const [selectedFuel, setSelectedFuel] = useState<string>("ALL");

  const filtered = dips.filter((d) => {
    if (selectedTank !== "ALL" && d.tankId !== selectedTank) return false;
    if (selectedFuel !== "ALL" && d.fuel !== selectedFuel) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>TANK FILTER:</span>
          </div>

          <div className="w-[180px]">
            <Select value={selectedTank} onChange={(e) => setSelectedTank(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Tanks</option>
              <option value="tank-petrol-1">Tank 1 (Petrol)</option>
              <option value="tank-diesel-1">Tank 2 (Diesel)</option>
              <option value="tank-cng-1">Bank 3 (CNG)</option>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select value={selectedFuel} onChange={(e) => setSelectedFuel(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Fuels</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Droplets size={13} className="text-accent" />
          <span>Kolor Kut Water Detection: <strong className="text-success">0 mm across all tanks</strong></span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[13.5px] text-text-muted">
          No tank dip logs found matching current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">DATE / TIME (BS)</th>
                <th className="px-3 py-2.5 font-medium">TANK / FUEL</th>
                <th className="px-3 py-2.5 text-right font-medium">DIP LEVEL</th>
                <th className="px-3 py-2.5 text-center font-medium">WATER DIP</th>
                <th className="px-3 py-2.5 text-right font-medium">PHYSICAL STOCK</th>
                <th className="px-3 py-2.5 text-right font-medium">BOOK STOCK</th>
                <th className="px-3 py-2.5 text-right font-medium">VARIANCE</th>
                <th className="px-3 py-2.5 text-center font-medium">TEMP / DENSITY</th>
                <th className="px-3 py-2.5 font-medium">SUPERVISOR</th>
                <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const Icon = FUEL_ICON[row.fuel];
                const isLoss = row.varianceL < 0;
                return (
                  <tr key={row.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                    <td className="px-3 py-3 font-data text-[12.5px] text-text">
                      <div className="font-semibold">{row.dateBS}</div>
                      <div className="text-[11px] text-text-muted">{row.time} · {row.shift.split(" ")[0]}</div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0 text-accent" />
                        <div>
                          <div className="font-display text-[13px] font-semibold text-text">{row.tankName}</div>
                          <div className="font-data text-[11px] text-text-muted">Cap: {fmtL(row.capacityL)}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-semibold text-accent">
                      {row.dipHeightCm.toFixed(1)} cm
                    </td>

                    <td className="px-3 py-3 text-center font-data text-[12px]">
                      {row.waterDipMm === 0 ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 size={12} />
                          0 mm (Nil)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-error">
                          <AlertTriangle size={12} />
                          {row.waterDipMm} mm
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                      {fmtL(row.physicalVolumeL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                      {fmtL(row.bookStockL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px]">
                      <span className={isLoss ? "text-error font-semibold" : "text-success font-semibold"}>
                        {row.varianceL > 0 ? `+${fmtL(row.varianceL)}` : fmtL(row.varianceL)}
                      </span>
                      <div className="text-[10.5px] text-text-muted">
                        ({row.variancePct > 0 ? `+${row.variancePct.toFixed(2)}` : row.variancePct.toFixed(2)}%)
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center font-data text-[11.5px] text-text-muted">
                      <div>{row.temperatureC}°C</div>
                      <div className="text-[10px]">{row.density15C} kg/m³</div>
                    </td>

                    <td className="px-3 py-3 text-[12.5px] text-text">
                      {row.recordedBy}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {row.status === "normal" ? (
                        <Badge tone="success">
                          <ShieldCheck size={10} />
                          NORMAL
                        </Badge>
                      ) : row.status === "tolerable" ? (
                        <Badge tone="accent">
                          <AlertTriangle size={10} />
                          TOLERABLE
                        </Badge>
                      ) : (
                        <Badge tone="error">
                          <AlertTriangle size={10} />
                          CHECK TANK
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
