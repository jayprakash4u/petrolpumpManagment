"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CreditCard, Search, Copy, Download, FileSpreadsheet, Printer, Plus, CheckCircle2 } from "lucide-react";
import type { CreditCustomerDirectoryRow } from "@/lib/queries/customers";
import { fmtRs, toNum } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

/**
 * The credit accounts directory — every Customer with a credit line above
 * zero, its balance and headroom pulled straight from `Customer.dueAmount`
 * / `creditLimit` (see `getCreditCustomerDirectory`). This is the list
 * view; clicking a name opens the full ledger and payment workstation at
 * `/credit`, which already handles any customer regardless of this list's
 * filter.
 */
export function CreditCustomersView({ rows }: { rows: CreditCustomerDirectoryRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => [c.name, c.panNo, c.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, searchQuery]);

  const totalLimit = useMemo(() => filtered.reduce((sum, c) => sum + toNum(c.creditLimit), 0), [filtered]);
  const totalOutstanding = useMemo(() => filtered.reduce((sum, c) => sum + toNum(c.dueAmount), 0), [filtered]);

  const handleCopy = () => {
    const headers = ["SN", "Customer Name", "PAN", "Phone", "Credit Limit", "Due Amount", "Headroom Left", "Status"];
    const rowsOut = filtered.map((c, i) => [
      i + 1,
      c.name,
      c.panNo ?? "",
      c.phone ?? "",
      toNum(c.creditLimit).toFixed(2),
      toNum(c.dueAmount).toFixed(2),
      toNum(c.headroom).toFixed(2),
      !c.active ? "Closed" : c.overExtended ? "At Limit" : "Active",
    ]);
    navigator.clipboard
      .writeText([headers.join("\t"), ...rowsOut.map((r) => r.join("\t"))].join("\n"))
      .then(() => showToast("Copied credit accounts to clipboard!"));
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Customer Name", "PAN", "Phone", "Credit Limit (NPR)", "Due Amount (NPR)", "Headroom Left (NPR)", "Status"];
    const rowsOut = filtered.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      c.panNo ?? "",
      c.phone ?? "",
      toNum(c.creditLimit).toFixed(2),
      toNum(c.dueAmount).toFixed(2),
      toNum(c.headroom).toFixed(2),
      !c.active ? "Closed" : c.overExtended ? "At Limit" : "Active",
    ]);
    const csv = ["Credit Customers", "", headers.join(","), ...rowsOut.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "credit_customers.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded credit customers CSV!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <CreditCard size={20} className="text-accent" />
            <span>Credit Customers</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Accounts with a credit line — limit, outstanding balance, and headroom left to borrow.
          </p>
        </div>

        <Link href="/customers/new">
          <PrimaryButton type="button" className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs">
            <Plus size={14} />
            <span>Add Customer</span>
          </PrimaryButton>
        </Link>
      </div>

      {toastMessage && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <GhostButton type="button" onClick={handleCopy} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <Copy size={13} />
              <span>Copy</span>
            </GhostButton>
            <GhostButton type="button" onClick={handleDownloadCSV} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <FileSpreadsheet size={13} />
              <span>CSV</span>
            </GhostButton>
            <GhostButton type="button" onClick={handleDownloadCSV} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <Download size={13} />
              <span>Excel</span>
            </GhostButton>
            <GhostButton type="button" onClick={() => window.print()} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <Printer size={13} />
              <span>Print</span>
            </GhostButton>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search credit customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-muted">
            {rows.length === 0 ? "No credit customers yet — add one and set a credit limit above zero." : "No customers match that search."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[800px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Customer / Party Name</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-24 font-medium">PAN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-28 font-medium">Phone</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Credit Limit</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Due Amount</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Headroom Left</th>
                  <th className="px-3 py-2.5 text-center w-24 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[11.5px]">
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{i + 1}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-bold text-text">
                      <Link href={`/credit?customer=${c.id}`} className="hover:underline text-text hover:text-accent">
                        {c.name}
                      </Link>
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text-muted">{c.panNo || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text">{c.phone || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text-muted">{fmtRs(c.creditLimit)}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent">{fmtRs(c.dueAmount)}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-semibold text-success">{fmtRs(c.headroom)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {!c.active ? (
                        <Badge tone="muted">CLOSED</Badge>
                      ) : c.overExtended ? (
                        <Badge tone="error">AT LIMIT</Badge>
                      ) : (
                        <Badge tone="success">ACTIVE</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td colSpan={4} className="border-r border-border/60 px-3 py-2.5 font-sans font-bold text-right">TOTALS</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text-muted">{fmtRs(totalLimit)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-accent">{fmtRs(totalOutstanding)}</td>
                  <td colSpan={2} className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
