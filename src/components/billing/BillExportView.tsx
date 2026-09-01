"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Search,
  Printer,
  FileSpreadsheet,
  Calendar,
  FileText,
  Filter,
  CheckCircle2,
  Table,
} from "lucide-react";
import { clsx } from "clsx";
import type { SerializedBillItem } from "@/lib/queries/bills";
import type { BillFilters } from "@/lib/bill-filters";
import { PRESETS, PRESET_LABEL } from "@/lib/reports";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input, Select } from "@/components/ui/Field";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { fmtRs, fmtL } from "@/lib/money";

export function BillExportView({
  initialFilters,
  basePath,
  bills,
  rangeLabel,
}: {
  initialFilters: BillFilters;
  basePath: string;
  bills: SerializedBillItem[];
  rangeLabel: string;
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(initialFilters.search || "");
  const [vehicleQuery, setVehicleQuery] = useState(initialFilters.vehicleNo ?? "");
  const [fuelFilter, setFuelFilter] = useState<string>(initialFilters.fuel ?? "ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>(initialFilters.payment ?? "ALL");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || "active");

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter === "active" && b.voided) return false;
      if (statusFilter === "voided" && !b.voided) return false;
      if (fuelFilter !== "ALL" && b.fuel !== fuelFilter) return false;
      if (paymentFilter !== "ALL" && b.payment !== paymentFilter) return false;

      if (vehicleQuery.trim()) {
        const v = vehicleQuery.toLowerCase().replace(/\s+/g, "");
        if (!b.vehicleNo || !b.vehicleNo.toLowerCase().replace(/\s+/g, "").includes(v)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numQ = q.replace(/\D/g, "");
        const matchReceipt = numQ ? String(b.receiptNo).includes(numQ) : false;
        const matchBill = b.billNumber.toLowerCase().includes(q);
        const matchCustomer = b.customerName ? b.customerName.toLowerCase().includes(q) : false;
        const matchPlate = b.vehicleNo ? b.vehicleNo.toLowerCase().includes(q) : false;
        if (!matchReceipt && !matchBill && !matchCustomer && !matchPlate) return false;
      }

      return true;
    });
  }, [bills, statusFilter, fuelFilter, paymentFilter, vehicleQuery, searchQuery]);

  const summary = useMemo(() => {
    const totalAmount = filteredBills.reduce((sum, b) => sum + (b.voided ? 0 : b.amount), 0);
    const totalLiters = filteredBills.reduce((sum, b) => sum + (b.voided ? 0 : b.liters), 0);
    const voidedCount = filteredBills.filter((b) => b.voided).length;
    return {
      count: filteredBills.length,
      totalAmount,
      totalLiters,
      voidedCount,
    };
  }, [filteredBills]);

  const applyPreset = (preset: string) => {
    const params = new URLSearchParams();
    params.set("preset", preset);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleExportCSV = () => {
    if (filteredBills.length === 0) return;

    const headers = [
      "Receipt No",
      "Bill Number",
      "Date (BS)",
      "Time",
      "Product",
      "Volume (L)",
      "Rate (NPR/L)",
      "Amount (NPR)",
      "Payment Mode",
      "Customer",
      "Vehicle Plate",
      "Attendant",
      "Status",
      "Void Reason",
    ];

    const rows = filteredBills.map((b) => [
      `"${b.receiptNo}"`,
      `"${b.billNumber}"`,
      `"${b.dateBS}"`,
      `"${b.time}"`,
      `"${FUEL_LABEL[b.fuel as FuelId] || b.fuel}"`,
      `"${b.liters.toFixed(2)}"`,
      `"${b.rate.toFixed(2)}"`,
      `"${b.amount.toFixed(2)}"`,
      `"${b.payment}"`,
      `"${b.customerName || "Retail Walk-In"}"`,
      `"${b.vehicleNo || "-"}"`,
      `"${b.soldBy}"`,
      `"${b.voided ? "Voided / Return" : "Active"}"`,
      `"${b.voidReason || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `sales_register_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg font-bold text-text tracking-tight">
            Bill Export & Tax Register (बिल निर्यात)
          </h1>
          <span className="font-mono text-[10.5px] rounded-full bg-accent/10 px-2 py-0.5 font-bold text-accent border border-accent/20">
            IRD Compliant
          </span>
        </div>
      </div>

      {/* Main Export Configuration Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-5">
        <div>
          <h2 className="font-display text-sm font-bold text-text tracking-tight">
            Export Sales & Billing Register
          </h2>
          <p className="text-xs text-text-muted">
            Select parameters below to generate audit-ready sales records and IRD Annexure 5 spreadsheets
          </p>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              DATE PERIOD (मिति)
            </label>
            <Select
              value={initialFilters.range.preset}
              onChange={(e) => applyPreset(e.target.value)}
              className="text-xs font-semibold w-full"
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>
                  {PRESET_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              FUEL GRADE (इन्धन प्रकार)
            </label>
            <Select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="text-xs font-semibold w-full"
            >
              <option value="ALL">All Products (सबै)</option>
              <option value="PETROL">Petrol (MS 91)</option>
              <option value="DIESEL">Diesel (HSD)</option>
              <option value="CNG">CNG</option>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              PAYMENT MODE (भुक्तानी)
            </label>
            <Select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-semibold w-full"
            >
              <option value="ALL">All Modes (सबै भुक्तानी)</option>
              <option value="CASH">Cash (नगद)</option>
              <option value="CREDIT">Credit / Khata (उधारो)</option>
              <option value="ONLINE">Online / Fonepay QR</option>
              <option value="CARD">Debit / Credit Card</option>
            </Select>
          </div>
        </div>

        {/* Secondary Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/70">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              INVOICE STATUS (स्थिति)
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold w-full"
            >
              <option value="active">Active Bills Only (सक्रिय बिलहरू)</option>
              <option value="all">All Records (सक्रिय + रद्द)</option>
              <option value="voided">Voided / Returns Only (रद्द फिर्ता)</option>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              SEARCH CUSTOMER / BILL
            </label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium pr-7"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              VEHICLE REGISTRATION PLATE
            </label>
            <div className="relative">
              <Input
                type="text"
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                className="w-full text-xs font-medium pr-7"
              />
              {vehicleQuery && (
                <button
                  type="button"
                  onClick={() => setVehicleQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Real-Time Selection Impact Bar */}
        <div className="rounded-xl border border-border bg-bg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-text-muted text-[10.5px] block font-sans">Matched Bills</span>
              <span className="font-bold text-text text-sm">{summary.count} Records</span>
            </div>
            <div>
              <span className="text-text-muted text-[10.5px] block font-sans">Total Volume</span>
              <span className="font-bold text-text text-sm">{fmtL(summary.totalLiters)}</span>
            </div>
            <div>
              <span className="text-text-muted text-[10.5px] block font-sans">Gross Revenue</span>
              <span className="font-bold text-accent text-sm">{fmtRs(summary.totalAmount)}</span>
            </div>
          </div>

          <div className="text-right text-[11px] text-text-muted font-sans">
            Period: <strong className="text-text">{rangeLabel}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border/70">
          <GhostButton onClick={() => window.print()} className="text-xs px-4 py-2">
            <Printer size={13} /> Print Statement
          </GhostButton>

          <PrimaryButton
            onClick={handleExportCSV}
            disabled={filteredBills.length === 0}
            className={clsx(
              "text-xs px-6 py-2 bg-accent text-[#1A1306] font-bold rounded-xl shadow-sm transition-all flex items-center gap-2",
              filteredBills.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 cursor-pointer"
            )}
          >
            <Download size={14} className="stroke-[2.5]" />
            Download CSV Spreadsheet ({summary.count})
          </PrimaryButton>
        </div>
      </div>

      {/* Preview Section */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-muted">
            Export File Preview (First 5 of {filteredBills.length} rows)
          </h3>
          <span className="text-[11px] font-mono text-text-muted">CSV Structure</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="border-b border-border bg-surface-hi text-[10.5px] font-bold uppercase tracking-wider text-text-muted font-mono">
                <tr>
                  <th className="p-2.5 border-r border-border">Receipt #</th>
                  <th className="p-2.5 border-r border-border">Date (BS)</th>
                  <th className="p-2.5 border-r border-border">Product</th>
                  <th className="p-2.5 border-r border-border text-right">Volume</th>
                  <th className="p-2.5 border-r border-border text-right">Amount</th>
                  <th className="p-2.5 border-r border-border">Payment</th>
                  <th className="p-2.5 border-r border-border">Customer</th>
                  <th className="p-2.5">Vehicle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted text-xs font-sans">
                      No invoices match the selected parameters.
                    </td>
                  </tr>
                ) : (
                  filteredBills.slice(0, 5).map((b) => {
                    const fuelId = b.fuel as FuelId;
                    return (
                      <tr key={b.id} className="hover:bg-surface-hi/30 transition-colors">
                        <td className="p-2.5 border-r border-border font-bold text-accent">
                          #{b.receiptNo}
                        </td>
                        <td className="p-2.5 border-r border-border text-text-muted">
                          {b.dateBS}
                        </td>
                        <td className="p-2.5 border-r border-border font-sans font-medium text-text">
                          {FUEL_LABEL[fuelId] || b.fuel}
                        </td>
                        <td className="p-2.5 border-r border-border text-right font-medium">
                          {fmtL(b.liters)}
                        </td>
                        <td className="p-2.5 border-r border-border text-right font-bold text-text">
                          {fmtRs(b.amount)}
                        </td>
                        <td className="p-2.5 border-r border-border font-sans">
                          {b.payment}
                        </td>
                        <td className="p-2.5 border-r border-border font-sans text-text">
                          {b.customerName || "Retail Walk-In"}
                        </td>
                        <td className="p-2.5 text-text">
                          {b.vehicleNo || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
