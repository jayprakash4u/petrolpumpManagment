"use client";

import { useState } from "react";
import {
  Banknote,
  FileText,
  NotebookPen,
  ArrowLeftRight,
  PlusCircle,
  Search,
  CheckCircle2,
  Printer,
  Eye,
  Building2,
  Receipt,
} from "lucide-react";
import {
  type VoucherEntry,
  type VoucherType,
  type PaymentChannel,
} from "@/lib/accounts";
import {
  getVoucherEntries,
  getLedgerHeads,
  createVoucher,
} from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const VOUCHER_METADATA: Record<
  VoucherType,
  { title: string; subtitle: string; icon: React.ComponentType<{ size?: number }> }
> = {
  RECEIPT: {
    title: "Receipt Vouchers (Money In)",
    subtitle: "Record customer cash/bank payments, receivables collections, and direct revenues",
    icon: Banknote,
  },
  PAYMENT: {
    title: "Payment Vouchers (Money Out)",
    subtitle: "Record operating expenses, supplier payments, tanker decanting, and payouts",
    icon: FileText,
  },
  JOURNAL: {
    title: "Journal Vouchers (Adjustment Entries)",
    subtitle: "Manual double-entry adjustments, depreciation, and inter-ledger transfers",
    icon: NotebookPen,
  },
  CONTRA: {
    title: "Contra Entries (Cash ↔ Bank)",
    subtitle: "Internal money movements between station safe, cash tills, and bank accounts",
    icon: ArrowLeftRight,
  },
  DEBIT_NOTE: {
    title: "Debit Notes",
    subtitle: "Claims against supplier shortage or goods returned",
    icon: Receipt,
  },
  CREDIT_NOTE: {
    title: "Credit Notes",
    subtitle: "Customer billing corrections and return adjustments",
    icon: Receipt,
  },
};

export function VouchersView({
  voucherType,
  userName = "Station Operator",
}: {
  voucherType: VoucherType;
  userName?: string;
}) {
  const [vouchers, setVouchers] = useState<VoucherEntry[]>(() => getVoucherEntries(voucherType));
  const [ledgers] = useState(() => getLedgerHeads());
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherEntry | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State
  const [debitLedgerId, setDebitLedgerId] = useState(ledgers[0]?.id || "");
  const [creditLedgerId, setCreditLedgerId] = useState(ledgers[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [dateBS, setDateBS] = useState("2083-05-08");

  const meta = VOUCHER_METADATA[voucherType];
  const Icon = meta.icon;

  const refreshData = () => {
    setVouchers(getVoucherEntries(voucherType));
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!narration.trim()) return;

    const debitLedger = ledgers.find((l) => l.id === debitLedgerId);
    const creditLedger = ledgers.find((l) => l.id === creditLedgerId);
    if (!debitLedger || !creditLedger) return;

    const newVoucher = createVoucher({
      voucherType,
      dateBS,
      dateAD: new Date().toISOString().slice(0, 10),
      debitLedgerId,
      debitLedgerName: debitLedger.name,
      creditLedgerId,
      creditLedgerName: creditLedger.name,
      amountNpr: parsedAmount,
      narration: narration.trim(),
      paymentChannel,
      referenceNo: referenceNo.trim() || undefined,
      preparedByName: userName,
    });

    setNotification(`Voucher ${newVoucher.voucherNo} recorded successfully.`);
    setIsModalOpen(false);
    setAmount("");
    setNarration("");
    setReferenceNo("");
    refreshData();
  };

  const filtered = vouchers.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = v.voucherNo.toLowerCase().includes(q);
      const matchDebit = v.debitLedgerName.toLowerCase().includes(q);
      const matchCredit = v.creditLedgerName.toLowerCase().includes(q);
      const matchNarr = v.narration.toLowerCase().includes(q);
      if (!matchNo && !matchDebit && !matchCredit && !matchNarr) return false;
    }
    return true;
  });

  const totalVoucherSum = filtered.reduce((sum, v) => sum + v.amountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="cursor-pointer text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">{meta.title}</h3>
            <p className="text-[12.5px] text-text-muted">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Register
          </GhostButton>
          <PrimaryButton onClick={() => setIsModalOpen(true)} className="py-2 text-[12.5px]">
            <PlusCircle size={14} /> New {voucherType.replace(/_/g, " ")}
          </PrimaryButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher #, account, or narration..."
            className="pl-8 text-[12.5px]"
          />
        </div>

        <div className="font-data text-[13px] font-semibold text-text">
          Total: <span className="text-accent">{fmtRs(totalVoucherSum)}</span> ({filtered.length} Vouchers)
        </div>
      </div>

      {/* Vouchers Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">Voucher #</th>
                <th className="p-3">Date (BS)</th>
                <th className="p-3">Debit (Dr) Account</th>
                <th className="p-3">Credit (Cr) Account</th>
                <th className="p-3">Narration & Ref</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-text-muted">
                    No {voucherType.toLowerCase()} vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{v.voucherNo}</td>
                    <td className="p-3 font-data whitespace-nowrap text-text-muted">{v.dateBS}</td>
                    <td className="p-3 font-medium text-text">{v.debitLedgerName}</td>
                    <td className="p-3 font-medium text-text">{v.creditLedgerName}</td>
                    <td className="p-3">
                      <div className="text-text">{v.narration}</div>
                      {v.referenceNo && (
                        <span className="font-data text-[11px] text-text-muted">Ref: {v.referenceNo}</span>
                      )}
                    </td>
                    <td className="p-3 font-data text-right font-bold text-[13.5px] text-accent whitespace-nowrap">
                      {fmtRs(v.amountNpr)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <GhostButton
                        onClick={() => setSelectedVoucher(v)}
                        className="py-1 px-2.5 text-[11.5px]"
                      >
                        <Eye size={13} /> View Slip
                      </GhostButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <PlusCircle size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">
                  Record New {voucherType.replace(/_/g, " ")} Voucher
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="mt-4 space-y-3.5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date (BS) *" htmlFor="vDateBS">
                  <Input
                    id="vDateBS"
                    value={dateBS}
                    onChange={(e) => setDateBS(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Payment Channel" htmlFor="vChan">
                  <Select
                    id="vChan"
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value as PaymentChannel)}
                  >
                    <option value="CASH">Cash Counter</option>
                    <option value="BANK_TRANSFER">Bank Transfer / RTGS</option>
                    <option value="FONEPAY_QR">Fonepay / QR Code</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </Select>
                </Field>
              </div>

              <Field label="Debit (Dr) Ledger *" htmlFor="vDebit">
                <Select
                  id="vDebit"
                  value={debitLedgerId}
                  onChange={(e) => setDebitLedgerId(e.target.value)}
                >
                  {ledgers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name} ({l.category})
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Credit (Cr) Ledger *" htmlFor="vCredit">
                <Select
                  id="vCredit"
                  value={creditLedgerId}
                  onChange={(e) => setCreditLedgerId(e.target.value)}
                >
                  {ledgers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {l.name} ({l.category})
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (NPR) *" htmlFor="vAmount">
                  <Input
                    id="vAmount"
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 25000"
                    required
                  />
                </Field>

                <Field label="Reference / Cheque No." htmlFor="vRef">
                  <Input
                    id="vRef"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. CHQ-99120"
                  />
                </Field>
              </div>

              <div>
                <label htmlFor="vNarration" className="mb-1 block text-[12.5px] font-medium text-text-muted">
                  Narration / Purpose <span className="text-error">*</span>
                </label>
                <textarea
                  id="vNarration"
                  rows={2}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="Explain transaction details..."
                  className="w-full rounded-lg border border-border bg-bg p-2.5 font-data text-[13px] text-text"
                  required
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Post Double-Entry Voucher
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Slip Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            {/* Voucher Header */}
            <div className="border-b border-border pb-4 text-center">
              <h3 className="font-display text-[18px] font-bold text-text">Shree Petroleum</h3>
              <div className="text-[11.5px] text-text-muted">Kathmandu, Nepal · PAN/VAT: 601928374</div>
              <div className="mt-2 font-display text-[13.5px] font-semibold text-accent uppercase tracking-wider">
                {selectedVoucher.voucherType.replace(/_/g, " ")} VOUCHER — {selectedVoucher.voucherNo}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-border py-3 text-[12px]">
              <div>
                <span className="text-text-muted">Date (BS):</span>
                <div className="font-bold text-text">{selectedVoucher.dateBS}</div>
              </div>
              <div>
                <span className="text-text-muted">Prepared By:</span>
                <div className="font-bold text-text">{selectedVoucher.preparedByName}</div>
              </div>
            </div>

            {/* Double Entry Table */}
            <div className="py-3 text-[12.5px] space-y-2">
              <div className="flex justify-between items-center bg-bg p-2.5 rounded-lg">
                <div>
                  <span className="text-[11px] text-text-muted block">Debit (Dr):</span>
                  <strong className="text-text">{selectedVoucher.debitLedgerName}</strong>
                </div>
                <span className="font-data font-bold text-accent">{fmtRs(selectedVoucher.amountNpr)}</span>
              </div>

              <div className="flex justify-between items-center bg-bg p-2.5 rounded-lg">
                <div>
                  <span className="text-[11px] text-text-muted block">Credit (Cr):</span>
                  <strong className="text-text">{selectedVoucher.creditLedgerName}</strong>
                </div>
                <span className="font-data font-bold text-text">{fmtRs(selectedVoucher.amountNpr)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-3 text-[12.5px]">
              <span className="text-[11px] text-text-muted block">Narration:</span>
              <p className="mt-0.5 text-text italic">"{selectedVoucher.narration}"</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px] text-text-muted border-t border-border mt-4">
              <div className="border-t border-dashed border-border pt-1">Prepared / Cashier</div>
              <div className="border-t border-dashed border-border pt-1">Authorized Manager / Owner</div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
              <GhostButton onClick={() => setSelectedVoucher(null)}>Close</GhostButton>
              <GhostButton onClick={handlePrint} className="text-[12.5px]">
                <Printer size={14} /> Print Voucher Slip
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
