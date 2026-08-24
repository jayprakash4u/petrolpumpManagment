"use client";

import { useState } from "react";
import { Plus, X, Undo2, CheckCircle2, ShieldCheck, FileText, Check } from "lucide-react";
import type { PurchaseReturn } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function PurchaseReturnsTable({ returns }: { returns: PurchaseReturn[] }) {
  const [list, setList] = useState<PurchaseReturn[]>(returns);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplier, setSupplier] = useState("Gulf Lubricants Nepal Ltd.");
  const [itemDescription, setItemDescription] = useState("");
  const [qty, setQty] = useState("5");
  const [unitPrice, setUnitPrice] = useState("520");
  const [reason, setReason] = useState<PurchaseReturn["reason"]>("Damaged Packaging / Seal");

  const totalReturnVal = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);

  const handleRaise = (e: React.FormEvent) => {
    e.preventDefault();
    const newReturn: PurchaseReturn = {
      id: `pr-${Date.now()}`,
      debitNoteNo: `DN-2083-${String(list.length + 1).padStart(3, "0")}`,
      originalInvoiceNo: invoiceNo,
      dateBS: "2083-05-03",
      supplierId: "sup-gulf",
      supplierName: supplier,
      itemDescription,
      quantity: parseInt(qty, 10) || 1,
      unitPriceNpr: parseFloat(unitPrice) || 0,
      totalReturnAmountNpr: totalReturnVal,
      reason,
      status: "Approved & Adjusted",
      approvedByName: "Anita Shrestha (Manager)",
    };

    setList([newReturn, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setInvoiceNo("");
      setItemDescription("");
    }, 1000);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-text">Purchase Returns & Debit Notes</h3>
          <p className="text-xs text-text-muted">
            Formal supplier returns for damaged packaging, seal leaks, or rejected off-spec deliveries
          </p>
        </div>
        <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
          <Plus size={15} />
          Issue Debit Note
        </PrimaryButton>
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
            {list.map((r) => (
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
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
                  Credit adjustment of {fmtRs(totalReturnVal)} raised to {supplier}.
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
                    </Select>
                  </Field>
                </div>

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
                    onChange={(e) => setReason(e.target.value as PurchaseReturn["reason"])}
                  >
                    <option value="Damaged Packaging / Seal">Damaged Packaging / Seal</option>
                    <option value="Off-Spec Density">Off-Spec Density (Fuel rejected)</option>
                    <option value="Excess Shipment">Excess Shipment</option>
                    <option value="Expired Batch">Expired Batch</option>
                  </Select>
                </Field>

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
