"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Supplier, StationExpense, ExpenseLineItem } from "@/lib/purchases";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";
import { Field, Input, Select } from "@/components/ui/Field";
import { BSDateField } from "@/components/ui/BSDateField";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const SUPPLIERS_KEY = "fsm_suppliers";
const EXPENSES_KEY = "fsm_expenses";
const ADD_NEW_SUPPLIER = "__add_new__";
const VAT_RATE = 0.13;

const LEDGERS = [
  "Station Maintenance",
  "Electricity & Utilities",
  "Generator Diesel",
  "Staff Meals & Tea",
  "Stationery & Audit",
  "Municipal & Taxes",
  "Other",
];

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const emptyLine = (): ExpenseLineItem => ({ name: "", ledger: LEDGERS[0], quantity: "1", detail: "", cost: 0, taxable: false });

/**
 * A full page, not a modal, mirroring an expense bill exactly the way a
 * NOC fuel bill is entered elsewhere in Purchases: a supplier, one or more
 * line items (each separately marked taxable or not), and the totals
 * derived from those lines rather than typed in as one lump figure.
 */
export function AddExpenseForm() {
  const router = useRouter();

  const [suppliers] = useState<Supplier[]>(() => {
    if (typeof window === "undefined") return MOCK_SUPPLIERS;
    try {
      const saved = localStorage.getItem(SUPPLIERS_KEY);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : MOCK_SUPPLIERS;
    } catch {
      return MOCK_SUPPLIERS;
    }
  });

  const [supplierId, setSupplierId] = useState("");
  const [dateBS, setDateBS] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [lines, setLines] = useState<ExpenseLineItem[]>([emptyLine()]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [description, setDescription] = useState("");

  const handleSupplierChange = (value: string) => {
    if (value === ADD_NEW_SUPPLIER) {
      router.push("/purchases/suppliers/new");
      return;
    }
    setSupplierId(value);
  };

  const updateLine = (index: number, patch: Partial<ExpenseLineItem>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    let taxable = 0;
    let nonTaxable = 0;
    for (const line of lines) {
      if (line.taxable) taxable += line.cost;
      else nonTaxable += line.cost;
    }
    const discount = Number(discountAmount) || 0;
    const vat = Math.round(taxable * VAT_RATE * 100) / 100;
    const grandTotal = taxable + vat + nonTaxable - discount;
    return { totalPurchase: taxable + nonTaxable, taxable, nonTaxable, vat, grandTotal };
  }, [lines, discountAmount]);

  const supplier = suppliers.find((s) => s.id === supplierId);
  const isValid = !!dateBS.trim() && lines.some((l) => l.name.trim() && l.cost > 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const newExpense: StationExpense = {
      id: `exp-${Date.now()}`,
      voucherNo: `PV-${dateBS.slice(0, 4) || "0000"}-${String(Date.now()).slice(-4)}`,
      dateBS,
      category: lines[0]?.ledger || "Other",
      description: description.trim(),
      amountNpr: totals.grandTotal,
      recipientName: supplier?.name ?? "",
      supplierPan: supplier?.panVatNo,
      invoiceNo: invoiceNo.trim() || undefined,
      items: lines.filter((l) => l.name.trim() || l.cost > 0),
      taxableAmount: totals.taxable,
      nonTaxableAmount: totals.nonTaxable,
      discountAmount: Number(discountAmount) || 0,
      vatAmount: totals.vat,
      grandTotal: totals.grandTotal,
    };

    try {
      const saved = localStorage.getItem(EXPENSES_KEY);
      const existing: StationExpense[] = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(existing) ? existing : [];
      localStorage.setItem(EXPENSES_KEY, JSON.stringify([newExpense, ...list]));
    } catch {}

    router.push("/purchases/expenses");
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {/* Expense Detail */}
      <section>
        <h3 className="mb-3 font-display text-[13.5px] font-bold uppercase tracking-wide text-text">Expense Detail</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Supplier">
            <Select value={supplierId} onChange={(e) => handleSupplierChange(e.target.value)}>
              <option value="">Select Supplier</option>
              {suppliers.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value={ADD_NEW_SUPPLIER}>+ Add New Supplier…</option>
            </Select>
          </Field>
          <Field label="Purchase Date (in Nepali)">
            <BSDateField value={dateBS} onChange={setDateBS} />
          </Field>
          <Field label="Invoice / Bill Number">
            <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </Field>
        </div>
      </section>

      {/* Expense Line Items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-[13.5px] font-bold uppercase tracking-wide text-text">Expense Items</h3>
          <GhostButton type="button" onClick={addLine} className="gap-1.5 text-xs">
            <Plus size={14} /> Add Line
          </GhostButton>
        </div>

        <div className="flex flex-col gap-3">
          {lines.map((line, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg/40 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="Expense Name">
                  <Input value={line.name} onChange={(e) => updateLine(i, { name: e.target.value })} />
                </Field>
                <Field label="Ledger">
                  <Select value={line.ledger} onChange={(e) => updateLine(i, { ledger: e.target.value })}>
                    {LEDGERS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Quantity">
                  <Input value={line.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} className="font-mono" />
                </Field>
                <Field label="Cost (Rs)">
                  <Input
                    inputMode="decimal"
                    value={line.cost || ""}
                    onChange={(e) => updateLine(i, { cost: Number(e.target.value) || 0 })}
                    className="font-mono"
                  />
                </Field>
                <Field label="Detail">
                  <Input value={line.detail} onChange={(e) => updateLine(i, { detail: e.target.value })} />
                </Field>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                  <input
                    type="checkbox"
                    checked={line.taxable}
                    onChange={(e) => updateLine(i, { taxable: e.target.checked })}
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  Taxable
                </label>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-error hover:underline"
                  >
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Amount Detail */}
      <section>
        <h3 className="mb-3 font-display text-[13.5px] font-bold uppercase tracking-wide text-text">Amount Detail</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">Total Purchase Amount</span>
            <div className="rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm font-semibold text-text">
              {rs(totals.totalPurchase)}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">Taxable Amount</span>
            <div className="rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm font-semibold text-text">
              {rs(totals.taxable)}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">Non-Taxable Amount</span>
            <div className="rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm font-semibold text-text">
              {rs(totals.nonTaxable)}
            </div>
          </div>
          <Field label="Discount Amount">
            <Input inputMode="decimal" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="font-mono" />
          </Field>
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">VAT Amount (13%)</span>
            <div className="rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm font-semibold text-text">
              {rs(totals.vat)}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-accent">Grand Total</span>
            <div className="rounded-lg border border-accent/40 bg-accent/5 px-[11px] py-[9px] font-data text-sm font-bold text-accent">
              {rs(totals.grandTotal)}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Field label="Purchase Description">
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm text-text placeholder:text-text-muted/60"
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
        <GhostButton type="button" onClick={() => router.push("/purchases/expenses")}>
          Cancel
        </GhostButton>
        <PrimaryButton type="submit" disabled={!isValid}>
          Save Expense
        </PrimaryButton>
      </div>
    </form>
  );
}
