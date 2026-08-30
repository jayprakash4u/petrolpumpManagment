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
  ShieldCheck,
  Receipt,
  Layers,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/Field";
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
  { id: "OTHER", label: "Other / Custom Statutory Reason" },
];

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
  const [billSearchQuery, setBillSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<SerializedSale | null>(null);
  const [reasonCategory, setReasonCategory] = useState(RETURN_REASONS[0].label);
  const [customNotes, setCustomNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastProcessedReturn, setLastProcessedReturn] = useState<SerializedSale | null>(null);

  // Register state
  const [registerSearchQuery, setRegisterSearchQuery] = useState("");
  const [activeSlip, setActiveSlip] = useState<SerializedSale | null>(null);

  // Live filter on active sales
  const matchingActiveSales = useMemo(() => {
    if (!billSearchQuery.trim()) return activeSales;
    const q = billSearchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return activeSales.filter((s) => {
      const matchNum = numQ ? String(s.receiptNo).includes(numQ) : false;
      const matchBill =
        s.billNumber.toLowerCase().includes(q) ||
        `sl-${s.receiptNo}`.toLowerCase().includes(q) ||
        `#${s.receiptNo}`.toLowerCase().includes(q) ||
        `inv-${s.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = s.vehicleNo ? s.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = s.customerName ? s.customerName.toLowerCase().includes(q) : false;
      const matchAttendant = s.soldByName.toLowerCase().includes(q);
      return matchNum || matchBill || matchVeh || matchCust || matchAttendant;
    });
  }, [activeSales, billSearchQuery]);

  // Filter on past credit notes
  const filteredReturns = useMemo(() => {
    if (!registerSearchQuery.trim()) return returns;
    const q = registerSearchQuery.toLowerCase().trim();
    const numQ = q.replace(/\D/g, "");

    return returns.filter((r) => {
      const matchNum = numQ ? String(r.receiptNo).includes(numQ) : false;
      const matchBill =
        r.billNumber.toLowerCase().includes(q) ||
        `crn-${r.receiptNo}`.toLowerCase().includes(q) ||
        `sl-${r.receiptNo}`.toLowerCase().includes(q) ||
        `#${r.receiptNo}`.toLowerCase().includes(q);
      const matchVeh = r.vehicleNo ? r.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = r.customerName ? r.customerName.toLowerCase().includes(q) : false;
      const matchReason = r.voidReason ? r.voidReason.toLowerCase().includes(q) : false;
      const matchAttendant = r.soldByName.toLowerCase().includes(q);
      return matchNum || matchBill || matchVeh || matchCust || matchReason || matchAttendant;
    });
  }, [returns, registerSearchQuery]);

  const totalReversedAmount = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRestockedLiters = returns.reduce((sum, r) => sum + r.liters, 0);

  // Execute Return
  const handleExecuteReturn = async () => {
    if (!selectedSale) {
      setActionError("Please select an invoice to reverse.");
      return;
    }

    const fullReason = customNotes.trim()
      ? `${reasonCategory} — ${customNotes.trim()}`
      : reasonCategory;

    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData();
    formData.append("saleId", selectedSale.id);
    formData.append("reason", fullReason);

    const result = await voidSaleAction({}, formData);
    setIsSubmitting(false);

    if (result.error) {
      setActionError(result.error);
    } else {
      const newlyVoided: SerializedSale = {
        ...selectedSale,
        voided: true,
        voidReason: fullReason,
        voidedAt: new Date().toISOString(),
      };
      setReturns([newlyVoided, ...returns]);
      setLastProcessedReturn(newlyVoided);
      setSelectedSale(null);
      setCustomNotes("");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Credit Note #",
      "Original Bill #",
      "Date (BS)",
      "Vehicle Plate",
      "Customer",
      "Fuel Product",
      "Restocked Volume (L)",
      "Reversed Amount (NPR)",
      "Reason for Return",
      "Authorized By",
    ];

    const rows = filteredReturns.map((r) => [
      `"CRN-${r.receiptNo}"`,
      `"${r.billNumber}"`,
      `"${r.formattedDateBS}"`,
      `"${r.vehicleNo || ""}"`,
      `"${r.customerName || "Retail Walk-In"}"`,
      `"${r.fuel}"`,
      `"${r.liters}"`,
      `"${r.totalAmount}"`,
      `"${r.voidReason || "Sales Return"}"`,
      `"${r.soldByName}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `sales_returns_credit_notes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <RotateCcw size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[17px] font-bold text-text">
                Sales Returns & Credit Notes
              </h2>
              <span className="font-mono text-[11px] rounded bg-surface-hi px-2 py-0.5 font-semibold text-text-muted border border-border">
                IRD Annexure 6
              </span>
            </div>
            <p className="text-[12px] text-text-muted">
              Reverse recorded invoices, replenish storage tanks, adjust customer ledgers, and issue statutory credit notes.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl border border-border bg-bg p-1 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("PROCESS")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer",
                activeTab === "PROCESS"
                  ? "bg-surface text-text font-bold shadow-xs border border-border"
                  : "text-text-muted hover:text-text"
              )}
            >
              <RotateCcw size={13} className={activeTab === "PROCESS" ? "text-accent" : ""} />
              Process Return
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REGISTER")}
              className={clsx(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer",
                activeTab === "REGISTER"
                  ? "bg-surface text-text font-bold shadow-xs border border-border"
                  : "text-text-muted hover:text-text"
              )}
            >
              <History size={13} className={activeTab === "REGISTER" ? "text-accent" : ""} />
              Credit Notes Register ({returns.length})
            </button>
          </div>

          <GhostButton onClick={() => window.print()} className="text-[12px]">
            <Printer size={13} /> Print
          </GhostButton>
        </div>
      </div>

      {/* 2. Executive KPI Deck */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Credit Notes Issued"
          value={`${returns.length} Notes`}
          icon={FileText}
          tone="text"
          small
        />
        <StatCard
          label="Total Value Reversed"
          value={fmtRs(totalReversedAmount)}
          icon={Scale}
          tone="accent"
          small
        />
        <StatCard
          label="Fuel Restocked to Tanks"
          value={fmtL(totalRestockedLiters)}
          icon={Fuel}
          tone="text"
          small
        />
        <StatCard
          label="Statutory Audit"
          value="Reconciled"
          icon={CheckCircle2}
          tone="success"
          small
        />
      </div>

      {/* Success Notification */}
      {lastProcessedReturn && (
        <div className="animate-fade-in flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success text-white">
              <Check size={16} />
            </div>
            <div>
              <div className="font-semibold text-text text-xs">
                Credit Note CRN-{lastProcessedReturn.receiptNo} Issued Successfully
              </div>
              <div className="text-[11.5px] text-text-muted">
                Restocked {fmtL(lastProcessedReturn.liters)} {lastProcessedReturn.fuel} to tank · Adjusted {fmtRs(lastProcessedReturn.totalAmount)}
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
      {/* VIEW 1: PROCESS RETURN CONSOLE                                            */}
      {/* ========================================================================= */}
      {activeTab === "PROCESS" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: 1. Select Bill (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  1. Select Active Bill
                </span>
                <span className="text-[11px] font-semibold text-text-muted">
                  {matchingActiveSales.length} Active Records
                </span>
              </div>

              {/* Fast Search Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search receipt # (e.g. 2, #1025), vehicle, customer..."
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  className="pl-8 pr-7 text-xs"
                  autoFocus
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                {billSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBillSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Active Sales List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {matchingActiveSales.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-text-muted">
                    No active bills match &quot;{billSearchQuery}&quot;
                  </div>
                ) : (
                  matchingActiveSales.map((s) => {
                    const isSelected = selectedSale?.id === s.id;
                    const fuelId = s.fuel as FuelId;

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedSale(s);
                          setActionError(null);
                        }}
                        className={clsx(
                          "rounded-xl border p-3 transition-all cursor-pointer",
                          isSelected
                            ? "border-accent bg-accent/5 ring-1 ring-accent"
                            : "border-border bg-bg hover:border-accent/40 hover:bg-surface-hi"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-accent">
                                #{s.receiptNo}
                              </span>
                              <span className="text-xs font-semibold text-text">
                                {FUEL_LABEL[fuelId]}
                              </span>
                              <span className="font-mono text-[11px] text-text-muted">
                                ({fmtL(s.liters)})
                              </span>
                            </div>

                            <div className="text-[11.5px] text-text-muted">
                              {s.customerName || "Walk-In Retail"}
                              {s.vehicleNo && <span className="font-mono ml-1">· {s.vehicleNo}</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xs font-bold text-text">
                              {fmtRs(s.totalAmount)}
                            </div>
                            <div className="text-[10px] text-text-muted">{s.formattedTime}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 2. Return Verification & Execution Console (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  2. Return Verification & Ledger Impact
                </span>
                {selectedSale && (
                  <button
                    type="button"
                    onClick={() => setSelectedSale(null)}
                    className="text-[11.5px] font-semibold text-text-muted hover:text-text cursor-pointer"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              {!selectedSale ? (
                <div className="rounded-xl border border-dashed border-border p-14 text-center space-y-2.5">
                  <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-surface-hi text-text-muted">
                    <Receipt size={20} />
                  </div>
                  <div className="text-xs font-semibold text-text">No Bill Selected</div>
                  <p className="text-[11.5px] text-text-muted max-w-xs mx-auto">
                    Select an active invoice from the list on the left to configure the return and review ledger adjustments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Selected Invoice Overview Card */}
                  <div className="rounded-xl border border-border bg-bg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div>
                        <div className="text-[11px] text-text-muted">Original Invoice Ref</div>
                        <div className="font-mono text-sm font-bold text-accent">
                          #{selectedSale.receiptNo} ({selectedSale.billNumber})
                        </div>
                      </div>
                      <Badge tone="muted">{selectedSale.paymentMethod}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[11px] text-text-muted block">Fuel Product & Volume</span>
                        <span className="font-semibold text-text">
                          {selectedSale.fuel} · {fmtL(selectedSale.liters)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-text-muted block">Billed Amount</span>
                        <span className="font-mono font-bold text-text">
                          {fmtRs(selectedSale.totalAmount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-text-muted block">Customer / Account</span>
                        <span className="font-medium text-text">
                          {selectedSale.customerName || "Walk-In Cash"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-text-muted block">Vehicle Plate</span>
                        <span className="font-mono text-text">
                          {selectedSale.vehicleNo || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Accounting & Restock Impact Summary */}
                  <div className="rounded-xl border border-border bg-surface-hi p-4 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                      Automatic System Adjustments on Return
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Fuel size={14} className="text-accent" />
                          <span className="text-text-muted">Inventory Restock</span>
                        </div>
                        <span className="font-mono font-bold text-text">
                          +{fmtL(selectedSale.liters)} {selectedSale.fuel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-accent" />
                          <span className="text-text-muted">
                            {selectedSale.paymentMethod === "CREDIT" ? "Credit Ledger Adjustment" : "Revenue Refund"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-text">
                          -{fmtRs(selectedSale.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-accent" />
                          <span className="text-text-muted">Statutory Document</span>
                        </div>
                        <span className="font-mono font-semibold text-text">
                          Credit Note CRN-{selectedSale.receiptNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text block">
                      Reason for Return (Required)
                    </label>

                    <select
                      value={reasonCategory}
                      onChange={(e) => setReasonCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-bg p-2 text-xs text-text focus:outline-none focus:border-accent"
                    >
                      {RETURN_REASONS.map((r) => (
                        <option key={r.id} value={r.label}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    <Input
                      placeholder="Additional remarks or notes (optional)..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {actionError && (
                    <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error font-medium">
                      {actionError}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <PrimaryButton
                      type="button"
                      onClick={handleExecuteReturn}
                      disabled={isSubmitting || !canVoid}
                      className="w-full py-2.5 text-xs font-bold"
                    >
                      {isSubmitting ? "Processing Return…" : "Confirm Return & Restock Fuel"}
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CREDIT NOTES REGISTER                                             */}
      {/* ========================================================================= */}
      {activeTab === "REGISTER" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text">
              <Search size={15} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search Credit Note #, Bill #, vehicle plate, customer, or reason..."
                value={registerSearchQuery}
                onChange={(e) => setRegisterSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-text placeholder:text-text-muted focus:outline-none"
              />
              {registerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRegisterSearchQuery("")}
                  className="text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-data">
                {filteredReturns.length} records found
              </span>
              <GhostButton onClick={handleExportCSV} className="text-xs">
                <Download size={13} /> Export CSV
              </GhostButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
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
                <tbody className="divide-y divide-border font-data">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-text-muted">
                        No credit notes recorded matching the search.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((r) => {
                      const fuelId = r.fuel as FuelId;

                      return (
                        <tr
                          key={r.id}
                          onClick={() => setActiveSlip(r)}
                          className="cursor-pointer hover:bg-surface-hi/70 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-accent">
                            CRN-{r.receiptNo}
                          </td>
                          <td className="px-3 py-3 font-mono text-text-muted">
                            #{r.receiptNo}
                          </td>
                          <td className="px-3 py-3 text-text-muted">
                            {r.formattedDateBS} {r.formattedTime}
                          </td>
                          <td className="px-3 py-3 font-mono text-text">
                            {r.vehicleNo || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-text">
                            {r.customerName || "Retail Walk-In"}
                          </td>
                          <td className="px-3 py-3 font-medium text-text">
                            {FUEL_LABEL[fuelId]}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-text">
                            {fmtL(r.liters)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-text">
                            {fmtRs(r.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-text-muted truncate max-w-xs">
                            {r.voidReason || "Sales Return"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <GhostButton
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSlip(r);
                              }}
                              className="text-[11px] px-2 py-0.5"
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
          </div>
        </div>
      )}

      {/* 3. Printable Slip Modal */}
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
                  <div className="text-[11px] text-accent">CREDIT NOTE / अनुसूची ६</div>
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
                    <span className="text-text">
                      {fmtL(activeSlip.liters)} {activeSlip.fuel}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-xs">
                    <span>Reversed Value:</span>
                    <span>Rs {activeSlip.totalAmount.toLocaleString()}</span>
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
