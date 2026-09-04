"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Coins, Search, Copy, Download, FileSpreadsheet, Printer, CheckCircle2, Receipt } from "lucide-react";
import type { PartyAboveThresholdRow } from "@/lib/queries/customers";
import { fmtRs, toNum } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";

const THRESHOLD_NPR = 500000;

/**
 * The high-exposure tier of the same report as Parties Above 1 Lakh — just a
 * higher cut of the identical live Sale aggregation (see
 * `getPartiesAboveThreshold`), for the handful of accounts worth watching
 * more closely.
 */
export function PartiesAbove5View({
  rows,
  fiscalYears,
  selectedStartYear,
  fiscalYearLabel,
}: {
  rows: PartyAboveThresholdRow[];
  fiscalYears: { label: string; startYear: number }[];
  selectedStartYear: number;
  fiscalYearLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startNav] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFiscalYearChange = (value: string) => {
    startNav(() => router.push(`${pathname}?fy=${value}`));
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) =>
      [p.name, p.panNo, p.phone, p.address].some((v) => v?.toLowerCase().includes(q))
    );
  }, [rows, searchQuery]);

  const totalPurchaseSum = useMemo(() => filtered.reduce((sum, p) => sum + toNum(p.totalPurchase), 0), [filtered]);

  const handleCopy = () => {
    const headers = ["SN", "Full Name", "PAN", "Address", "Phone No", "Total Purchase (NPR)", "Status"];
    const rowsOut = filtered.map((p, i) => [
      i + 1,
      p.name,
      p.panNo ?? "",
      p.address ?? "",
      p.phone ?? "",
      toNum(p.totalPurchase).toFixed(2),
      p.active ? "Active" : "Closed",
    ]);
    navigator.clipboard
      .writeText([headers.join("\t"), ...rowsOut.map((r) => r.join("\t"))].join("\n"))
      .then(() => showToast("Copied party list to clipboard!"));
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Full Name", "PAN", "Address", "Phone No", "Total Purchase (NPR)", "Status"];
    const rowsOut = filtered.map((p, i) => [
      i + 1,
      `"${p.name}"`,
      p.panNo ?? "",
      `"${p.address ?? ""}"`,
      p.phone ?? "",
      toNum(p.totalPurchase).toFixed(2),
      p.active ? "Active" : "Closed",
    ]);
    const csv = [
      `Customers with transactions above NPR ${THRESHOLD_NPR.toLocaleString("en-IN")} — FY ${fiscalYearLabel}`,
      "",
      headers.join(","),
      ...rowsOut.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `parties_above_5_lakh_${fiscalYearLabel.replace("/", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded party list CSV!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Coins size={20} className="text-accent" />
            <span>Customers with Transactions Above {fmtRs(THRESHOLD_NPR)}</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Billed volume for FY {fiscalYearLabel}, cash and credit combined — the station&apos;s highest-value accounts.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            Fiscal Year
          </label>
          <select
            value={selectedStartYear}
            onChange={(e) => handleFiscalYearChange(e.target.value)}
            className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent focus:outline-hidden"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.startYear} value={fy.startYear}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>
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
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-muted">
            {rows.length === 0
              ? `No customer cleared ${fmtRs(THRESHOLD_NPR)} in billed volume for FY ${fiscalYearLabel}.`
              : "No parties match that search."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Full Name</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-24 font-medium">PAN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Address</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-28 font-medium">Phone No</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-36 font-medium">Total Purchase</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-20 font-medium">Status</th>
                  <th className="px-3 py-2.5 w-28 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[11.5px]">
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{i + 1}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-bold text-text">{p.name}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text-muted">{p.panNo || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-text-muted truncate max-w-xs">{p.address || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text">{p.phone || "—"}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-black text-accent">
                      {fmtRs(p.totalPurchase)}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-center">
                      <Badge tone={p.active ? "success" : "muted"}>{p.active ? "Active" : "Closed"}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/credit?customer=${p.id}`}
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
                  <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-accent">
                    {fmtRs(totalPurchaseSum)}
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
