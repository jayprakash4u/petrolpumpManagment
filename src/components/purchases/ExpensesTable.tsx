"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Download, Printer, CalendarRange, Search, RotateCcw, Trash2 } from "lucide-react";
import type { StationExpense } from "@/lib/purchases";
import { fmtRs } from "@/lib/money";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { fiscalYearOf, fiscalYearRange, parseBSInput, fromBS } from "@/lib/bs-date";
import { toDateInput } from "@/lib/reports";

const STORAGE_KEY = "fsm_expenses";

function recentFiscalYears(count = 5): { label: string; startYear: number }[] {
  const currentFY = fiscalYearOf(new Date());
  const startYear = currentFY ? parseInt(currentFY.split("/")[0], 10) : new Date().getFullYear() - 57;
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i;
    return { label: `${y}/${String((y + 1) % 100).padStart(2, "0")}`, startYear: y };
  });
}

function saveList(updated: StationExpense[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/** Real Gregorian date, derived from the BS string the operator typed — not stored separately, so it can never drift out of sync. */
function englishDate(dateBS: string): string {
  const bs = parseBSInput(dateBS);
  const d = bs ? fromBS(bs) : null;
  return d ? d.toISOString().slice(0, 10) : "—";
}

export function ExpensesTable({ expenses }: { expenses: StationExpense[] }) {
  // Read once, synchronously, as the initial value, so a voucher just added
  // on the full-page form is there on the very first render.
  const [list, setList] = useState<StationExpense[]>(() => {
    if (typeof window === "undefined") return expenses;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return expenses;
  });

  const fiscalYears = useMemo(() => recentFiscalYears(), []);
  const currentFYRange = useMemo(() => {
    const fy = fiscalYears[0];
    return fy ? fiscalYearRange(fy.startYear) : null;
  }, [fiscalYears]);

  const [fiscalYear, setFiscalYear] = useState(String(fiscalYears[0]?.startYear ?? ""));
  const [fromDate, setFromDate] = useState(currentFYRange ? toDateInput(currentFYRange.from) : "");
  const [toDate, setToDate] = useState(currentFYRange ? toDateInput(currentFYRange.to) : "");
  const [appliedFrom, setAppliedFrom] = useState(fromDate);
  const [appliedTo, setAppliedTo] = useState(toDate);
  const [search, setSearch] = useState("");

  const handleFiscalYearChange = (value: string) => {
    setFiscalYear(value);
    const fy = fiscalYears.find((f) => String(f.startYear) === value);
    if (!fy) return;
    const range = fiscalYearRange(fy.startYear);
    if (!range) return;
    setFromDate(toDateInput(range.from));
    setToDate(toDateInput(range.to));
    setAppliedFrom(toDateInput(range.from));
    setAppliedTo(toDateInput(range.to));
  };

  const handleFilter = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const filtered = list.filter((e) => {
    const iso = englishDate(e.dateBS);
    if (appliedFrom && iso !== "—" && iso < appliedFrom) return false;
    if (appliedTo && iso !== "—" && iso > appliedTo) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [e.voucherNo, e.invoiceNo, e.recipientName, e.supplierPan, e.category].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleReturn = (id: string) => {
    if (!confirm("Mark this expense as returned/reversed?")) return;
    const updated = list.map((e) => (e.id === id ? { ...e, returned: true } : e));
    setList(updated);
    saveList(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this expense purchase? This cannot be undone.")) return;
    const updated = list.filter((e) => e.id !== id);
    setList(updated);
    saveList(updated);
  };

  const handleExportCSV = () => {
    const headers = [
      "Purchase ID",
      "Purchase Date (Nepali)",
      "Purchase Date (English)",
      "Bill Number",
      "Supplier Name",
      "Supplier VAT Number",
      "Subtotal Purchase Price",
      "Taxable Amount",
      "Non-Taxable Amount",
      "Discount Amount",
      "Tax Amount",
      "Total Purchase Price",
    ];
    const rows = filtered.map((e) => [
      e.voucherNo,
      e.dateBS,
      englishDate(e.dateBS),
      e.invoiceNo ?? "",
      e.recipientName || "",
      e.supplierPan ?? "",
      ((e.taxableAmount ?? 0) + (e.nonTaxableAmount ?? 0)).toFixed(2),
      (e.taxableAmount ?? 0).toFixed(2),
      (e.nonTaxableAmount ?? 0).toFixed(2),
      (e.discountAmount ?? 0).toFixed(2),
      (e.vatAmount ?? 0).toFixed(2),
      (e.grandTotal ?? e.amountNpr).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filter Toolbar */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-bg p-3">
        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">Fiscal Year</label>
          <select
            value={fiscalYear}
            onChange={(e) => handleFiscalYearChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] text-text"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.startYear} value={fy.startYear}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            <CalendarRange size={11} /> From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] text-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] text-text"
          />
        </div>

        <div className="min-w-45 flex-1">
          <label className="mb-1 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            <Search size={11} /> Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bill number, supplier, PAN"
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] text-text"
          />
        </div>

        <PrimaryButton type="button" onClick={handleFilter} className="px-4 py-1.75 text-[12px]">
          Filter
        </PrimaryButton>

        <div className="ml-auto flex gap-2">
          <GhostButton type="button" onClick={() => window.print()} className="gap-1.5 text-xs">
            <Printer size={14} />
            Print
          </GhostButton>
          <GhostButton type="button" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download size={14} />
            Export CSV
          </GhostButton>
          <Link href="/purchases/expenses/new">
            <PrimaryButton type="button" className="gap-1.5 text-xs">
              <Plus size={15} />
              Add Expense
            </PrimaryButton>
          </Link>
        </div>
      </div>

      {/* Register Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-295 border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-hi font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">S.N.</th>
              <th className="px-3 py-2.5 font-medium">PURCHASE ID</th>
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">DATE (AD)</th>
              <th className="px-3 py-2.5 font-medium">BILL NUMBER</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER NAME</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER VAT NO.</th>
              <th className="px-3 py-2.5 text-right font-medium">SUBTOTAL (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TAXABLE (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">NON-TAXABLE (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">DISCOUNT (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TAX (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL (RS)</th>
              <th className="px-3 py-2.5 font-medium">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-10 text-center text-xs text-text-muted">
                  No expenses recorded in this range.
                </td>
              </tr>
            ) : (
              filtered.map((e, idx) => {
                const subTotal = (e.taxableAmount ?? 0) + (e.nonTaxableAmount ?? 0);
                return (
                  <tr key={e.id} className={`border-b border-border/60 transition-colors hover:bg-surface-hi/40 ${e.returned ? "opacity-60" : ""}`}>
                    <td className="px-3 py-3 text-[12px] text-text-muted">{idx + 1}</td>
                    <td className="px-3 py-3 font-data text-xs font-semibold text-accent">
                      {e.voucherNo}
                      {e.returned && <div className="text-[10px] font-bold text-error">RETURNED</div>}
                    </td>
                    <td className="px-3 py-3 font-data text-[12.5px] text-text">{e.dateBS}</td>
                    <td className="px-3 py-3 font-data text-[11.5px] text-text-muted">{englishDate(e.dateBS)}</td>
                    <td className="px-3 py-3 font-data text-xs text-text">{e.invoiceNo || "—"}</td>
                    <td className="px-3 py-3 text-[13px] text-text">{e.recipientName || "—"}</td>
                    <td className="px-3 py-3 font-data text-[12px] text-text-muted">{e.supplierPan || "—"}</td>
                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(subTotal)}</td>
                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(e.taxableAmount ?? 0)}</td>
                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">{fmtRs(e.nonTaxableAmount ?? 0)}</td>
                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">{fmtRs(e.discountAmount ?? 0)}</td>
                    <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(e.vatAmount ?? 0)}</td>
                    <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">{fmtRs(e.grandTotal ?? e.amountNpr)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {!e.returned && (
                          <button
                            type="button"
                            onClick={() => handleReturn(e.id)}
                            className="flex items-center gap-1 text-[11.5px] font-semibold text-error hover:underline"
                          >
                            <RotateCcw size={12} /> Return
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          className="flex items-center gap-1 text-[11.5px] font-semibold text-text-muted hover:text-error hover:underline"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
