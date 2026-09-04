"use client";

import { useState, useMemo } from "react";
import {
  Car,
  Search,
  Printer,
  Download,
  Fuel,
  FileText,
  Clock,
  User,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import type { VehicleBillingData, VehicleSummaryRow, VehicleFillDetail } from "@/lib/queries/vehicles";

const ITEMS_PER_PAGE = 10;

export function VehicleBillingView({
  initialData,
}: {
  initialData: VehicleBillingData;
}) {
  const [vehicles, setVehicles] = useState<VehicleSummaryRow[]>(initialData.vehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [fuelFilter, setFuelFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSummaryRow | null>(null);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (fuelFilter !== "ALL" && v.primaryFuel !== fuelFilter) return false;
      if (customerFilter !== "ALL" && v.customerId !== customerFilter && v.customerName !== customerFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPlate = v.vehicleNo.toLowerCase().includes(q);
        const matchCust = v.customerName ? v.customerName.toLowerCase().includes(q) : false;
        if (!matchPlate && !matchCust) return false;
      }

      return true;
    });
  }, [vehicles, fuelFilter, customerFilter, searchQuery]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, page]);

  const handlePrintStatement = () => {
    window.print();
  };

  const handleExportVehicleLedger = (vehicle: VehicleSummaryRow) => {
    const headers = [
      "Receipt No",
      "Date (BS)",
      "Time",
      "Vehicle Plate",
      "Customer Account",
      "Fuel Grade",
      "Volume Dispensed (L)",
      "Unit Rate (NPR/L)",
      "Total Amount (NPR)",
      "Payment Mode",
      "Attendant",
    ];

    const rows = vehicle.fills.map((f) => [
      `"${f.receiptNo}"`,
      `"${f.dateBS}"`,
      `"${f.time}"`,
      `"${vehicle.vehicleNo}"`,
      `"${vehicle.customerName || "Retail Walk-In"}"`,
      `"${f.fuel}"`,
      `"${f.liters}"`,
      `"${f.rate}"`,
      `"${f.amount}"`,
      `"${f.payment}"`,
      `"${f.soldBy}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `vehicle_fuel_statement_${vehicle.vehicleNo.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllVehiclesCSV = () => {
    const headers = [
      "Vehicle Registration Plate",
      "Fleet Customer / Account",
      "Primary Fuel",
      "Total Fills",
      "Total Volume (Liters)",
      "Total Spend (NPR)",
      "Average Dispense (L/fill)",
      "Last Fueling Date (BS)",
      "Last Fueling Time",
    ];

    const rows = filteredVehicles.map((v) => [
      `"${v.vehicleNo}"`,
      `"${v.customerName || "Walk-In"}"`,
      `"${v.primaryFuel}"`,
      `"${v.fillCount}"`,
      `"${v.totalLiters}"`,
      `"${v.totalAmount}"`,
      `"${v.avgLitersPerFill.toFixed(2)}"`,
      `"${v.lastFillBS}"`,
      `"${v.lastFillTime}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `fleet_vehicles_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-[#1A1306] shadow-sm">
            <Car size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-text tracking-tight">
              Vehicle-wise Billing & Fleet Ledger (सवारी साधन इन्धन खपत खाता)
            </h1>
            <p className="text-xs text-text-muted">
              Individual vehicle fuel accounting, fleet consumption audit, and monthly vehicle statements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleExportAllVehiclesCSV} className="text-xs">
            <Download size={13} /> Export Fleet CSV
          </GhostButton>
        </div>
      </div>

      {/* 2. Search & Filters Strip (Single Line) */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Simple Clean Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 text-xs font-medium"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Inline Filter Dropdowns */}
          <div className="flex items-center gap-2.5 text-xs">
            <Select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs w-[180px]"
            >
              <option value="ALL">All Fleet Accounts</option>
              {initialData.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              value={fuelFilter}
              onChange={(e) => {
                setFuelFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs w-[130px]"
            >
              <option value="ALL">All Fuels</option>
              <option value="DIESEL">Diesel (HSD)</option>
              <option value="PETROL">Petrol (MS 91)</option>
              <option value="CNG">CNG</option>
            </Select>

            <span className="text-xs text-text-muted font-mono whitespace-nowrap pl-1">
              {filteredVehicles.length} vehicles
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fleet Vehicles Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[880px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Vehicle Plate</th>
                <th className="px-4 py-3">Fleet Account / Owner</th>
                <th className="px-3 py-3">Primary Fuel</th>
                <th className="px-3 py-3 text-right">Fills</th>
                <th className="px-3 py-3 text-right">Volume</th>
                <th className="px-4 py-3 text-right font-bold">Total Spend</th>
                <th className="px-3 py-3 text-right">Avg Fill</th>
                <th className="px-4 py-3 text-right">Last Fill (BS)</th>
                <th className="px-4 py-3 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted text-xs">
                    No vehicles found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((v) => {
                  const fuelId = v.primaryFuel as FuelId;
                  return (
                    <tr
                      key={v.vehicleNo}
                      onClick={() => setSelectedVehicle(v)}
                      className="hover:bg-surface-hi/40 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono bg-bg border border-border px-2 py-0.5 rounded text-xs font-bold text-accent">
                          {v.vehicleNo}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-text">
                        {v.customerName || (
                          <span className="text-text-muted text-[11px]">Retail Cash Sales</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={clsx(
                              "h-2 w-2 rounded-full",
                              fuelId === "PETROL"
                                ? "bg-amber-500"
                                : fuelId === "DIESEL"
                                ? "bg-blue-500"
                                : "bg-emerald-500"
                            )}
                          />
                          <span className="font-semibold text-text">{FUEL_LABEL[fuelId] || v.primaryFuel}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-text-muted">
                        {v.fillCount}
                      </td>

                      <td className="px-3 py-3 text-right font-mono font-medium text-text">
                        {fmtL(v.totalLiters)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-text">
                        {fmtRs(v.totalAmount)}
                      </td>

                      <td className="px-3 py-3 text-right font-mono text-text-muted">
                        {v.avgLitersPerFill.toFixed(1)} L
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-text-muted text-[11.5px]">
                        <div>{v.lastFillBS}</div>
                        <div className="text-[10px]">{v.lastFillTime}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <GhostButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicle(v);
                          }}
                          className="px-2.5 py-1 text-[11px]"
                        >
                          <FileText size={12} /> Statement
                        </GhostButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredVehicles.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs">
            <span className="text-text-muted font-mono">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filteredVehicles.length)} of{" "}
              {filteredVehicles.length} vehicles
            </span>

            <div className="flex items-center gap-1.5 font-mono">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={clsx(
                  "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                  page === 1
                    ? "opacity-40 cursor-not-allowed text-text-muted"
                    : "hover:bg-surface-hi text-text cursor-pointer"
                )}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="px-2 font-bold text-text">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={clsx(
                  "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                  page === totalPages
                    ? "opacity-40 cursor-not-allowed text-text-muted"
                    : "hover:bg-surface-hi text-text cursor-pointer"
                )}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Detailed Vehicle Statement Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-text">
                    Vehicle Fuel Statement: {selectedVehicle.vehicleNo}
                  </h3>
                  <p className="text-[11.5px] text-text-muted">
                    {selectedVehicle.customerName || "Retail Walk-In Customer"} · {selectedVehicle.fillCount} Total Fills
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Printable Statement Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="print-area rounded-xl border border-border bg-bg p-4 space-y-3 text-xs">
                {/* Official Statement Heading */}
                <div className="border-b border-dashed border-border pb-3 text-center">
                  <div className="font-display text-sm font-bold text-text">
                    FUEL STATION MANAGEMENT
                  </div>
                  <div className="text-[11px] text-text-muted">Vehicle Fuel Ledger & Audit Statement</div>
                  <div className="mt-1 font-bold text-accent text-xs font-mono">
                    सवारी साधन इन्धन खपत विवरण (VEHICLE FUEL STATEMENT)
                  </div>
                </div>

                {/* Vehicle Meta Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-surface p-3 rounded-lg border border-border font-mono">
                  <div>
                    <span className="text-text-muted block text-[10.5px] font-sans">Vehicle Plate:</span>
                    <span className="font-bold text-accent">
                      {selectedVehicle.vehicleNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10.5px] font-sans">Fleet Customer:</span>
                    <span className="font-medium text-text">
                      {selectedVehicle.customerName || "Retail Walk-In"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10.5px] font-sans">Total Volume:</span>
                    <span className="font-bold text-text">
                      {fmtL(selectedVehicle.totalLiters)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10.5px] font-sans">Cumulative Spend:</span>
                    <span className="font-bold text-accent">
                      {fmtRs(selectedVehicle.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Chronological Fills Table */}
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-text text-xs mb-1">
                    Chronological Fueling History ({selectedVehicle.fills.length} records):
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-[11.5px]">
                      <thead className="bg-surface-hi text-text-muted border-b border-border font-mono text-[10.5px]">
                        <tr>
                          <th className="px-2.5 py-2">Receipt #</th>
                          <th className="px-2.5 py-2">Date (BS)</th>
                          <th className="px-2.5 py-2">Fuel</th>
                          <th className="px-2.5 py-2 text-right">Volume</th>
                          <th className="px-2.5 py-2 text-right">Rate</th>
                          <th className="px-2.5 py-2 text-right font-bold">Amount</th>
                          <th className="px-2.5 py-2 text-center">Mode</th>
                          <th className="px-2.5 py-2">By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono">
                        {selectedVehicle.fills.map((f) => (
                          <tr key={f.id} className="hover:bg-surface-hi/40">
                            <td className="px-2.5 py-1.5 text-accent font-bold">
                              #{f.receiptNo}
                            </td>
                            <td className="px-2.5 py-1.5 text-text-muted">
                              {f.dateBS} {f.time}
                            </td>
                            <td className="px-2.5 py-1.5 font-sans font-medium text-text">
                              {FUEL_LABEL[f.fuel as FuelId] || f.fuel}
                            </td>
                            <td className="px-2.5 py-1.5 text-right font-medium">
                              {fmtL(f.liters)}
                            </td>
                            <td className="px-2.5 py-1.5 text-right text-text-muted">
                              Rs {f.rate.toFixed(2)}
                            </td>
                            <td className="px-2.5 py-1.5 text-right font-bold text-text">
                              {fmtRs(f.amount)}
                            </td>
                            <td className="px-2.5 py-1.5 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-semibold">
                                {f.payment}
                              </span>
                            </td>
                            <td className="px-2.5 py-1.5 font-sans text-text-muted">
                              {f.soldBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatory Footer */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] text-text-muted text-center border-t border-dashed border-border mt-4 font-sans">
                  <div>
                    <div className="border-t border-border pt-1">Station Manager / Seal</div>
                  </div>
                  <div>
                    <div className="border-t border-border pt-1">Fleet Representative</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-border bg-surface-hi px-5 py-3.5">
              <div className="flex gap-2">
                <GhostButton onClick={handlePrintStatement} className="text-xs">
                  <Printer size={13} /> Print Statement (PDF)
                </GhostButton>
                <GhostButton
                  onClick={() => handleExportVehicleLedger(selectedVehicle)}
                  className="text-xs"
                >
                  <Download size={13} /> Export CSV
                </GhostButton>
              </div>

              <GhostButton onClick={() => setSelectedVehicle(null)} className="text-xs">
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
