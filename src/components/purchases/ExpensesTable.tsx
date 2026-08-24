"use client";

import { useState } from "react";
import { Plus, X, Wallet, CheckCircle2, Receipt, Filter, Check, IndianRupee } from "lucide-react";
import type { StationExpense } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function ExpensesTable({ expenses }: { expenses: StationExpense[] }) {
  const [list, setList] = useState<StationExpense[]>(expenses);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [category, setCategory] = useState<StationExpense["category"]>("Station Maintenance");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("2500");
  const [paymentMode, setPaymentMode] = useState<StationExpense["paymentMode"]>("Cash Till");
  const [recipient, setRecipient] = useState("");

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: StationExpense = {
      id: `exp-${Date.now()}`,
      voucherNo: `PV-2083-${String(list.length + 83).padStart(3, "0")}`,
      dateBS,
      category,
      description,
      amountNpr: parseFloat(amount) || 0,
      paymentMode,
      recipientName: recipient,
      approvedByName: "Anita Shrestha (Manager)",
      receiptAttached: true,
    };

    setList([newExpense, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setDescription("");
      setRecipient("");
    }, 1000);
  };

  const filtered = list.filter((e) => {
    if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
    return true;
  });

  const totalExpense = filtered.reduce((sum, e) => sum + e.amountNpr, 0);

  return (
    <div>
      {/* Filters and Action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>CATEGORY:</span>
          </div>

          <div className="w-[200px]">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Expense Categories</option>
              <option value="Electricity & Utilities">Electricity & Utilities</option>
              <option value="Generator Diesel">Generator Diesel</option>
              <option value="Station Maintenance">Station Maintenance</option>
              <option value="Staff Meals & Tea">Staff Meals & Tea</option>
              <option value="Municipal & Taxes">Municipal & Taxes</option>
              <option value="Stationery & Audit">Stationery & Audit</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">
            Filtered Total: <strong className="font-data text-accent">{fmtRs(totalExpense)}</strong>
          </span>
          <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus size={15} />
            Record Expense
          </PrimaryButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">VOUCHER NO</th>
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">CATEGORY</th>
              <th className="px-3 py-2.5 font-medium">DESCRIPTION / PARTICULARS</th>
              <th className="px-3 py-2.5 font-medium">PAID TO</th>
              <th className="px-3 py-2.5 font-medium">PAYMENT MODE</th>
              <th className="px-3 py-2.5 text-right font-medium">AMOUNT</th>
              <th className="px-3 py-2.5 text-center font-medium">VOUCHER</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                <td className="px-3 py-3 font-data text-[12.5px] font-semibold text-accent">
                  {e.voucherNo}
                </td>

                <td className="px-3 py-3 font-data text-[12.5px] text-text-muted">{e.dateBS}</td>

                <td className="px-3 py-3">
                  <Badge tone="muted">{e.category}</Badge>
                </td>

                <td className="px-3 py-3 text-[13px] text-text">{e.description}</td>

                <td className="px-3 py-3 text-[12.5px] text-text-muted">{e.recipientName}</td>

                <td className="px-3 py-3 font-data text-[12px] text-text-muted">{e.paymentMode}</td>

                <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                  {fmtRs(e.amountNpr)}
                </td>

                <td className="px-3 py-3 text-center">
                  <Badge tone={e.receiptAttached ? "success" : "muted"}>
                    {e.receiptAttached ? "ATTACHED" : "CASH MEMO"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Record Day Book Expense</h3>
                  <p className="text-xs text-text-muted">Log petty cash, utility bills, or maintenance disbursements</p>
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
                <h4 className="font-display text-base font-semibold text-text">Expense Recorded</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Voucher created for {fmtRs(parseFloat(amount) || 0)}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecord} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date (BS)">
                    <Input value={dateBS} onChange={(e) => setDateBS(e.target.value)} required />
                  </Field>
                  <Field label="Expense Category">
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as StationExpense["category"])}
                    >
                      <option value="Station Maintenance">Station Maintenance</option>
                      <option value="Electricity & Utilities">Electricity & Utilities</option>
                      <option value="Generator Diesel">Generator Diesel</option>
                      <option value="Staff Meals & Tea">Staff Meals & Tea</option>
                      <option value="Stationery & Audit">Stationery & Audit</option>
                      <option value="Municipal & Taxes">Municipal & Taxes</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Expense Particulars / Description">
                  <Input
                    placeholder="e.g. Forecourt light bulb replacement & wiring"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Amount (NPR)">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Payment Mode">
                    <Select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as StationExpense["paymentMode"])}
                    >
                      <option value="Cash Till">Cash Till (Petty cash)</option>
                      <option value="Fonepay QR">Fonepay QR</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Paid To / Vendor Name">
                  <Input
                    placeholder="e.g. Local Hardware Mart / Service tech"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                  />
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Voucher</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
