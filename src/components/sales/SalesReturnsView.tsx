"use client";

import { useState, useMemo } from "react";
import {
  RotateCcw,
  Printer,
  Download,
  Search,
  CheckCircle2,
  FileText,
  Fuel,
  User,
  Clock,
  Building2,
  X,
  Scale,
  History,
  Check,
  Ban,
  ArrowRight,
  Receipt,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs, fmtL } from "@/lib/money";
import { clsx } from "clsx";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { voidSaleAction } from "@/lib/actions/sales";
import type { SalesReturnsPageData, SerializedSale } from "@/lib/queries/sales";

const RETURN_REASONS = [
  { id: "INCORRECT_FUEL", label: "Incorrect Nozzle / Fuel Type Dispensed" },
  { id: "METER_CALIBRATION", label: "Nozzle Meter Calibration / Testing" },
  { id: "PAYMENT_FAILED", label: "Digital Payment (QR/Card) Authorization Failed" },
  { id: "DUPLICATE_ENTRY", label: "Duplicate Billing Entry" },
  { id: "VOLUME_CORRECTION", label: "Customer Requested Quantity Adjustment" },
  { id: "ABORTED_DISPENSE", label: "Dispense Aborted Mid-Flow" },
  { id: "OTHER", label: "Other / Custom Reason" },
];

const ITEMS_PER_PAGE = 10;

export function SalesReturnsView({
  initialData,
  canVoid,
}: {
  initialData: SalesReturnsPageData;
  canVoid: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"PROCESS" | "REGISTER">("PROCESS");

  // Data state
  const [returns, setReturns] = useState<SerializedSale[]>(initialData.returns);
  const [activeSales] = useState<SerializedSale[]>(initialData.activeSales);

  // Return Processing State
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SerializedSale | null>(null);
  const [reasonCategory, setReasonCategory] = useState(RETURN_REASONS[0].label);
  const [customNotes, setCustomNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastProcessedReturn, setLastProcessedReturn] = useState<SerializedSale | null>(null);

  // Register state
  const [registerSearchQuery, setRegisterSearchQuery] = useState("");
  const [registerPage, setRegisterPage] = useState(1);
  const [activeSlip, setActiveSlip] = useState<SerializedSale | null>(null);

  // Filtered active sales
  const filteredActiveSales = useMemo(() => {
    if (!searchQuery.trim()) return activeSales;
    const q = searchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return activeSales.filter((s) => {
      const matchNum = numQ ? String(s.receiptNo).includes(numQ) : false;
      const matchBill =
        s.billNumber.toLowerCase().includes(q) ||
        `sl-${s.receiptNo}`.toLowerCase().includes(q) ||
        `#${s.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = s.vehicleNo ? s.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
      return matchNum || matchBill || matchVeh || matchCust;
    });
  }, [activeSales, searchQuery]);

  // Paginated active sales
  const totalActivePages = Math.ceil(filteredActiveSales.length / ITEMS_PER_PAGE) || 1;
  const paginatedActiveSales = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredActiveSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActiveSales, activePage]);

  // Filtered credit notes register
  const filteredReturns = useMemo(() => {
    if (!registerSearchQuery.trim()) return returns;
    const q = registerSearchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return returns.filter((r) => {
      const matchNum = numQ ? String(r.receiptNo).includes(numQ) : false;
      const matchBill =
        r.billNumber.toLowerCase().includes(q) ||
        `crn-${r.receiptNo}`.toLowerCase().includes(q) ||
        `#${r.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = r.vehicleNo ? r.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = r.customerName ? r.customerName.toLowerCase().includes(q) : false;
      const matchReason = r.voidReason ? r.voidReason.toLowerCase().includes(q) : false;
      return matchNum || matchBill || matchVeh || matchCust || matchReason;
    });
  }, [returns, registerSearchQuery]);

  // Paginated credit notes register
  const totalRegisterPages = Math.ceil(filteredReturns.length / ITEMS_PER_PAGE) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (registerPage - 1) * ITEMS_PER_PAGE;
    return filteredReturns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReturns, registerPage]);

  // Execute Return Handler
  const handleExecuteReturn = async () => {
    if (!selectedSale) return;
    setIsSubmitting(true);
    setActionError(null);

    const fullReason = customNotes.trim()
      ? `${reasonCategory}: ${customNotes.trim()}`
      : reasonCategory;

    const fd = new FormData();
    fd.set("saleId", selectedSale.id);
    fd.set("reason", fullReason);

    try {
      const res = await voidSaleAction({}, fd);
      if (res.error) {
        setActionError(res.error);
        setIsSubmitting(false);
      } else {
        const returnedItem: SerializedSale = {
          ...selectedSale,
          voided: true,
          voidReason: fullReason,
          voidedAt: new Date().toISOString(),
        };

        setReturns((prev) => [returnedItem, ...prev]);
        setLastProcessedReturn(returnedItem);
        setSelectedSale(null);
        setCustomNotes("");
        setIsSubmitting(false);
      }
    } catch {
      setActionError("Failed to process return. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredReturns.length === 0) return;
    const headers = [
      "Credit Note #",
      "Original Bill #",
      "Date (BS)",
      "Vehicle No",
      "Customer",
      "Fuel Product",
      "Volume Restocked (L)",
      "Amount Reversed (Rs)",
      "Reason",
      "Processed By",
    ];

    const rows = filteredReturns.map((r) => [
      `CRN-${r.receiptNo}`,
      r.billNumber,
      r.formattedDateBS,
      r.vehicleNo || "-",
      r.customerName || "Walk-In Retail",
      r.fuel,
      r.liters.toFixed(2),
      r.totalAmount.toFixed(2),
      `"${(r.voidReason || "Sales Return").replace(/"/g, '""')}"`,
      r.soldByName,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sales_Credit_Notes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fade-in">
      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-lg font-bold text-text tracking-tight">
            Sales Returns & Credit Notes (बिक्री फिर्ता)
          </h1>
          <span className="font-mono text-[10.5px] rounded-full bg-accent/10 px-2 py-0.5 font-bold text-accent border border-accent/20">
            IRD Annexure 6
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-1 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("PROCESS");
                setSelectedSale(null);
              }}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer",
                activeTab === "PROCESS"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <RotateCcw size={13} />
              Process Return
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("REGISTER");
                setSelectedSale(null);
              }}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer",
                activeTab === "REGISTER"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <History size={13} />
              Credit Notes Register ({returns.length})
            </button>
          </div>

          <GhostButton onClick={() => window.print()} className="text-xs">
            <Printer size={13} /> Print
          </GhostButton>
        </div>
      </div>

      {/* Success Notification Banner */}
      {lastProcessedReturn && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success text-white">
              <Check size={16} className="stroke-[3]" />
            </div>
            <div>
              <div className="font-bold text-text text-xs">
                Credit Note CRN-{lastProcessedReturn.receiptNo} Issued Successfully
              </div>
              <div className="text-[11.5px] text-text-muted">
                Restocked {fmtL(lastProcessedReturn.liters)} {lastProcessedReturn.fuel} to storage tank · Adjusted {fmtRs(lastProcessedReturn.totalAmount)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              type="button"
              onClick={() => setActiveSlip(lastProcessedReturn)}
              className="text-xs bg-surface border border-border"
            >
              <Printer size={12} /> Print Credit Slip
            </GhostButton>
            <button
              type="button"
              onClick={() => setLastProcessedReturn(null)}
              className="text-xs text-text-muted hover:text-text cursor-pointer p-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PROCESS RETURN TAB                                                     */}
      {/* ========================================================================= */}
      {activeTab === "PROCESS" && (
        <div className="space-y-4">
          {/* Selected Return Execution Panel */}
          {selectedSale ? (
            <div className="rounded-2xl border border-accent/40 bg-surface p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} className="text-accent" />
                  <h2 className="font-display text-sm font-bold text-text">
                    Confirm Return & Restock for Invoice #{selectedSale.receiptNo}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSale(null);
                    setActionError(null);
                  }}
                  className="text-xs text-text-muted hover:text-error cursor-pointer font-semibold"
                >
                  Cancel / Select Another Bill
                </button>
              </div>

              {/* Invoice Summary Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-bg p-3.5 text-xs font-mono">
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Bill Number</span>
                  <span className="font-bold text-accent">{selectedSale.billNumber}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Customer / Account</span>
                  <span className="font-medium text-text">{selectedSale.customerName || "Walk-In Retail"}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Vehicle Plate</span>
                  <span className="font-bold text-text">{selectedSale.vehicleNo || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-text-muted block font-sans">Payment Mode</span>
                  <span className="font-bold text-text">{selectedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Automatic Impact Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel size={16} className="text-emerald-500" />
                    <span className="text-xs font-medium text-text">Tank Restock</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-500">
                    +{fmtL(selectedSale.liters)} {selectedSale.fuel}
                  </span>
                </div>

                <div className="rounded-xl border border-error/30 bg-error/5 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale size={16} className="text-error" />
                    <span className="text-xs font-medium text-text">
                      {selectedSale.paymentMethod === "CREDIT" ? "Ledger Reversal" : "Amount Refund"}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-error">
                    -{fmtRs(selectedSale.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/70">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    REASON FOR RETURN
                  </label>
                  <Select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="text-xs font-bold w-full"
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r.id} value={r.label}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    REMARKS / MEMO
                  </label>
                  <Input
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>
              </div>

              {actionError && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Primary Confirm Button */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
                <GhostButton
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="px-5 py-2 text-xs font-bold text-text-muted hover:text-text"
                >
                  Cancel
                </GhostButton>

                <PrimaryButton
                  type="button"
                  onClick={handleExecuteReturn}
                  disabled={isSubmitting || !canVoid}
                  className={clsx(
                    "px-7 py-2 text-xs font-black tracking-wide rounded-xl shadow-md transition-all flex items-center gap-2",
                    canVoid
                      ? "bg-accent text-[#1A1306] hover:brightness-110 shadow-accent/20 cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Check size={16} className="stroke-[3]" />
                  {isSubmitting ? "Processing Return..." : "✓ Confirm Return & Issue Credit Note"}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            /* Search & Active Bills Table with Pagination */
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-text tracking-tight">
                    Select Active Bill to Return (फिर्ता बिल छान्नुहोस्)
                  </h2>
                  <p className="text-xs text-text-muted">
                    Locate the customer invoice by Bill #, vehicle plate, or customer name
                  </p>
                </div>

                <span className="font-mono text-xs text-text-muted font-bold">
                  {filteredActiveSales.length} Eligible Bills
                </span>
              </div>

              {/* Simple Clean Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActivePage(1);
                  }}
                  className="w-full pl-9 pr-8 text-xs font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActivePage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Clean Active Bills List Table */}
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="p-2.5 border-r border-border">Bill #</th>
                      <th className="p-2.5 border-r border-border">Customer</th>
                      <th className="p-2.5 border-r border-border">Vehicle</th>
                      <th className="p-2.5 border-r border-border">Product & Volume</th>
                      <th className="p-2.5 border-r border-border text-right">Amount (Rs)</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedActiveSales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-text-muted text-xs">
                          No active bills found matching &quot;{searchQuery}&quot;.
                        </td>
                      </tr>
                    ) : (
                      paginatedActiveSales.map((s) => {
                        const fuelId = s.fuel as FuelId;
                        return (
                          <tr key={s.id} className="transition-colors hover:bg-surface-hi/30">
                            <td className="p-2.5 border-r border-border font-mono font-bold text-accent">
                              #{s.receiptNo}
                            </td>
                            <td className="p-2.5 border-r border-border font-medium text-text">
                              {s.customerName || "Walk-In Retail"}
                            </td>
                            <td className="p-2.5 border-r border-border font-mono text-text">
                              {s.vehicleNo || "-"}
                            </td>
                            <td className="p-2.5 border-r border-border">
                              <span className="font-semibold text-text">{FUEL_LABEL[fuelId] || s.fuel}</span>
                              <span className="font-mono text-text-muted ml-1.5">({fmtL(s.liters)})</span>
                            </td>
                            <td className="p-2.5 border-r border-border text-right font-mono font-bold text-text">
                              {fmtRs(s.totalAmount)}
                            </td>
                            <td className="p-2.5 text-right">
                              <PrimaryButton
                                type="button"
                                onClick={() => {
                                  setSelectedSale(s);
                                  setActionError(null);
                                }}
                                className="text-[11px] px-3 py-1 bg-accent text-[#1A1306] font-bold rounded-lg cursor-pointer"
                              >
                                Return Bill
                              </PrimaryButton>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Active Bills Pagination */}
              {filteredActiveSales.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                  <span className="text-text-muted font-mono">
                    Showing {(activePage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(activePage * ITEMS_PER_PAGE, filteredActiveSales.length)} of{" "}
                    {filteredActiveSales.length} bills
                  </span>

                  <div className="flex items-center gap-1.5 font-mono">
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                      className={clsx(
                        "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                        activePage === 1
                          ? "opacity-40 cursor-not-allowed text-text-muted"
                          : "hover:bg-surface-hi text-text cursor-pointer"
                      )}
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span className="px-2 font-bold text-text">
                      {activePage} / {totalActivePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePage((p) => Math.min(totalActivePages, p + 1))}
                      disabled={activePage === totalActivePages}
                      className={clsx(
                        "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                        activePage === totalActivePages
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREDIT NOTES REGISTER TAB                                              */}
      {/* ========================================================================= */}
      {activeTab === "REGISTER" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="relative flex-1 min-w-[280px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                type="text"
                value={registerSearchQuery}
                onChange={(e) => {
                  setRegisterSearchQuery(e.target.value);
                  setRegisterPage(1);
                }}
                className="w-full pl-9 pr-8 text-xs font-medium"
              />
              {registerSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setRegisterSearchQuery("");
                    setRegisterPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted font-mono">
                {filteredReturns.length} credit notes
              </span>
              <GhostButton onClick={handleExportCSV} className="text-xs">
                <Download size={13} /> Export CSV
              </GhostButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-4 py-3">Credit Note #</th>
                    <th className="px-3 py-3">Original Bill</th>
                    <th className="px-3 py-3">Date (BS)</th>
                    <th className="px-3 py-3">Vehicle</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3 text-right">Restocked</th>
                    <th className="px-4 py-3 text-right font-bold">Amount Reversed</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-text-muted">
                        No credit notes recorded matching the search.
                      </td>
                    </tr>
                  ) : (
                    paginatedReturns.map((r) => {
                      const fuelId = r.fuel as FuelId;

                      return (
                        <tr key={r.id} className="hover:bg-surface-hi/50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-accent">
                            CRN-{r.receiptNo}
                          </td>
                          <td className="px-3 py-3 font-mono text-text">
                            {r.billNumber}
                          </td>
                          <td className="px-3 py-3 font-mono text-text-muted">
                            {r.formattedDateBS}
                          </td>
                          <td className="px-3 py-3 font-mono text-text">
                            {r.vehicleNo || "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-text">
                            {r.customerName || "Walk-In Retail"}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-text">
                              {FUEL_LABEL[fuelId] || r.fuel}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-500">
                            +{fmtL(r.liters)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-text">
                            {fmtRs(r.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-text-muted text-[11px] max-w-xs truncate">
                            {r.voidReason || "Sales Return"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <GhostButton
                              type="button"
                              onClick={() => setActiveSlip(r)}
                              className="text-[11px] px-2.5 py-1"
                            >
                              <Printer size={12} /> View Slip
                            </GhostButton>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Credit Notes Register Pagination */}
            {filteredReturns.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs">
                <span className="text-text-muted font-mono">
                  Showing {(registerPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(registerPage * ITEMS_PER_PAGE, filteredReturns.length)} of{" "}
                  {filteredReturns.length} credit notes
                </span>

                <div className="flex items-center gap-1.5 font-mono">
                  <button
                    type="button"
                    onClick={() => setRegisterPage((p) => Math.max(1, p - 1))}
                    disabled={registerPage === 1}
                    className={clsx(
                      "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                      registerPage === 1
                        ? "opacity-40 cursor-not-allowed text-text-muted"
                        : "hover:bg-surface-hi text-text cursor-pointer"
                    )}
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="px-2 font-bold text-text">
                    {registerPage} / {totalRegisterPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRegisterPage((p) => Math.min(totalRegisterPages, p + 1))}
                    disabled={registerPage === totalRegisterPages}
                    className={clsx(
                      "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                      registerPage === totalRegisterPages
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
        </div>
      )}

      {/* 3. Printable Credit Note Modal */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-text">
                  Credit Note Slip (क्रेडिट नोट)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlip(null)}
                className="text-text-muted hover:text-text cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-border bg-bg p-4 space-y-2 text-xs font-mono">
                <div className="border-b border-dashed border-border pb-2 text-center">
                  <div className="font-bold text-text text-sm">FUEL STATION MANAGEMENT</div>
                  <div className="text-[11px] text-accent font-bold">CREDIT NOTE / अनुसूची ६</div>
                  <div className="text-[10px] text-text-muted">
                    #CRN-{activeSlip.receiptNo} · Date: {activeSlip.formattedDateBS}
                  </div>
                </div>

                <div className="space-y-1 pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Original Bill:</span>
                    <span className="font-bold text-text">{activeSlip.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Buyer:</span>
                    <span className="text-text">{activeSlip.customerName || "Walk-In Cash"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Vehicle:</span>
                    <span className="text-text">{activeSlip.vehicleNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Fuel Restocked:</span>
                    <span className="text-text font-bold text-emerald-500">
                      +{fmtL(activeSlip.liters)} {activeSlip.fuel}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-xs">
                    <span>Reversed Value:</span>
                    <span className="text-accent">{fmtRs(activeSlip.totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-2 border-t border-dashed border-border pt-1.5 text-[10px] text-text-muted">
                  Reason: {activeSlip.voidReason || "Sales Return"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-surface-hi px-5 py-3">
              <GhostButton onClick={() => window.print()} className="text-xs">
                <Printer size={13} /> Print Slip
              </GhostButton>
              <GhostButton onClick={() => setActiveSlip(null)} className="text-xs">
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
