"use client";

import { useState } from "react";
import { CalendarDays, Filter, Download, Printer } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs } from "@/lib/money";

interface IntervalStockItem {
  code: string;
  name: string;
  category: string;
  openingQty: number;
  inwardQty: number;
  outwardQty: number;
  adjustmentsQty: number;
  closingQty: number;
  unit: string;
  valuationNpr: number;
}

const MOCK_INTERVAL_DATA: IntervalStockItem[] = [
  {
    code: "FUEL-MS",
    name: "Motor Spirit (MS Petrol)",
    category: "Fuel",
    openingQty: 11900,
    inwardQty: 4000,
    outwardQty: 1630,
    adjustmentsQty: -20,
    closingQty: 14250,
    unit: "Litres",
    valuationNpr: 2315625,
  },
  {
    code: "FUEL-HSD",
    name: "High Speed Diesel (HSD)",
    category: "Fuel",
    openingQty: 24200,
    inwardQty: 8000,
    outwardQty: 3750,
    adjustmentsQty: -50,
    closingQty: 28400,
    unit: "Litres",
    valuationNpr: 4203200,
  },
  {
    code: "LUB-GP-4T",
    name: "Gulf Pride 4T Plus 20W-40 (1L)",
    category: "Lubricant",
    openingQty: 40,
    inwardQty: 20,
    outwardQty: 11,
    adjustmentsQty: -1,
    closingQty: 48,
    unit: "Bottles",
    valuationNpr: 24960,
  },
  {
    code: "LUB-GS-10W30",
    name: "Gulf Syntrac 4T 10W-30 (1L)",
    category: "Lubricant",
    openingQty: 25,
    inwardQty: 15,
    outwardQty: 8,
    adjustmentsQty: 0,
    closingQty: 32,
    unit: "Bottles",
    valuationNpr: 21760,
  },
  {
    code: "LUB-CAS-GTX",
    name: "Castrol GTX Diesel 15W-40 (5L Can)",
    category: "Lubricant",
    openingQty: 12,
    inwardQty: 10,
    outwardQty: 4,
    adjustmentsQty: 0,
    closingQty: 18,
    unit: "Cans",
    valuationNpr: 44100,
  },
];

export function IntervalStockReportView() {
  const [fromBS, setFromBS] = useState("2083-05-01");
  const [toBS, setToBS] = useState("2083-05-19");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = MOCK_INTERVAL_DATA.filter((item) => {
    if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
    return true;
  });

  const totalValuation = filtered.reduce((sum, item) => sum + item.valuationNpr, 0);

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-bg p-3">
        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            From Date (BS)
          </label>
          <Input
            type="text"
            value={fromBS}
            onChange={(e) => setFromBS(e.target.value)}
            className="py-1.5 px-2 text-xs font-mono w-[130px]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            To Date (BS)
          </label>
          <Input
            type="text"
            value={toBS}
            onChange={(e) => setToBS(e.target.value)}
            className="py-1.5 px-2 text-xs font-mono w-[130px]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            Category
          </label>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 text-xs w-[160px]"
          >
            <option value="ALL">All Categories</option>
            <option value="Fuel">Fuels Only</option>
            <option value="Lubricant">Lubricants Only</option>
          </Select>
        </div>

        <PrimaryButton type="button" className="h-8 px-4 text-xs font-semibold">
          Apply Interval
        </PrimaryButton>

        <div className="ml-auto flex gap-2">
          <GhostButton type="button" onClick={() => window.print()} className="h-8 px-2.5 text-xs gap-1.5">
            <Printer size={13} />
            <span>Print</span>
          </GhostButton>
        </div>
      </div>

      {/* Interval Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-hi font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">ITEM & SKU</th>
              <th className="px-3 py-2.5 text-right font-medium">OPENING STOCK</th>
              <th className="px-3 py-2.5 text-right font-medium">INWARD (PURCHASE)</th>
              <th className="px-3 py-2.5 text-right font-medium">OUTWARD (SALES)</th>
              <th className="px-3 py-2.5 text-right font-medium">ADJUSTMENTS</th>
              <th className="px-3 py-2.5 text-right font-medium">CLOSING BALANCE</th>
              <th className="px-3 py-2.5 text-right font-medium">CLOSING VALUATION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.code} className="border-b border-border/60 hover:bg-surface-hi/40 transition-colors">
                <td className="px-3 py-3">
                  <div className="font-display text-xs font-semibold text-text">{item.name}</div>
                  <span className="font-mono text-[10px] text-text-muted">{item.code}</span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-text">
                  {item.openingQty.toLocaleString()} {item.unit}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-success font-semibold">
                  +{item.inwardQty.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-text">
                  -{item.outwardQty.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs text-text-muted">
                  {item.adjustmentsQty !== 0 ? item.adjustmentsQty : "0"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs font-bold text-accent">
                  {item.closingQty.toLocaleString()} {item.unit}
                </td>
                <td className="px-3 py-3 text-right font-mono text-xs font-bold text-text">
                  {fmtRs(item.valuationNpr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-border bg-surface-hi/70 px-4 py-2 flex items-center justify-between text-xs text-text-muted font-sans">
          <span>
            Report Interval: <strong className="text-text font-mono">{fromBS}</strong> to{" "}
            <strong className="text-text font-mono">{toBS}</strong>
          </span>
          <span>
            Total Inventory Valuation: <strong className="text-accent font-mono font-bold">{fmtRs(totalValuation)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
