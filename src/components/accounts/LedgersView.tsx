"use client";

import { useState } from "react";
import {
  BookOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  TrendingUp,
  CreditCard,
  Building2,
  DollarSign,
} from "lucide-react";
import { type LedgerHead, type LedgerCategory, type BalanceType } from "@/lib/accounts";
import { getLedgerHeads, createLedgerHead } from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const CATEGORIES: LedgerCategory[] = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const CATEGORY_LABEL: Record<LedgerCategory, { label: string; tone: "accent" | "success" | "muted" | "error" }> = {
  ASSET: { label: "Assets (1000s)", tone: "accent" },
  LIABILITY: { label: "Liabilities (2000s)", tone: "error" },
  EQUITY: { label: "Capital & Equity (3000s)", tone: "accent" },
  INCOME: { label: "Revenue & Sales (4000s)", tone: "success" },
  EXPENSE: { label: "Operating Expenses (5000s)", tone: "muted" },
};

export function LedgersView() {
  const [ledgers, setLedgers] = useState<LedgerHead[]>(() => getLedgerHeads());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LedgerCategory | "ALL">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LedgerCategory>("EXPENSE");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [balanceType, setBalanceType] = useState<BalanceType>("DEBIT");
  const [description, setDescription] = useState("");

  const refreshData = () => {
    setLedgers(getLedgerHeads());
  };

  const handleCreateLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = createLedgerHead({
      code: code.trim() || String(Math.floor(1000 + Math.random() * 9000)),
      name: name.trim(),
      category,
      openingBalanceNpr: parseFloat(openingBalance) || 0,
      balanceType,
      description: description.trim() || `General ${category.toLowerCase()} ledger head`,
    });

    setNotification(`Ledger head "${created.name}" created successfully.`);
    setIsCreateModalOpen(false);
    setCode("");
    setName("");
    setDescription("");
    setOpeningBalance("0");
    refreshData();
  };

  const filtered = ledgers.filter((l) => {
    if (selectedCategory !== "ALL" && l.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = l.code.includes(q);
      const matchName = l.name.toLowerCase().includes(q);
      const matchDesc = l.description.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchDesc) return false;
    }
    return true;
  });

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
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Chart of Accounts (Ledger Heads)</h3>
            <p className="text-[12.5px] text-text-muted">
              Master accounts registry covering station cash, banks, liabilities, revenues, and operating expenses.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setIsCreateModalOpen(true)} className="py-2 text-[12.5px]">
          <PlusCircle size={14} /> New Ledger Head
        </PrimaryButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`font-display cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-accent/15 font-semibold text-accent"
                : "border border-border bg-bg text-text-muted hover:text-text"
            }`}
          >
            All Categories ({ledgers.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-display cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-accent/15 font-semibold text-accent"
                  : "border border-border bg-bg text-text-muted hover:text-text"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or account..."
            className="pl-8 text-[12px]"
          />
        </div>
      </div>

      {/* Ledgers Table Grouped by Category */}
      <div className="space-y-4">
        {CATEGORIES.filter((cat) => selectedCategory === "ALL" || selectedCategory === cat).map((cat) => {
          const groupLedgers = filtered.filter((l) => l.category === cat);
          if (groupLedgers.length === 0) return null;

          return (
            <Card key={cat} className="overflow-hidden p-0">
              <div className="border-b border-border bg-surface-hi/60 px-4 py-2.5 flex items-center justify-between">
                <span className="font-display text-[13px] font-semibold text-text uppercase tracking-wider">
                  {CATEGORY_LABEL[cat].label}
                </span>
                <span className="font-data text-[11px] text-text-muted">{groupLedgers.length} Account(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-border bg-bg/50 font-medium text-text-muted">
                    <tr>
                      <th className="p-3 w-20">Code</th>
                      <th className="p-3">Ledger Name & Description</th>
                      <th className="p-3">Opening Balance</th>
                      <th className="p-3 text-right">Current Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupLedgers.map((ledger) => (
                      <tr key={ledger.id} className="hover:bg-surface-hi/30 transition-colors">
                        <td className="p-3 font-data font-bold text-accent">{ledger.code}</td>
                        <td className="p-3">
                          <div className="font-semibold text-text flex items-center gap-1.5">
                            {ledger.name}
                            {ledger.isSystem && (
                              <span title="System master account" className="text-text-muted/60">
                                <Lock size={11} />
                              </span>
                            )}
                          </div>
                          <div className="text-[11.5px] text-text-muted">{ledger.description}</div>
                        </td>
                        <td className="p-3 font-data text-text-muted">
                          {fmtRs(ledger.openingBalanceNpr)} ({ledger.balanceType})
                        </td>
                        <td className="p-3 font-data text-right font-bold text-[13.5px] text-text">
                          {fmtRs(ledger.currentBalanceNpr)}
                          <span className="text-[11px] font-normal text-text-muted ml-1">
                            {ledger.balanceType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>

      {/* New Ledger Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="animate-fade-in w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-accent">
                <PlusCircle size={18} />
                <h3 className="font-display text-[16px] font-bold text-text">Create Ledger Head</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="cursor-pointer text-text-muted hover:text-text">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLedger} className="mt-4 space-y-3.5 text-[13px]">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Account Code" htmlFor="ledCode">
                  <Input
                    id="ledCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. 5050"
                  />
                </Field>

                <Field label="Category *" htmlFor="ledCat">
                  <Select
                    id="ledCat"
                    value={category}
                    onChange={(e) => {
                      const c = e.target.value as LedgerCategory;
                      setCategory(c);
                      setBalanceType(c === "ASSET" || c === "EXPENSE" ? "DEBIT" : "CREDIT");
                    }}
                  >
                    <option value="ASSET">Asset (1000s)</option>
                    <option value="LIABILITY">Liability (2000s)</option>
                    <option value="EQUITY">Equity (3000s)</option>
                    <option value="INCOME">Income / Revenue (4000s)</option>
                    <option value="EXPENSE">Expense (5000s)</option>
                  </Select>
                </Field>
              </div>

              <Field label="Ledger Name *" htmlFor="ledName">
                <Input
                  id="ledName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lubricants Supplier Dues"
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Opening Balance (NPR)" htmlFor="ledOpen">
                  <Input
                    id="ledOpen"
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                  />
                </Field>

                <Field label="Normal Balance" htmlFor="ledBalType">
                  <Select
                    id="ledBalType"
                    value={balanceType}
                    onChange={(e) => setBalanceType(e.target.value as BalanceType)}
                  >
                    <option value="DEBIT">Debit (Dr)</option>
                    <option value="CREDIT">Credit (Cr)</option>
                  </Select>
                </Field>
              </div>

              <Field label="Description" htmlFor="ledDesc">
                <Input
                  id="ledDesc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose of this account head..."
                />
              </Field>

              <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
                <GhostButton type="button" onClick={() => setIsCreateModalOpen(false)}>Cancel</GhostButton>
                <PrimaryButton type="submit" className="py-2 text-[13px]">
                  Save Ledger Head
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
