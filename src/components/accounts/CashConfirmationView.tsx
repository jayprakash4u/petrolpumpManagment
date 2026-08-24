"use client";

import { useState } from "react";
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Building2,
  FileCheck2,
  TrendingDown,
} from "lucide-react";
import { type CashConfirmationRecord } from "@/lib/accounts";
import { getCashConfirmations, confirmDayCash } from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

export function CashConfirmationView({
  userName = "Station Manager",
}: {
  userName?: string;
}) {
  const [confirmations, setConfirmations] = useState<CashConfirmationRecord[]>(() => getCashConfirmations());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal form states
  const [dateBS, setDateBS] = useState("2083-05-08");
  const [expectedCash, setExpectedCash] = useState("350000");
  const [physicalCash, setPhysicalCash] = useState("350000");
  const [bankDeposited, setBankDeposited] = useState("300000");
  const [bankName, setBankName] = useState("Nabil Bank Ltd");
  const [depositSlipRef, setDepositSlipRef] = useState("");
  const [notes, setNotes] = useState("");

  const refreshData = () => {
    setConfirmations(getCashConfirmations());
  };

  const calculatedVariance = (parseFloat(physicalCash) || 0) - (parseFloat(expectedCash) || 0);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const exp = parseFloat(expectedCash) || 0;
    const phys = parseFloat(physicalCash) || 0;
    const dep = parseFloat(bankDeposited) || 0;
    const variance = phys - exp;

    confirmDayCash({
      dateBS,
      expectedCashNpr: exp,
      physicalCashCountedNpr: phys,
      varianceNpr: variance,
      bankDepositedNpr: dep,
      depositedBankName: bankName,
      depositSlipRef: depositSlipRef.trim() || undefined,
      confirmedByName: userName,
      status: Math.abs(variance) > 100 ? "FLAGGED_VARIANCE" : "SETTLED",
      notes: notes.trim() || undefined,
    });

    setNotification(`Day-end cash confirmation recorded for ${dateBS}.`);
    setIsModalOpen(false);
    setDepositSlipRef("");
    setNotes("");
    refreshData();
  };

  const totalBanked = confirmations.reduce((sum, c) => sum + c.bankDepositedNpr, 0);

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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Cash Banked" value={fmtRs(totalBanked)} icon={Building2} tone="accent" small />
        <StatCard label="Reconciliation Status" value="Settled" icon={FileCheck2} tone="success" />
        <StatCard label="Settled Confirmations" value={String(confirmations.length)} icon={Coins} tone="text" />
        <StatCard label="Safe Retention Buffer" value="Rs 50,000" icon={Coins} tone="text" />
      </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Coins size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Day-End Cash & Bank Deposit Confirmation</h3>
            <p className="text-[12.5px] text-text-muted">
              Verify daily cash drawer totals against system expected sales, identify shortages/excess, and record bank drops.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setIsModalOpen(true)} className="py-2 text-[12.5px]">
          <PlusCircle size={14} /> New Cash Confirmation
        </PrimaryButton>
      </div>

      {/* Confirmation Register */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">Date (BS)</th>
                <th className="p-3">System Expected Cash</th>
                <th className="p-3">Physical Cash Counted</th>
                <th className="p-3">Variance</th>
                <th className="p-3">Bank Deposited</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confirmed By & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {confirmations.map((conf) => (
                <tr key={conf.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{conf.dateBS}</td>
                  <td className="p-3 font-data font-medium text-text">{fmtRs(conf.expectedCashNpr)}</td>
                  <td className="p-3 font-data font-semibold text-text">{fmtRs(conf.physicalCashCountedNpr)}</td>
                  <td className="p-3 font-data font-bold">
                    {conf.varianceNpr === 0 ? (
                      <span className="text-success">Exact Match (Rs 0)</span>
                    ) : conf.varianceNpr > 0 ? (
                      <span className="text-success">+{fmtRs(conf.varianceNpr)} (Excess)</span>
                    ) : (
                      <span className="text-error">{fmtRs(conf.varianceNpr)} (Shortage)</span>
                    )}
                  </td>
                  <td className="p-3 font-data text-accent font-semibold">
                    {fmtRs(conf.bankDepositedNpr)}
                    {conf.depositedBankName && (
                      <div className="font-normal text-[11px] text-text-muted">
                        {conf.depositedBankName} · {conf.depositSlipRef || "No slip ref"}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge tone={conf.status === "SETTLED" ? "success" : "error"}>
                      {conf.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-text">{conf.confirmedByName}</div>
                    {conf.notes && <div className="text-[11px] text-text-muted italic">{conf.notes}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Coins size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Record Day-End Cash Confirmation</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirm} className="mt-4 space-y-3.5 text-[13px]">
              <Field label="Date (BS) *" htmlFor="confDate">
                <Input
                  id="confDate"
                  value={dateBS}
                  onChange={(e) => setDateBS(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="System Expected Cash (NPR) *" htmlFor="expCash">
                  <Input
                    id="expCash"
                    type="number"
                    value={expectedCash}
                    onChange={(e) => setExpectedCash(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Physical Cash Counted (NPR) *" htmlFor="physCash">
                  <Input
                    id="physCash"
                    type="number"
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(e.target.value)}
                    required
                  />
                </Field>
              </div>

              {/* Real-time Variance Badge */}
              <div className="rounded-xl border border-border bg-bg p-3 flex items-center justify-between text-[12.5px]">
                <span className="text-text-muted">Calculated Variance:</span>
                <span
                  className={`font-data font-bold ${
                    calculatedVariance === 0
                      ? "text-success"
                      : calculatedVariance > 0
                      ? "text-success"
                      : "text-error"
                  }`}
                >
                  {calculatedVariance === 0
                    ? "Rs 0 (Balanced)"
                    : `${calculatedVariance > 0 ? "+" : ""}${fmtRs(calculatedVariance)} ${
                        calculatedVariance > 0 ? "(Excess)" : "(Shortage)"
                      }`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Bank Deposit Amount (NPR)" htmlFor="bankDep">
                  <Input
                    id="bankDep"
                    type="number"
                    value={bankDeposited}
                    onChange={(e) => setBankDeposited(e.target.value)}
                  />
                </Field>

                <Field label="Bank Name" htmlFor="bankName">
                  <Select
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="Nabil Bank Ltd">Nabil Bank Ltd</option>
                    <option value="Global IME Bank">Global IME Bank</option>
                    <option value="NIC Asia Bank">NIC Asia Bank</option>
                    <option value="Rastriya Banijya Bank">Rastriya Banijya Bank</option>
                  </Select>
                </Field>
              </div>

              <Field label="Bank Deposit Slip Ref #" htmlFor="depSlip">
                <Input
                  id="depSlip"
                  value={depositSlipRef}
                  onChange={(e) => setDepositSlipRef(e.target.value)}
                  placeholder="e.g. NABIL-SLIP-99012"
                />
              </Field>

              <Field label="Remarks / Settlement Notes" htmlFor="confNotes">
                <Input
                  id="confNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Rs 50,000 left in vault for morning float."
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Confirm & Settle Cash
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
