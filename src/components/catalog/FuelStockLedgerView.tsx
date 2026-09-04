"use client";

import { useState, useMemo } from "react";
import { Fuel, Gauge, Calendar, Download, Printer, Filter } from "lucide-react";
import { fmtRs } from "@/lib/money";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";

interface LedgerRow {
  dateBS: string;
  fuel: "MS Petrol" | "HSD Diesel";
  openingStockL: number;
  inwardReceivedL: number;
  outwardSalesL: number;
  testingL: number;
  closingStockL: number;
  physicalDipL: number;
  varianceL: number;
  meterOpening: number;
  meterClosing: number;
  meterSalesL: number;
}

const MOCK_LEDGER_DATA: LedgerRow[] = [
  {
    dateBS: "2083-05-19",
    fuel: "HSD Diesel",
    openingStockL: 24200,
    inwardReceivedL: 8000,
    outwardSalesL: 3750,
    testingL: 10,
    closingStockL: 28440,
    physicalDipL: 28400,
    varianceL: -40,
    meterOpening: 849200,
    meterClosing: 852950,
    meterSalesL: 3750,
  },
  {
    dateBS: "2083-05-19",
    fuel: "MS Petrol",
    openingStockL: 11900,
    inwardReceivedL: 4000,
    outwardSalesL: 1630,
    testingL: 5,
    closingStockL: 14265,
    physicalDipL: 14250,
    varianceL: -15,
    meterOpening: 412900,
    meterClosing: 414530,
    meterSalesL: 1630,
  },
  {
    dateBS: "2083-05-18",
    fuel: "HSD Diesel",
    openingStockL: 27800,
    inwardReceivedL: 0,
    outwardSalesL: 3580,
    testingL: 20,
    closingStockL: 24200,
    physicalDipL: 24200,
    varianceL: 0,
    meterOpening: 845620,
    meterClosing: 849200,
    meterSalesL: 3580,
  },
  {
    dateBS: "2083-05-18",
    fuel: "MS Petrol",
    openingStockL: 13450,
    inwardReceivedL: 0,
    outwardSalesL: 1540,
    testingL: 10,
    closingStockL: 11900,
    physicalDipL: 11900,
    varianceL: 0,
    meterOpening: 411360,
    meterClosing: 412900,
    meterSalesL: 1540,
  },
];

export function FuelStockLedgerView({
  initialFuel = "ALL",
  initialMode = "PHYSICAL",
}: {
  initialFuel?: "ALL" | "DIESEL" | "PETROL";
  initialMode?: "PHYSICAL" | "METER";
}) {
  const [fuelFilter, setFuelFilter] = useState<"ALL" | "DIESEL" | "PETROL">(initialFuel);
  const [mode, setMode] = useState<"PHYSICAL" | "METER">(initialMode);

  const filtered = useMemo(() => {
    return MOCK_LEDGER_DATA.filter((r) => {
      if (fuelFilter === "DIESEL" && r.fuel !== "HSD Diesel") return false;
      if (fuelFilter === "PETROL" && r.fuel !== "MS Petrol") return false;
      return true;
    });
  }, [fuelFilter]);

  return (
    <div className="space-y-4">
      {/* View Switcher & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setMode("PHYSICAL")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all ${
                mode === "PHYSICAL"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Fuel size={13} />
              <span>Physical Tank Dip Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("METER")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-all ${
                mode === "METER"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Gauge size={13} />
              <span>Pump Meter Totalizer Ledger</span>
            </button>
          </div>

          <div className="w-[150px]">
            <Select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value as any)}
              className="py-1 text-xs w-full"
            >
              <option value="ALL">All Fuels</option>
              <option value="DIESEL">HSD Diesel</option>
              <option value="PETROL">MS Petrol</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton type="button" onClick={() => window.print()} className="h-8 px-2.5 text-xs gap-1.5">
            <Printer size={13} />
            <span>Print</span>
          </GhostButton>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-hi font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">FUEL PRODUCT</th>
              {mode === "PHYSICAL" ? (
                <>
                  <th className="px-3 py-2.5 text-right font-medium">OPENING (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">INWARD / DELIVERIES (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">SALES / OUTWARD (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">TESTING (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">CALCULATED CLOSING (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">PHYSICAL DIP (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">VARIANCE</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2.5 text-right font-medium">METER OPENING</th>
                  <th className="px-3 py-2.5 text-right font-medium">METER CLOSING</th>
                  <th className="px-3 py-2.5 text-right font-medium">DISPENSED VOLUME (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">TEST POUR BACK (L)</th>
                  <th className="px-3 py-2.5 text-right font-medium">NET BILLED SALES (L)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-b border-border/60 hover:bg-surface-hi/40 transition-colors">
                <td className="px-3 py-3 font-mono text-xs text-text font-medium">{r.dateBS}</td>
                <td className="px-3 py-3">
                  <Badge tone={r.fuel === "MS Petrol" ? "accent" : "muted"}>{r.fuel}</Badge>
                </td>
                {mode === "PHYSICAL" ? (
                  <>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text">{r.openingStockL.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-success font-semibold">
                      {r.inwardReceivedL > 0 ? `+${r.inwardReceivedL.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text">{r.outwardSalesL.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text-muted">{r.testingL}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text">{r.closingStockL.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold text-accent">{r.physicalDipL.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      <span className={r.varianceL < 0 ? "text-error font-bold" : "text-success font-bold"}>
                        {r.varianceL > 0 ? `+${r.varianceL}` : r.varianceL} L
                      </span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text-muted">{r.meterOpening.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text-muted">{r.meterClosing.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold text-text">{r.meterSalesL.toLocaleString()} L</td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text-muted">{r.testingL} L</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold text-accent">
                      {(r.meterSalesL - r.testingL).toLocaleString()} L
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
