"use client";

import { useState } from "react";
import { Search, Fuel as FuelIcon } from "lucide-react";
import type { FuelPurchaseRow } from "@/lib/queries/fuel-purchases";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL, fmtRs, fmtRate } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { Input, Select } from "@/components/ui/Field";

/**
 * Real delivery history — every row here is an actual `Purchase` record,
 * the same one `recordDeliveryAction` writes and Tank & Stock's ledger
 * reconciles against. Search and fuel filter run over that real data.
 */
export function FuelPurchasesTable({ deliveries }: { deliveries: FuelPurchaseRow[] }) {
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("ALL");

  const filtered = deliveries.filter((d) => {
    if (fuelFilter !== "ALL" && d.fuel !== fuelFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchInvoice = d.invoiceNo?.toLowerCase().includes(q) ?? false;
      const matchSupplier = d.supplier.toLowerCase().includes(q);
      if (!matchInvoice && !matchSupplier) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="relative w-[220px]">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search invoice or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="py-1.5 pr-3 pl-8 text-xs"
          />
        </div>

        <div className="w-[140px]">
          <Select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)} className="py-1.5 text-xs">
            <option value="ALL">All Fuels</option>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="CNG">CNG</option>
          </Select>
        </div>

        <span className="ml-auto text-[11.5px] text-text-muted">
          {filtered.length} of {deliveries.length} deliveries
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13.5px] text-text-muted">
          {deliveries.length === 0 ? "No deliveries recorded yet." : `No deliveries match "${search || fuelFilter}".`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium">RECEIVED</th>
                <th className="px-3 py-2.5 font-medium">FUEL</th>
                <th className="px-3 py-2.5 text-right font-medium">VOLUME</th>
                <th className="px-3 py-2.5 text-right font-medium">RATE / L</th>
                <th className="px-3 py-2.5 text-right font-medium">TOTAL COST</th>
                <th className="px-3 py-2.5 text-right font-medium">MARGIN / L</th>
                <th className="px-3 py-2.5 font-medium">SUPPLIER / INVOICE</th>
                <th className="px-3 py-2.5 font-medium">RECORDED BY</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const Icon = FUEL_ICON[d.fuel] ?? FuelIcon;
                return (
                  <tr key={d.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                    <td className="px-3 py-3 font-data text-[11.5px] text-text-muted">{fmtBSDateTime(d.createdAt)}</td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="shrink-0 text-accent" />
                        <span className="font-display text-[13px] font-semibold text-text">{FUEL_LABEL[d.fuel]}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">{fmtL(d.liters)}</td>

                    <td className="px-3 py-3 text-right font-data text-[12px] text-text-muted">
                      {d.costPerL ? fmtRate(d.costPerL) : "—"}
                    </td>

                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">{fmtRs(d.totalCost)}</td>

                    <td
                      className={
                        "px-3 py-3 text-right font-data text-[12px] font-semibold " +
                        (d.margin === null ? "text-text-muted" : Number(d.margin) < 0 ? "text-error" : "text-success")
                      }
                    >
                      {d.margin ? fmtRate(d.margin) : "—"}
                    </td>

                    <td className="px-3 py-3 text-xs">
                      <div className="font-medium text-text">{d.supplier}</div>
                      {d.invoiceNo && <div className="font-data text-[11px] text-text-muted">#{d.invoiceNo}</div>}
                    </td>

                    <td className="px-3 py-3 text-[12px] text-text-muted">{d.recordedBy?.name ?? "—"}</td>
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
