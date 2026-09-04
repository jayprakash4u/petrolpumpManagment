"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Plus,
  Receipt,
} from "lucide-react";
import type { NonCreditCustomerRow } from "@/lib/queries/customers";
import { fmtRs, toNum } from "@/lib/money";
import { fmtBS } from "@/lib/bs-date";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

/**
 * Cash / prepaid / QR-paying accounts — Customer rows with a zero credit
 * limit, kept around for name, PAN, and bill-history lookups even though
 * they're never billed on credit. Rows and their bill/spend totals come
 * from the real Sale ledger (see `getNonCreditCustomers`), not a mock list,
 * so this always matches what the Credit page's ledger would show for the
 * same account.
 */
export function NonCreditCustomersView({ rows }: { rows: NonCreditCustomerRow[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) =>
      [c.name, c.phone, c.panNo, c.address, c.email].some((v) => v?.toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  const totalBillsSum = useMemo(() => filtered.reduce((sum, c) => sum + c.billCount, 0), [filtered]);
  const totalSpendSum = useMemo(() => filtered.reduce((sum, c) => sum + toNum(c.totalSpend), 0), [filtered]);

  const handleCopy = () => {
    const headers = ["SN", "Customer Name", "Phone", "PAN", "Address", "Bills", "Total Spend", "Last Visit", "Status"];
    const rowsOut = filtered.map((c, i) => [
      i + 1,
      c.name,
      c.phone ?? "",
      c.panNo ?? "",
      c.address ?? "",
      c.billCount,
      toNum(c.totalSpend).toFixed(2),
      c.lastVisit ? fmtBS(c.lastVisit) : "",
      c.active ? "Active" : "Closed",
    ]);
    navigator.clipboard
      .writeText([headers.join("\t"), ...rowsOut.map((r) => r.join("\t"))].join("\n"))
      .then(() => showToast("Copied non-credit customer list to clipboard!"));
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Customer Name", "Phone", "PAN", "Address", "Bills", "Total Spend (NPR)", "Last Visit", "Status"];
    const rowsOut = filtered.map((c, i) => [
      i + 1,
      `"${c.name}"`,
      c.phone ?? "",
      c.panNo ?? "",
      `"${c.address ?? ""}"`,
      c.billCount,
      toNum(c.totalSpend).toFixed(2),
      c.lastVisit ? fmtBS(c.lastVisit) : "",
      c.active ? "Active" : "Closed",
    ]);
    const csv = ["Non Credit Customers", "", headers.join(","), ...rowsOut.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "non_credit_customers.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded non-credit customers CSV!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Users size={20} className="text-accent" />
            <span>Non-Credit Customers</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Cash and prepaid retail accounts kept for records and bill history — no credit line extended.
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
              placeholder="Search non-credit customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-muted">
            {rows.length === 0
              ? "No non-credit customers yet — add one, or leave a new customer's credit limit at 0."
              : "No customers match that search."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Customer Name</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-28 font-medium">Phone</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-24 font-medium">PAN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Address</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-16 font-medium">Bills</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Total Spend</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-24 font-medium">Last Visit</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-20 font-medium">Status</th>
                  <th className="px-3 py-2.5 w-28 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[11.5px]">
                {filtered.map((c, i) => (
                  <tr key={c.id} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{i + 1}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-semibold text-text">{c.name}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text">{c.phone || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text-muted">{c.panNo || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-text-muted truncate max-w-xs">{c.address || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-semibold text-text">{c.billCount}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent">{fmtRs(c.totalSpend)}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-mono text-text">
                      {c.lastVisit ? fmtBS(c.lastVisit) : "—"}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-center">
                      <Badge tone={c.active ? "success" : "muted"}>{c.active ? "Active" : "Closed"}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/credit?customer=${c.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                      >
                        <Receipt size={12} />
                        View Ledger
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td colSpan={5} className="border-r border-border/60 px-3 py-2.5 font-sans font-bold text-right">
                    TOTAL
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">{totalBillsSum}</td>
                  <td colSpan={4} className="px-3 py-2.5 text-right font-bold text-accent">
                    {fmtRs(totalSpendSum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
