"use client";

import { useState, useMemo } from "react";
import {
  Undo2,
  Printer,
  Download,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Fuel,
  Car,
  User,
  Clock,
  Building2,
  X,
  Scale,
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

export function SalesReturnsView({
  initialData,
  canVoid,
}: {
  initialData: SalesReturnsPageData;
  canVoid: boolean;
}) {
  const [returns, setReturns] = useState<SerializedSale[]>(initialData.returns);
  const [activeSales] = useState<SerializedSale[]>(initialData.activeSales);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState<SerializedSale | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // New Credit Note Dialog State
  const [targetBillQuery, setTargetBillQuery] = useState("");
  const [selectedTargetSale, setSelectedTargetSale] = useState<SerializedSale | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchBill = r.billNumber.toLowerCase().includes(q) || String(r.receiptNo).includes(q);
      const matchVeh = r.vehicleNo ? r.vehicleNo.toLowerCase().includes(q) : false;
      const matchCust = r.customerName ? r.customerName.toLowerCase().includes(q) : false;
      const matchReason = r.voidReason ? r.voidReason.toLowerCase().includes(q) : false;
      return matchBill || matchVeh || matchCust || matchReason;
    });
  }, [returns, searchQuery]);

  const matchingActiveSales = useMemo(() => {
    if (!targetBillQuery.trim()) return activeSales.slice(0, 8);
    const q = targetBillQuery.toLowerCase().trim();
    return activeSales.filter(
      (s) =>
        s.billNumber.toLowerCase().includes(q) ||
        String(s.receiptNo).includes(q) ||
        (s.vehicleNo && s.vehicleNo.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q))
    );
  }, [activeSales, targetBillQuery]);

  const totalReversedAmount = returns.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRestockedLiters = returns.reduce((sum, r) => sum + r.liters, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Credit Note #",
      "Original Bill #",
      "Date & Time",
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
      `"${r.createdAt}"`,
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

  const handleExecuteReturn = async () => {
    if (!selectedTargetSale) {
      setVoidError("Please select the original invoice to reverse.");
      return;
    }
    if (returnReason.trim().length < 3) {
      setVoidError("Please specify a reason for this credit note (min 3 characters).");
      return;
    }

    setIsSubmitting(true);
    setVoidError(null);

    const formData = new FormData();
    formData.append("saleId", selectedTargetSale.id);
    formData.append("reason", returnReason);

    const result = await voidSaleAction({}, formData);
    setIsSubmitting(false);

    if (result.error) {
      setVoidError(result.error);
    } else {
      const newlyVoided: SerializedSale = {
        ...selectedTargetSale,
        voided: true,
        voidReason: returnReason,
        voidedAt: new Date().toISOString(),
      };
      setReturns([newlyVoided, ...returns]);
      setIsIssueModalOpen(false);
      setSelectedTargetSale(null);
      setReturnReason("");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10 text-error">
            <Undo2 size={20} />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-text">
              Sales Returns & Credit Notes (बिक्री फिर्ता तथा क्रेडिट नोट)
            </h2>
            <p className="text-[12px] text-text-muted">
              Statutory credit note register, tank stock replenishment audits, and transaction reversal accounting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Register
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
          {canVoid && (
            <PrimaryButton
              onClick={() => setIsIssueModalOpen(true)}
              className="text-[12.5px] bg-error hover:bg-error/90 text-white"
            >
              <Plus size={14} /> Issue Credit Note
            </PrimaryButton>
          )}
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Credit Notes Issued"
          value={`${returns.length} Returns`}
          icon={Undo2}
          tone="error"
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
          label="IRD Statutory Compliance"
          value="अनुसूची ६ Reconciled"
          icon={CheckCircle2}
          tone="success"
          small
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by Bill #, vehicle plate, customer, or return reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <span className="text-[12px] text-text-muted">
          Showing <strong>{filteredReturns.length}</strong> Credit Notes
        </span>
      </div>

      {/* 4. Credit Notes Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3.5">Credit Note #</th>
                <th className="px-3 py-3.5">Original Bill #</th>
                <th className="px-3 py-3.5">Date (BS)</th>
                <th className="px-3 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-3 py-3.5">Product</th>
                <th className="px-3 py-3.5 text-right">Volume Restocked</th>
                <th className="px-4 py-3.5 text-right font-bold">Reversed Value</th>
                <th className="px-4 py-3.5">Return Reason</th>
                <th className="px-3 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted font-body">
                    No sales returns recorded in this station.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => {
                  const fuelId = r.fuel as FuelId;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReturn(r)}
                      className="cursor-pointer hover:bg-surface-hi/70 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-error">
                        CRN-{r.receiptNo}
                      </td>
                      <td className="px-3 py-3 font-mono text-accent font-semibold">
                        {r.billNumber}
                      </td>
                      <td className="px-3 py-3 text-text-muted">{r.formattedTime}</td>
                      <td className="px-3 py-3 font-body">
                        {r.vehicleNo ? (
                          <span className="font-mono bg-bg border border-border px-1.5 py-0.5 rounded text-[11px] font-bold text-text">
                            {r.vehicleNo}
                          </span>
                        ) : (
                          <span className="text-[11px] text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-body font-medium text-text">
                        {r.customerName || "Retail Walk-In"}
                      </td>
                      <td className="px-3 py-3 font-body">
                        <span className="font-medium text-text">{FUEL_LABEL[fuelId]}</span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-text">
                        {fmtL(r.liters)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-error text-[13px]">
                        -{fmtRs(r.totalAmount)}
                      </td>
                      <td className="px-4 py-3 font-body text-text-muted truncate max-w-xs text-[12px]">
                        {r.voidReason || "Dispense reversed"}
                      </td>
                      <td className="px-3 py-3 text-right font-body">
                        <GhostButton
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(r);
                          }}
                          className="text-[11px] px-2 py-0.5"
                        >
                          View Slip
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

      {/* 5. Issue Credit Note / Reverse Bill Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-error text-white">
                  <Undo2 size={18} />
                </div>
                <div>
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Issue Credit Note / Void Bill (क्रेडिट नोट जारी)
                  </h3>
                  <p className="text-[11.5px] text-text-muted">
                    Reverse a billed invoice, restock fuel, and adjust accounts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Select or Search Active Sale */}
              <div>
                <label className="text-[12.5px] font-medium text-text block mb-1.5">
                  1. Search & Select Invoice to Reverse:
                </label>
                <Input
                  placeholder="Search active bill # (e.g. SL-1025) or vehicle plate..."
                  value={targetBillQuery}
                  onChange={(e) => setTargetBillQuery(e.target.value)}
                  autoFocus
                />

                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border bg-bg divide-y divide-border">
                  {matchingActiveSales.length === 0 ? (
                    <div className="p-3 text-center text-[12px] text-text-muted">
                      No active bills found matching search.
                    </div>
                  ) : (
                    matchingActiveSales.map((s) => {
                      const isSelected = selectedTargetSale?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedTargetSale(s)}
                          className={clsx(
                            "p-2.5 text-[12px] cursor-pointer transition-colors flex items-center justify-between",
                            isSelected
                              ? "bg-accent/15 text-accent font-semibold"
                              : "hover:bg-surface-hi text-text"
                          )}
                        >
                          <div>
                            <span className="font-mono font-bold">{s.billNumber}</span> ·{" "}
                            <span>{FUEL_LABEL[s.fuel as FuelId]}</span> ({fmtL(s.liters)})
                            <div className="text-[11px] text-text-muted">
                              {s.customerName || "Walk-In"} {s.vehicleNo && `· ${s.vehicleNo}`}
                            </div>
                          </div>
                          <span className="font-data font-bold">{fmtRs(s.totalAmount)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Confirmation & Reason */}
              {selectedTargetSale && (
                <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2.5 text-[12px] animate-fade-in">
                  <div className="font-semibold text-text border-b border-border pb-1.5 flex justify-between">
                    <span>Selected Invoice:</span>
                    <span className="font-mono text-accent font-bold">
                      {selectedTargetSale.billNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Volume to Restock:</span>
                    <strong className="text-text">{fmtL(selectedTargetSale.liters)}</strong>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Amount to Reverse:</span>
                    <strong className="text-error">{fmtRs(selectedTargetSale.totalAmount)}</strong>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[12.5px] font-medium text-text block mb-1.5">
                  2. Reason for Credit Note (Required for IRD & Station Audit):
                </label>
                <Input
                  placeholder="e.g. Dispense aborted, meter calibration test, incorrect billing entry"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>

              {voidError && (
                <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-[12px] text-error">
                  {voidError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-surface-hi px-5 py-3.5">
              <GhostButton onClick={() => setIsIssueModalOpen(false)} className="text-[12.5px]">
                Cancel
              </GhostButton>
              <PrimaryButton
                onClick={handleExecuteReturn}
                disabled={isSubmitting || !selectedTargetSale}
                className="bg-error hover:bg-error/90 text-white text-[12.5px]"
              >
                {isSubmitting ? "Processing..." : "Issue Credit Note"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* 6. Printable Credit Note Slip View */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/15 text-error">
                  <FileText size={17} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Credit Note Slip (क्रेडिट नोट — अनुसूची ६)
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    CRN-{selectedReturn.receiptNo} against {selectedReturn.billNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Slip Print Area */}
              <div className="print-area rounded-xl border border-border bg-bg p-4 space-y-2 text-[12.5px]">
                <div className="border-b border-dashed border-border pb-2 text-center">
                  <div className="font-display font-bold text-text text-[14px]">
                    SHREE PASHUPATI PETROLEUM CENTER
                  </div>
                  <div className="text-[11.5px] font-semibold text-error">
                    CREDIT NOTE / बिक्री फिर्ता (अनुसूची ६)
                  </div>
                  <div className="font-mono text-[11px] text-text-muted">
                    CREDIT NOTE #CRN-{selectedReturn.receiptNo} · Date: {selectedReturn.formattedDateBS}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Original Invoice Ref:</span>
                    <span className="font-mono font-bold text-text">{selectedReturn.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Customer / Buyer:</span>
                    <span className="font-medium text-text">
                      {selectedReturn.customerName || "Retail Cash"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Vehicle Plate:</span>
                    <span className="font-mono text-text">{selectedReturn.vehicleNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Fuel Restocked:</span>
                    <span className="font-medium text-text">
                      {fmtL(selectedReturn.liters)} {FUEL_LABEL[selectedReturn.fuel as FuelId]}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-bold text-[13.5px]">
                    <span className="text-error">Credit Refund Amount:</span>
                    <span className="font-data text-error font-bold">
                      Rs {selectedReturn.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-dashed border-border pt-2 text-[11.5px] text-text-muted">
                  <strong>Reason for Return:</strong> {selectedReturn.voidReason || "Billed invoice reversed"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-surface-hi px-5 py-3.5">
              <GhostButton onClick={handlePrint} className="text-[12.5px]">
                <Printer size={14} /> Print Credit Slip
              </GhostButton>
              <GhostButton onClick={() => setSelectedReturn(null)} className="text-[12.5px]">
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
