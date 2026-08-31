"use client";

import { useState, useEffect } from "react";
import { Plus, X, Undo2, CheckCircle2, ShieldCheck, FileText, Check, Search, Filter } from "lucide-react";
import type { PurchaseReturn } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const STORAGE_KEY = "fsm_purchase_returns";

export function PurchaseReturnsTable({ returns }: { returns: PurchaseReturn[] }) {
  const [list, setList] = useState<PurchaseReturn[]>(returns);
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
        }
      }
    } catch {}
  }, []);

  const saveList = (updated: PurchaseReturn[]) => {
    setList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Form state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplier, setSupplier] = useState("Gulf Lubricants Nepal Ltd.");
  const [customSupplier, setCustomSupplier] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [qty, setQty] = useState("5");
  const [unitPrice, setUnitPrice] = useState("520");
  const [reason, setReason] = useState<string>("Damaged Packaging / Seal");
  const [customReason, setCustomReason] = useState("");

  const totalReturnVal = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);

  const handleRaise = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSupplier = supplier === "Other" ? (customSupplier.trim() || "Supplier") : supplier;
    const finalReason = reason === "Other" ? (customReason.trim() || "Rejected Goods") : reason;

    const newReturn: PurchaseReturn = {
      id: `pr-${Date.now()}`,
      debitNoteNo: `DN-2083-${String(list.length + 1).padStart(3, "0")}`,
      originalInvoiceNo: invoiceNo.trim(),
      dateBS: "2083-05-03",
      supplierId: "sup-custom",
      supplierName: finalSupplier,
      itemDescription: itemDescription.trim(),
      quantity: parseInt(qty, 10) || 1,
      unitPriceNpr: parseFloat(unitPrice) || 0,
      totalReturnAmountNpr: totalReturnVal,
      reason: finalReason,
      status: "Approved & Adjusted",
      approvedByName: "Anita Shrestha (Manager)",
    };

    saveList([newReturn, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setInvoiceNo("");
      setItemDescription("");
      setCustomSupplier("");
      setCustomReason("");
    }, 1000);
  };

  const reasons = Array.from(
    new Set([
      "Damaged Packaging / Seal",
      "Off-Spec Density",
      "Excess Shipment",
      "Expired Batch",
      ...list.map((r) => r.reason),
    ])
  );

  const filtered = list.filter((r) => {
    if (reasonFilter !== "ALL" && r.reason !== reasonFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchDebit = r.debitNoteNo.toLowerCase().includes(q);
      const matchInvoice = r.originalInvoiceNo.toLowerCase().includes(q);
      const matchSupplier = r.supplierName.toLowerCase().includes(q);
      const matchItem = r.itemDescription.toLowerCase().includes(q);
      const matchReason = r.reason.toLowerCase().includes(q);
      if (!matchDebit && !matchInvoice && !matchSupplier && !matchItem && !matchReason) return false;
    }
    return true;
  });

  const totalCreditSum = filtered.reduce((sum, r) => sum + r.totalReturnAmountNpr, 0);

  return (
    <div>
      {/* Search and Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-[240px] sm:w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search debit note, invoice, item, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>REASON:</span>
          </div>

          <div className="w-[190px]">
            <Select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Reasons</option>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Total Claimed: <strong className="font-data text-accent">{fmtRs(totalCreditSum)}</strong>
          </span>
          <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus size={15} />
            Issue Debit Note
          </PrimaryButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">DEBIT NOTE NO</th>
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER</th>
              <th className="px-3 py-2.5 font-medium">ORIGINAL INVOICE</th>
              <th className="px-3 py-2.5 font-medium">ITEM & RETURN REASON</th>
              <th className="px-3 py-2.5 text-right font-medium">QTY</th>
              <th className="px-3 py-2.5 text-right font-medium">CREDIT VALUE</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-xs text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Undo2 size={24} className="text-text-muted/40" />
                    <span>No purchase returns match "{searchQuery || reasonFilter}".</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3 font-data text-[13px] font-semibold text-accent">
                    {r.debitNoteNo}
                  </td>

                  <td className="px-3 py-3 font-data text-[12.5px] text-text-muted">{r.dateBS}</td>

                  <td className="px-3 py-3 text-[13px] font-medium text-text">{r.supplierName}</td>

                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{r.originalInvoiceNo}</td>

                  <td className="px-3 py-3">
                    <div className="text-[12.5px] font-semibold text-text">{r.itemDescription}</div>
                    <div className="text-[11px] text-error font-medium">{r.reason}</div>
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{r.quantity}</td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                    {fmtRs(r.totalReturnAmountNpr)}
                  </td>

                  <td className="px-3 py-3 text-center">
                    <Badge tone="success">
                      <ShieldCheck size={10} />
                      ADJUSTED
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Undo2 size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Issue Debit Note (Return)</h3>
                  <p className="text-xs text-text-muted">Return damaged goods or claim credit on supplier bill</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Debit Note Issued</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Credit adjustment of {fmtRs(totalReturnVal)} raised to {supplier === "Other" ? customSupplier : supplier}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRaise} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Original Supplier Invoice No">
                    <Input
                      placeholder="e.g. GL-INV-9941"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Supplier Name">
                    <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
                      <option value="Gulf Lubricants Nepal Ltd.">Gulf Lubricants Nepal</option>
                      <option value="Castrol India & BP Distributors">Castrol India & BP</option>
                      <option value="Nepal Oil Corporation (NOC)">Nepal Oil Corporation</option>
                      <option value="Himalayan Petroleum Equipment">Himalayan Spares</option>
                      <option value="Other">Other (Specify)</option>
                    </Select>
                  </Field>
                </div>

                {supplier === "Other" && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                    <Field label="Custom Supplier Name">
                      <Input
                        placeholder="e.g. Servo IOC Distributor, Local Supplier"
                        value={customSupplier}
                        onChange={(e) => setCustomSupplier(e.target.value)}
                        required
                        autoFocus
                      />
                    </Field>
                  </div>
                )}

                <Field label="Returned Item & Specification">
                  <Input
                    placeholder="e.g. Gulf Pride 4T Plus (Damaged Carton / Leaking cans)"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Return Quantity">
                    <Input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Unit Purchase Price (NPR)">
                    <Input
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <Field label="Return Reason">
                  <Select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="Damaged Packaging / Seal">Damaged Packaging / Seal</option>
                    <option value="Off-Spec Density">Off-Spec Density (Fuel rejected)</option>
                    <option value="Excess Shipment">Excess Shipment</option>
                    <option value="Expired Batch">Expired Batch</option>
                    <option value="Other">Other (Specify)</option>
                  </Select>
                </Field>

                {reason === "Other" && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
                    <Field label="Custom Return Reason">
                      <Input
                        placeholder="e.g. Incorrect viscosity sent, wrong batch code, nozzle defect"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        required
                        autoFocus
                      />
                    </Field>
                  </div>
                )}

                <div className="rounded-xl border border-accent/30 bg-accent/8 p-3 text-xs text-text-muted">
                  <div className="flex items-center justify-between">
                    <span>Total Debit Credit Value:</span>
                    <span className="font-data text-base font-bold text-accent">{fmtRs(totalReturnVal)}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Issue Debit Note</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
