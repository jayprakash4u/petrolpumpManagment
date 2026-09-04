"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FileBarChart2, Search, Copy, Download, FileSpreadsheet, Printer, CheckCircle2, CalendarRange } from "lucide-react";
import type { CustomerUsageRow } from "@/lib/queries/customers";
import type { DateRange } from "@/lib/reports";
import { toDateInput, parseDateInput } from "@/lib/reports";
import { fmtRs, fmtL, toNum } from "@/lib/money";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";

/**
 * How much fuel each named customer bought in a date range, and what it
 * cost — grouped straight from the Sale ledger (see `getCustomerUsageReport`).
 * Cash and credit both count; this is a consumption view, not a balance one.
 */
export function CustomerUsageReportView({ rows, range }: { rows: CustomerUsageRow[]; range: DateRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startNav] = useTransition();
  const [fromDate, setFromDate] = useState(toDateInput(range.from));
  const [toDate, setToDate] = useState(toDateInput(range.to));
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFilter = () => {
    const from = parseDateInput(fromDate);
    const to = parseDateInput(toDate);
    if (!from || !to) return;
    const qs = new URLSearchParams({ from: toDateInput(from), to: toDateInput(to) });
    startNav(() => router.push(`${pathname}?${qs.toString()}`));
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, searchQuery]);

  const totalPetrol = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.petrolLiters), 0), [filtered]);
  const totalDiesel = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.dieselLiters), 0), [filtered]);
  const totalCng = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.cngLiters), 0), [filtered]);
  const totalVolume = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.totalVolume), 0), [filtered]);
  const totalAmount = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.totalAmount), 0), [filtered]);

  const handleCopy = () => {
    const headers = ["SN", "Customer Name", "Petrol (L)", "Diesel (L)", "CNG (L)", "Total Volume (L)", "Total Amount (NPR)", "Bills"];
    const rowsOut = filtered.map((r, i) => [
      i + 1,
      r.name,
      toNum(r.petrolLiters).toFixed(2),
      toNum(r.dieselLiters).toFixed(2),
      toNum(r.cngLiters).toFixed(2),
      toNum(r.totalVolume).toFixed(2),
      toNum(r.totalAmount).toFixed(2),
      r.billCount,
    ]);
    navigator.clipboard
      .writeText([headers.join("\t"), ...rowsOut.map((r) => r.join("\t"))].join("\n"))
      .then(() => showToast("Copied usage report to clipboard!"));
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Customer Name", "Petrol (L)", "Diesel (L)", "CNG (L)", "Total Volume (L)", "Total Amount (NPR)", "Bills"];
    const rowsOut = filtered.map((r, i) => [
      i + 1,
      `"${r.name}"`,
      toNum(r.petrolLiters).toFixed(2),
      toNum(r.dieselLiters).toFixed(2),
      toNum(r.cngLiters).toFixed(2),
      toNum(r.totalVolume).toFixed(2),
      toNum(r.totalAmount).toFixed(2),
      r.billCount,
    ]);
    const csv = [`Customers Usage Report — ${fromDate} to ${toDate}`, "", headers.join(","), ...rowsOut.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer_usage_report_${fromDate}_to_${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded usage report CSV!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-b border-border/80 pb-3">
        <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
          <FileBarChart2 size={20} className="text-accent" />
          <span>Customers Usage Report</span>
        </h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Fuel volume and billing value per customer for the selected period, cash and credit combined.
        </p>
      </div>

      {toastMessage && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-bg p-3">
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
          <PrimaryButton type="button" onClick={handleFilter} disabled={isPending} className="h-8 px-4 text-xs font-semibold shadow-xs">
            {isPending ? "Filtering…" : "Filter"}
          </PrimaryButton>
        </div>

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
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-muted">
            {rows.length === 0 ? "No customer purchases fell in this period." : "No customers match that search."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Customer / Party Name</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Petrol</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Diesel</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-24 font-medium">CNG</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Total Volume</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Total Amount</th>
                  <th className="px-3 py-2.5 text-right w-16 font-medium">Bills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[11.5px]">
                {filtered.map((r, i) => (
                  <tr key={r.customerId} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{i + 1}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-bold text-text">{r.name}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text">
                      {toNum(r.petrolLiters) > 0 ? fmtL(r.petrolLiters) : "—"}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text">
                      {toNum(r.dieselLiters) > 0 ? fmtL(r.dieselLiters) : "—"}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text">
                      {toNum(r.cngLiters) > 0 ? fmtL(r.cngLiters) : "—"}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-text">{fmtL(r.totalVolume)}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent">{fmtRs(r.totalAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-data text-text-muted">{r.billCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td colSpan={2} className="border-r border-border/60 px-3 py-2.5 font-sans font-bold text-right">TOTALS</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">{fmtL(totalPetrol)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">{fmtL(totalDiesel)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">{fmtL(totalCng)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text">{fmtL(totalVolume)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-accent">{fmtRs(totalAmount)}</td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
