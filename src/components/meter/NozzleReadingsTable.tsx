"use client";

import { useState } from "react";
import { Gauge, CheckCircle2, Clock, Filter, AlertCircle } from "lucide-react";
import type { NozzleReadingEntry } from "@/lib/meter";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL, fmtRs, fmtRate } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";

export function NozzleReadingsTable({ readings }: { readings: NozzleReadingEntry[] }) {
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [selectedFuel, setSelectedFuel] = useState<string>("ALL");
  const [selectedDispenser, setSelectedDispenser] = useState<string>("ALL");

  const filtered = readings.filter((r) => {
    if (selectedShift !== "ALL" && r.shift !== selectedShift) return false;
    if (selectedFuel !== "ALL" && r.fuel !== selectedFuel) return false;
    if (selectedDispenser !== "ALL" && r.dispenserId !== selectedDispenser) return false;
    return true;
  });

  const totalVolume = filtered.reduce((sum, r) => sum + r.netSoldL, 0);
  const totalAmount = filtered.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalTestMeasure = filtered.reduce((sum, r) => sum + r.testMeasureL, 0);

  return (
    <div>
      {/* Filters Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>FILTERS:</span>
          </div>

          <div className="w-[180px]">
            <Select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Shifts</option>
              <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
              <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
              <option value="Shift 3 (Night)">Shift 3 (Night)</option>
            </Select>
          </div>

          <div className="w-[140px]">
            <Select
              value={selectedFuel}
              onChange={(e) => setSelectedFuel(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Fuels</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
            </Select>
          </div>

          <div className="w-[180px]">
            <Select
              value={selectedDispenser}
              onChange={(e) => setSelectedDispenser(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Dispensers</option>
              <option value="disp-1">Dispenser 01 (MPD North)</option>
              <option value="disp-2">Dispenser 02 (High-Speed)</option>
              <option value="disp-3">Dispenser 03 (CNG Bay)</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-text-muted">
            Filtered Volume: <strong className="font-data text-text">{fmtL(totalVolume)}</strong>
          </span>
          <span className="text-text-muted">
            Revenue: <strong className="font-data text-accent">{fmtRs(totalAmount)}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-[13.5px] text-text-muted">
          No nozzle reading records found matching the active filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">DATE / SHIFT</th>
                <th className="px-3 py-2.5 font-medium">DISPENSER / NOZZLE</th>
                <th className="px-3 py-2.5 font-medium">ATTENDANT</th>
                <th className="px-3 py-2.5 text-right font-medium">OPENING (L)</th>
                <th className="px-3 py-2.5 text-right font-medium">CLOSING (L)</th>
                <th className="px-3 py-2.5 text-right font-medium">TEST (L)</th>
                <th className="px-3 py-2.5 text-right font-medium">NET SOLD</th>
                <th className="px-3 py-2.5 text-right font-medium">RATE</th>
                <th className="px-3 py-2.5 text-right font-medium">AMOUNT</th>
                <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const Icon = FUEL_ICON[row.fuel];
                return (
                  <tr key={row.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                    <td className="px-3 py-3 font-data text-[12.5px] text-text">
                      <div className="font-semibold">{row.dateBS}</div>
                      <div className="text-[11px] text-text-muted">{row.shift}</div>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0 text-accent" />
                        <div>
                          <div className="font-display text-[13px] font-semibold text-text">
                            {row.dispenserName}
                          </div>
                          <div className="font-data text-[11px] text-text-muted">
                            {FUEL_LABEL[row.fuel]} · Nozzle {row.nozzleId.split("-").pop()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-[12.5px] font-medium text-text">
                      {row.attendantName}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">
                      {row.openingElectronic.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12.5px] font-semibold text-text">
                      {row.closingElectronic.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12px] text-text-muted">
                      {row.testMeasureL > 0 ? (
                        <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-accent">
                          -{row.testMeasureL} L
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                      {fmtL(row.netSoldL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[12px] text-text-muted">
                      {fmtRate(row.ratePerL)}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                      {fmtRs(row.totalAmount)}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {row.status === "reconciled" ? (
                        <Badge tone="success">
                          <CheckCircle2 size={10} />
                          RECONCILED
                        </Badge>
                      ) : row.status === "verified" ? (
                        <Badge tone="accent">
                          <CheckCircle2 size={10} />
                          VERIFIED
                        </Badge>
                      ) : (
                        <Badge tone="muted">
                          <Clock size={10} />
                          PENDING
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-surface-hi/50 font-data text-[12.5px] font-semibold text-text">
                <td colSpan={3} className="px-3 py-2.5 text-left font-display">
                  Total Summary ({filtered.length} nozzles)
                </td>
                <td colSpan={2} />
                <td className="px-3 py-2.5 text-right text-text-muted">
                  {totalTestMeasure > 0 ? `-${totalTestMeasure} L test` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-text">{fmtL(totalVolume)}</td>
                <td />
                <td className="px-3 py-2.5 text-right font-bold text-accent">{fmtRs(totalAmount)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
