"use client";

import { useState, useMemo } from "react";
import {
  Car,
  Search,
  Printer,
  Download,
  Fuel,
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import type { VehicleBillingData, VehicleSummaryRow, VehicleFillDetail } from "@/lib/queries/vehicles";

export function VehicleBillingView({
  initialData,
}: {
  initialData: VehicleBillingData;
}) {
  const [vehicles, setVehicles] = useState<VehicleSummaryRow[]>(initialData.vehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("ALL");
  const [fuelFilter, setFuelFilter] = useState("ALL");
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

  const aggregateMetrics = useMemo(() => {
    const totalAmount = filteredVehicles.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalLiters = filteredVehicles.reduce((sum, v) => sum + v.totalLiters, 0);
    const totalFills = filteredVehicles.reduce((sum, v) => sum + v.fillCount, 0);
    return {
      vehicleCount: filteredVehicles.length,
      totalAmount,
      totalLiters,
      totalFills,
    };
  }, [filteredVehicles]);

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
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Car size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Vehicle-wise Billing & Fleet Ledger (सवारी साधन इन्धन खपत खाता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Individual vehicle fuel accounting, fleet consumption audit, monthly vehicle statements, and VCTS reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleExportAllVehiclesCSV} className="text-[12.5px]">
            <Download size={14} /> Export Fleet CSV
          </GhostButton>
        </div>
      </div>

      {/* 2. Executive KPI Deck */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Tracked Fleet Vehicles"
          value={`${aggregateMetrics.vehicleCount} Vehicles`}
          icon={Car}
          tone="text"
        />
        <StatCard
          label="Billed to Vehicles"
          value={fmtRs(aggregateMetrics.totalAmount)}
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Fleet Volume Dispensed"
          value={fmtL(aggregateMetrics.totalLiters)}
          icon={Fuel}
          tone="text"
        />
        <StatCard
          label="No Plate Recorded"
          value={`${initialData.totals.unattributedCount} · ${fmtRs(initialData.totals.unattributedAmount)}`}
          icon={AlertTriangle}
          tone={initialData.totals.unattributedCount > 0 ? "accent" : "success"}
          small
        />
      </div>

      {/* Unattributed alert warning if attendants skipped plate */}
      {initialData.totals.unattributedCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/8 px-4 py-3 text-[12.5px] text-text-muted">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent" />
          <div>
            <strong className="text-text">
              {initialData.totals.unattributedCount} sales ({fmtL(initialData.totals.unattributedLiters)})
            </strong>{" "}
            were recorded without a vehicle plate in this period. Attendants are encouraged to key in registration plates for accurate institutional billing.
          </div>
        </div>
      )}

      {/* 3. Search & Filters Strip */}
      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Real-Time Vehicle Plate Search */}
          <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search Vehicle Plate (e.g. BA 2 KHA 1234, NA 3 KHA 9012) or Fleet Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11.5px] text-text-muted hover:text-text"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Strip */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Fleet Account:
          </div>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Fleet Accounts</option>
            {initialData.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-text-muted ml-2">
            Fuel Type:
          </div>
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Fuels</option>
            <option value="DIESEL">Diesel (HSD)</option>
            <option value="PETROL">Petrol (MS 91)</option>
            <option value="CNG">CNG</option>
          </select>

          <span className="text-[12px] text-text-muted ml-auto font-data">
            Showing <strong>{filteredVehicles.length}</strong> vehicles ranked by spend
          </span>
        </div>
      </div>

      {/* 4. Fleet Vehicles Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[880px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">VEHICLE PLATE</th>
                <th className="px-4 py-3.5">FLEET ACCOUNT / OWNER</th>
                <th className="px-3 py-3.5">PRIMARY FUEL</th>
                <th className="px-3 py-3.5 text-right">FILLS</th>
                <th className="px-3 py-3.5 text-right">VOLUME</th>
                <th className="px-4 py-3.5 text-right font-bold">TOTAL SPEND</th>
                <th className="px-3 py-3.5 text-right">AVG FILL</th>
                <th className="px-4 py-3.5 text-right">LAST FILL (BS)</th>
                <th className="px-4 py-3.5 text-right">STATEMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted font-body">
                    No vehicles found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const fuelId = v.primaryFuel as FuelId;
                  return (
                    <tr
                      key={v.vehicleNo}
                      onClick={() => setSelectedVehicle(v)}
                      className="hover:bg-surface-hi/70 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5 font-body">
                        <span className="font-mono bg-bg border border-border px-2.5 py-1 rounded-md text-[12.5px] font-bold text-accent shadow-2xs">
                          {v.vehicleNo}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-body font-medium text-text">
                        {v.customerName || (
                          <span className="text-text-muted text-[11.5px]">Retail Cash Sales</span>
                        )}
                      </td>

                      <td className="px-3 py-3.5 font-body">
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
                          <span className="font-medium text-text">{FUEL_LABEL[fuelId]}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right text-text-muted">
                        {v.fillCount} fills
                      </td>

                      <td className="px-3 py-3.5 text-right font-medium text-text">
                        {fmtL(v.totalLiters)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-bold text-[13.5px] text-accent">
                        {fmtRs(v.totalAmount)}
                      </td>

                      <td className="px-3 py-3.5 text-right text-text-muted">
                        {v.avgLitersPerFill.toFixed(1)} L
                      </td>

                      <td className="px-4 py-3.5 text-right text-text-muted text-[12px]">
                        <div>{v.lastFillBS}</div>
                        <div className="text-[10.5px]">{v.lastFillTime}</div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-body">
                        <GhostButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVehicle(v);
                          }}
                          className="px-2.5 py-1 text-[11.5px]"
                        >
                          <FileText size={13} /> Statement
                        </GhostButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detailed Vehicle Statement & Consumption History Modal */}
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[16px] font-bold text-text">
                      Vehicle Fuel Statement: {selectedVehicle.vehicleNo}
                    </h3>
                  </div>
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
              <div className="print-area rounded-xl border border-border bg-bg p-4 space-y-3 text-[12.5px]">
                {/* Official Statement Heading */}
                <div className="border-b border-dashed border-border pb-3 text-center">
                  <div className="font-display text-[15px] font-bold text-text">
                    SHREE PASHUPATI PETROLEUM CENTER
                  </div>
                  <div className="text-[11px] text-text-muted">Maharajgunj, Kathmandu · PAN: 301928491</div>
                  <div className="mt-1 font-semibold text-accent text-[12.5px]">
                    सवारी साधन इन्धन खपत विवरण (VEHICLE FUEL STATEMENT)
                  </div>
                </div>

                {/* Vehicle Meta Grid */}
                <div className="grid grid-cols-2 gap-3 text-[12px] bg-surface p-3 rounded-lg border border-border">
                  <div>
                    <span className="text-text-muted block text-[11px]">Vehicle Plate:</span>
                    <span className="font-mono font-bold text-accent text-[13px]">
                      {selectedVehicle.vehicleNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Fleet Customer:</span>
                    <span className="font-medium text-text">
                      {selectedVehicle.customerName || "Retail Walk-In"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Total Dispensed Volume:</span>
                    <span className="font-data font-bold text-text">
                      {fmtL(selectedVehicle.totalLiters)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">Cumulative Billed Value:</span>
                    <span className="font-data font-bold text-accent">
                      {fmtRs(selectedVehicle.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Chronological Fills Table */}
                <div className="space-y-1 pt-1">
                  <div className="font-semibold text-text text-[12px] mb-1">
                    Chronological Fueling History ({selectedVehicle.fills.length} records):
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-[11.5px]">
                      <thead className="bg-surface-hi text-text-muted border-b border-border font-data">
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
                      <tbody className="divide-y divide-border font-data">
                        {selectedVehicle.fills.map((f) => (
                          <tr key={f.id} className="hover:bg-surface-hi/40">
                            <td className="px-2.5 py-1.5 font-mono text-accent font-bold">
                              #{f.receiptNo}
                            </td>
                            <td className="px-2.5 py-1.5 text-text-muted">
                              {f.dateBS} {f.time}
                            </td>
                            <td className="px-2.5 py-1.5 font-body">
                              {FUEL_LABEL[f.fuel as FuelId]}
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
                            <td className="px-2.5 py-1.5 font-body text-text-muted">
                              {f.soldBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatory Footer */}
                <div className="grid grid-cols-2 gap-8 pt-6 text-[11px] text-text-muted text-center border-t border-dashed border-border mt-4">
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
                <GhostButton onClick={handlePrintStatement} className="text-[12.5px]">
                  <Printer size={14} /> Print Statement (PDF)
                </GhostButton>
                <GhostButton
                  onClick={() => handleExportVehicleLedger(selectedVehicle)}
                  className="text-[12.5px]"
                >
                  <Download size={14} /> Export CSV
                </GhostButton>
              </div>

              <GhostButton onClick={() => setSelectedVehicle(null)} className="text-[12.5px]">
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
