"use client";

import { useState } from "react";
import {
  PiggyBank,
  CheckCircle2,
  Edit2,
  Scale,
  RotateCcw,
  Building2,
} from "lucide-react";
import { type LedgerHead } from "@/lib/accounts";
import { getLedgerHeads, updateOpeningBalance } from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function OpeningBalancesView() {
  const [ledgers, setLedgers] = useState<LedgerHead[]>(() => getLedgerHeads());
  const [editingLedger, setEditingLedger] = useState<LedgerHead | null>(null);
  const [newOpeningNpr, setNewOpeningNpr] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const refreshData = () => {
    setLedgers(getLedgerHeads());
  };

  const totalDebitOpening = ledgers
    .filter((l) => l.balanceType === "DEBIT")
    .reduce((sum, l) => sum + l.openingBalanceNpr, 0);

  const totalCreditOpening = ledgers
    .filter((l) => l.balanceType === "CREDIT")
    .reduce((sum, l) => sum + l.openingBalanceNpr, 0);

  const isBalanced = Math.abs(totalDebitOpening - totalCreditOpening) < 1;

  const handleOpenEdit = (l: LedgerHead) => {
    setEditingLedger(l);
    setNewOpeningNpr(String(l.openingBalanceNpr));
  };

  const handleSave = () => {
    if (!editingLedger) return;
    const res = updateOpeningBalance(editingLedger.id, parseFloat(newOpeningNpr) || 0);
    if (res.success) {
      setNotification(res.message);
      setEditingLedger(null);
      refreshData();
    }
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
            <PiggyBank size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Opening Balances Configuration</h3>
            <p className="text-[12.5px] text-text-muted">
              Configure initial opening balances for cash vaults, bank accounts, liabilities, and equity when onboarding mid-fiscal year.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone={isBalanced ? "success" : "error"}>
            {isBalanced ? "Opening Balances in Parity" : "Out of Balance (Diff > 0)"}
          </Badge>
        </div>
      </div>

      {/* Parity Status Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-border bg-surface p-4 text-[13px]">
        <div className="flex justify-between items-center rounded-xl bg-bg p-3">
          <span className="text-text-muted">Total Debit Opening Balances (Assets/Expenses):</span>
          <span className="font-data font-bold text-accent">{fmtRs(totalDebitOpening)}</span>
        </div>
        <div className="flex justify-between items-center rounded-xl bg-bg p-3">
          <span className="text-text-muted">Total Credit Opening Balances (Liabilities/Equity):</span>
          <span className="font-data font-bold text-text">{fmtRs(totalCreditOpening)}</span>
        </div>
      </div>

      {/* Ledgers Opening Balance Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3 w-20">Code</th>
                <th className="p-3">Ledger Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Balance Nature</th>
                <th className="p-3 text-right">Opening Balance (NPR)</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledgers.map((l) => (
                <tr key={l.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-data font-bold text-accent">{l.code}</td>
                  <td className="p-3 font-semibold text-text">{l.name}</td>
                  <td className="p-3 font-data text-text-muted">{l.category}</td>
                  <td className="p-3 font-data">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        l.balanceType === "DEBIT" ? "bg-accent/15 text-accent" : "bg-surface-hi text-text"
                      }`}
                    >
                      {l.balanceType} (Dr/Cr)
                    </span>
                  </td>
                  <td className="p-3 font-data text-right font-bold text-text text-[13.5px]">
                    {fmtRs(l.openingBalanceNpr)}
                  </td>
                  <td className="p-3 text-right">
                    <GhostButton
                      onClick={() => handleOpenEdit(l)}
                      className="py-1 px-2.5 text-[11.5px]"
                    >
                      <Edit2 size={13} /> Edit
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Modal */}
      {editingLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <Edit2 size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Edit Opening Balance</h3>
              </div>
              <button onClick={() => setEditingLedger(null)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-[13px]">
              <div className="rounded-xl border border-border bg-bg p-3">
                <div className="font-semibold text-text">{editingLedger.name}</div>
                <div className="text-[11.5px] text-text-muted font-data">
                  Code: {editingLedger.code} · Category: {editingLedger.category} ({editingLedger.balanceType})
                </div>
              </div>

              <Field label="Opening Balance (NPR) *" htmlFor="openNpr">
                <Input
                  id="openNpr"
                  type="number"
                  value={newOpeningNpr}
                  onChange={(e) => setNewOpeningNpr(e.target.value)}
                  required
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton onClick={() => setEditingLedger(null)}>Cancel</GhostButton>
                <PrimaryButton onClick={handleSave} className="py-2 text-[13px]">
                  Save Opening Balance
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
