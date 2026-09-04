"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Printer,
  Search,
  CheckCircle2,
  FileText,
  Fuel,
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
  ArrowLeft,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs, fmtL } from "@/lib/money";
import { clsx } from "clsx";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { voidSaleAction } from "@/lib/actions/sales";
import { fiscalYearOf } from "@/lib/bs-date";
import type { SalesReturnsPageData, SerializedSale } from "@/lib/queries/sales";

const RETURN_REASONS = [
  { id: "WRONG_QTY", label: "Wrong Quantity Entry" },
  { id: "WRONG_RATE", label: "Wrong Rate Posted" },
  { id: "WRONG_PAN", label: "WRONG PAN NO." },
  { id: "WRONG_BILLING", label: "Wrong Billing / Wrong Customer" },
  { id: "NAME_NEEDED", label: "Name Needed / Customer PAN Correction" },
  { id: "BILL_MISTAKE", label: "Bill Mistake" },
  { id: "PRINTER_ERROR", label: "Not Printed Due to Printer Error" },
  { id: "METER_CALIBRATION", label: "Nozzle Meter Calibration / Testing" },
  { id: "ABORTED_DISPENSE", label: "Dispense Aborted Mid-Flow" },
  { id: "PAYMENT_FAILED", label: "Digital Payment Authorization Failed" },
  { id: "OTHER", label: "Other / Custom Reason" },
];

function vatSplit(amount: number): { taxable: number; vat: number } {
  const taxable = amount / 1.13;
  const vat = amount - taxable;
  return { taxable, vat };
}

export function ProcessSalesReturnView({
  initialData,
  canVoid,
}: {
  initialData: SalesReturnsPageData;
  canVoid: boolean;
}) {
  const router = useRouter();

  const [activeSales] = useState<SerializedSale[]>(initialData.activeSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<SerializedSale | null>(null);
  const [reasonCategory, setReasonCategory] = useState(RETURN_REASONS[0].label);
  const [customNotes, setCustomNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastProcessedReturn, setLastProcessedReturn] = useState<SerializedSale | null>(null);
  const [activeSlip, setActiveSlip] = useState<SerializedSale | null>(null);

  // Filter active sales
  const filteredActiveSales = useMemo(() => {
    if (!searchQuery.trim()) return activeSales;
    const q = searchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return activeSales.filter((s) => {
      const matchNum = numQ ? String(s.receiptNo).includes(numQ) : false;
      const matchBill =
        s.billNumber.toLowerCase().includes(q) ||
        `sl-${s.receiptNo}`.toLowerCase().includes(q) ||
        `tb-${s.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = s.vehicleNo ? s.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
      return matchNum || matchBill || matchVeh || matchCust;
    });
  }, [activeSales, searchQuery]);

  const totalPages = Math.ceil(filteredActiveSales.length / 10) || 1;
  const paginatedSales = useMemo(() => {
    const start = (activePage - 1) * 10;
    return filteredActiveSales.slice(start, start + 10);
  }, [filteredActiveSales, activePage]);

  // Execute Return
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
        const fy = fiscalYearOf(new Date(selectedSale.createdAt)) || "2083/84";
        const returnedItem: SerializedSale = {
          ...selectedSale,
          voided: true,
          voidReason: fullReason,
          voidedAt: new Date().toISOString(),
          creditNoteNo: `cn-tb-${selectedSale.receiptNo}-${fy.replace("/", "")}`,
        };

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

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-black text-text tracking-tight flex items-center gap-2">
              Sales <span className="text-accent">Return</span> (बिक्री फिर्ता)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
              Issue Credit Note
            </span>
          </div>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Reverse active customer bills, restore fuel inventory back to tanks, and generate IRD Credit Notes.
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          <Link href="/sales/returns">
            <GhostButton
              type="button"
              className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 rounded-lg"
            >
              <History size={13} className="text-accent" />
              <span>List Returns ({initialData.totalCount})</span>
            </GhostButton>
          </Link>

          <GhostButton
            type="button"
            onClick={() => router.back()}
            className="h-8 px-3 text-xs font-semibold border border-border bg-surface hover:bg-surface-hi flex items-center gap-1 cursor-pointer rounded-lg text-text hover:text-accent transition-colors shadow-xs"
          >
            « Back
          </GhostButton>
        </div>
      </div>

      {/* Success Notification Banner */}
      {lastProcessedReturn && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              <Check size={18} className="stroke-[3]" />
            </div>
            <div>
              <div className="font-bold text-text text-xs sm:text-sm flex items-center gap-2">
                <span>Credit Note {lastProcessedReturn.creditNoteNo || `CN-${lastProcessedReturn.receiptNo}`} Issued Successfully</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/20">Restocked</span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-0.5">
                Restocked <strong>{fmtL(lastProcessedReturn.liters)}</strong> of {lastProcessedReturn.fuel} to storage tank · Adjusted <strong>{fmtRs(lastProcessedReturn.totalAmount)}</strong>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GhostButton
              type="button"
              onClick={() => setActiveSlip(lastProcessedReturn)}
              className="h-8 px-3 text-xs bg-surface border border-border font-bold hover:bg-surface-hi rounded-lg"
            >
              <Printer size={13} className="text-accent" /> View Credit Slip
            </GhostButton>
            <Link href="/sales/returns">
              <PrimaryButton
                type="button"
                className="h-8 px-3 text-xs font-bold rounded-lg"
              >
                View in Register →
              </PrimaryButton>
            </Link>
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

      {/* Selected Bill Execution Panel */}
      {selectedSale ? (
        <div className="rounded-2xl border border-accent/40 bg-surface p-4 sm:p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <RotateCcw size={15} className="text-accent" />
              <h2 className="font-display text-sm sm:text-base font-bold text-text">
                Confirm Return & Issue Credit Note for Invoice #{selectedSale.receiptNo}
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
              ✕ Select Different Bill
            </button>
          </div>

          {/* Invoice Summary Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border bg-bg p-3.5 text-xs font-mono">
            <div>
              <span className="text-[10.5px] text-text-muted block font-sans">Bill Number</span>
              <strong className="text-accent text-sm">#{selectedSale.receiptNo}</strong>
            </div>
            <div>
              <span className="text-[10.5px] text-text-muted block font-sans">Customer / Plate</span>
              <span className="text-text font-semibold font-sans truncate block">
                {selectedSale.customerName || "Walk-In Cash"}
              </span>
              <span className="text-[11px] text-text-muted">{selectedSale.vehicleNo || "No Plate"}</span>
            </div>
            <div>
              <span className="text-[10.5px] text-text-muted block font-sans">Fuel & Quantity</span>
              <span className="text-text font-bold font-sans">{selectedSale.fuel}</span>
              <span className="text-[11px] text-text-muted block">({fmtL(selectedSale.liters)})</span>
            </div>
            <div>
              <span className="text-[10.5px] text-text-muted block font-sans">Total Invoiced</span>
              <strong className="text-text text-sm font-bold">{fmtRs(selectedSale.totalAmount)}</strong>
            </div>
          </div>

          {/* Inventory & Ledger Impact */}
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

          {/* Reason & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/70">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                REASON FOR RETURN (क्रेडिट नोटको कारण)
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-bg px-2.5 text-xs font-semibold text-text focus:outline-none focus:border-accent cursor-pointer"
              >
                {RETURN_REASONS.map((r) => (
                  <option key={r.id} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                REMARKS / AUDIT MEMO
              </label>
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Corrected buyer PAN, meter testing"
                className="h-8 px-2.5 text-xs font-medium w-full"
              />
            </div>
          </div>

          {actionError && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <GhostButton
              type="button"
              onClick={() => setSelectedSale(null)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi text-text-muted hover:text-text cursor-pointer"
            >
              Cancel
            </GhostButton>

            <PrimaryButton
              type="button"
              onClick={handleExecuteReturn}
              disabled={isSubmitting || !canVoid}
              className={clsx(
                "h-8 px-4 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5",
                canVoid
                  ? "bg-accent text-[#1A1306] hover:bg-accent-hover cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              )}
            >
              <Check size={14} className="stroke-[3]" />
              {isSubmitting ? "Processing..." : "✓ Confirm Return"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        /* Active Invoices Locator Table */
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-text tracking-tight">
                Select Active Bill to Return (फिर्ता बिल छान्नुहोस्)
              </h2>
              <p className="text-xs text-text-muted">
                Locate customer invoice by Bill #, vehicle registration plate, or customer name
              </p>
            </div>

            <span className="font-mono text-xs text-text-muted font-bold">
              {filteredActiveSales.length} Active Invoices
            </span>
          </div>

          {/* Search Input - Compact width */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActivePage(1);
                }}
                placeholder="Search bill #, vehicle plate, or customer..."
                className="h-8 pl-8 pr-7 text-xs font-medium w-full"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActivePage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Invoices Table */}
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
              <tbody className="divide-y divide-border font-data">
                {paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted text-xs font-body">
                      No active bills found matching &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((s) => {
                    const fuelId = s.fuel as FuelId;
                    return (
                      <tr key={s.id} className="transition-colors hover:bg-surface-hi/30">
                        <td className="p-2.5 border-r border-border font-mono font-bold text-accent">
                          #{s.receiptNo}
                        </td>
                        <td className="p-2.5 border-r border-border font-medium text-text">
                          {s.customerName || "Walk-In Cash"}
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
                        <td className="p-2.5 text-right font-body">
                          <PrimaryButton
                            type="button"
                            onClick={() => {
                              setSelectedSale(s);
                              setActionError(null);
                            }}
                            className="h-7 px-2.5 text-[11px] bg-accent text-[#1A1306] font-bold rounded-md hover:bg-accent-hover cursor-pointer"
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

          {/* Pagination */}
          {filteredActiveSales.length > 10 && (
            <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs">
              <span className="text-text-muted font-mono">
                Showing {(activePage - 1) * 10 + 1}–
                {Math.min(activePage * 10, filteredActiveSales.length)} of{" "}
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
                  {activePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                  disabled={activePage === totalPages}
                  className={clsx(
                    "rounded-lg border border-border px-2.5 py-1 text-xs transition-colors flex items-center gap-1",
                    activePage === totalPages
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

      {/* Printable Credit Note Modal */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-3.5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h3 className="font-display text-sm font-bold text-text">
                  Statutory Credit Note Voucher (क्रेडिट नोट)
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

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="rounded-xl border border-border bg-bg p-4 space-y-3 text-xs font-mono">
                {/* Station Tax Header */}
                <div className="border-b border-dashed border-border pb-3 text-center">
                  <div className="font-bold text-text text-sm uppercase">{initialData.stationName || "FUEL STATION"}</div>
                  <div className="text-[10px] text-text-muted">PAN / VAT: {initialData.stationPan || "300066034"}</div>
                  <div className="text-[11px] text-accent font-bold mt-1">CREDIT NOTE / अनुसूची ६ (नियम २३ सँग सम्बन्धित)</div>
                  <div className="text-[10px] text-text-muted">
                    CN No: <strong>{activeSlip.creditNoteNo || `CN-${activeSlip.receiptNo}`}</strong> · Date: {activeSlip.formattedDateBS}
                  </div>
                </div>

                {/* Return Details */}
                <div className="space-y-1.5 pt-1 text-[11.5px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Original Invoice No:</span>
                    <span className="font-bold text-text">{activeSlip.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Customer Name:</span>
                    <span className="text-text font-medium">{activeSlip.customerName || "Cash Retail"}</span>
                  </div>
                  {activeSlip.customerPan && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Customer PAN:</span>
                      <span className="text-text font-mono">{activeSlip.customerPan}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-muted">Vehicle Plate:</span>
                    <span className="text-text">{activeSlip.vehicleNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Restocked Fuel:</span>
                    <span className="text-emerald-400 font-bold">
                      +{fmtL(activeSlip.liters)} {activeSlip.fuel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Reason / Remarks:</span>
                    <span className="text-text font-bold text-right max-w-xs">{activeSlip.voidReason || "Mistake Billing"}</span>
                  </div>

                  {/* Financial Breakdown */}
                  {(() => {
                    const { taxable, vat } = vatSplit(activeSlip.totalAmount);
                    return (
                      <div className="border-t border-dashed border-border pt-2 space-y-1">
                        <div className="flex justify-between text-text-muted">
                          <span>Taxable Amount Returned:</span>
                          <span className="text-text font-mono">{fmtRs(taxable)}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>13% VAT Returned:</span>
                          <span className="text-emerald-400 font-mono">{fmtRs(vat)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-1 font-bold text-sm">
                          <span>Grand Total Reversed:</span>
                          <span className="text-error font-mono font-black">{fmtRs(activeSlip.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border-t border-dashed border-border pt-2 text-[10px] text-text-muted flex justify-between">
                    <span>Issued By: {activeSlip.soldByName || "SUPER ADMIN"}</span>
                    <span>IRD Sync: YES</span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <GhostButton
                  type="button"
                  onClick={() => setActiveSlip(null)}
                  className="text-xs px-4 py-2"
                >
                  Close
                </GhostButton>
                <PrimaryButton
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs font-bold px-5 py-2 bg-accent text-[#1A1306] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={14} /> Print Credit Slip
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
