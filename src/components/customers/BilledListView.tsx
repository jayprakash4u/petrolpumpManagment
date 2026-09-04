"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ListOrdered, Search, Copy, Download, FileSpreadsheet, Printer, CheckCircle2 } from "lucide-react";
import { BS_MONTHS } from "@/lib/bs-date";
import type { BilledListData } from "@/lib/queries/customers";
import { fmtRs, toNum } from "@/lib/money";
import { GhostButton } from "@/components/ui/Button";

/**
 * A printable, per-party acknowledgment sheet: every credit bill issued to a
 * customer in the selected BS month, plus their current outstanding
 * balance, from `getBilledListForMonth`. Received By / Mobile / Signature /
 * Remarks are left blank on purpose — they're filled in by hand when the
 * printed sheet comes back signed, not data this app collects.
 */
export function BilledListView({
  data,
  month,
  year,
  years,
}: {
  data: BilledListData;
  month: number;
  year: number;
  years: number[];
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

  const navigate = (nextMonth: number, nextYear: number) => {
    startNav(() => router.push(`${pathname}?month=${nextMonth}&year=${nextYear}`));
  };

  const monthLabel = BS_MONTHS[month - 1] ?? "";

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter((r) => r.name.toLowerCase().includes(q) || r.billNos.includes(q));
  }, [data.rows, searchQuery]);

  const totalBillAmount = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.billAmount), 0), [filtered]);
  const totalDue = useMemo(() => filtered.reduce((sum, r) => sum + toNum(r.dueAmount), 0), [filtered]);

  const handleCopy = () => {
    const headers = ["SN", "Party's Name", "Balance Due", "Bill No.", "Bill Amount"];
    const rowsOut = filtered.map((r, i) => [i + 1, r.name, toNum(r.dueAmount).toFixed(2), r.billNos, toNum(r.billAmount).toFixed(2)]);
    navigator.clipboard
      .writeText([headers.join("\t"), ...rowsOut.map((r) => r.join("\t"))].join("\n"))
      .then(() => showToast("Copied billed list to clipboard!"));
  };

  const handleDownloadCSV = () => {
    const headers = ["SN", "Party's Name", "Balance Due (NPR)", "Bill No.", "Bill Amount (NPR)"];
    const rowsOut = filtered.map((r, i) => [i + 1, `"${r.name}"`, toNum(r.dueAmount).toFixed(2), `"${r.billNos}"`, toNum(r.billAmount).toFixed(2)]);
    const csv = [`Billed List — ${monthLabel} ${year}`, "", headers.join(","), ...rowsOut.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billed_list_${monthLabel}_${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded billed list CSV!");
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-b border-border/80 pb-3">
        <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
          <ListOrdered size={20} className="text-accent" />
          <span>Billed List — Acknowledgment Sheet</span>
        </h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Credit bills issued this month, printed for the collection round and signed off as received.
        </p>
      </div>

      {toastMessage && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-center gap-3 border-b border-border/80 pb-4">
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">Month</label>
            <select
              value={month}
              onChange={(e) => navigate(Number(e.target.value), year)}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent focus:outline-hidden"
            >
              {BS_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">Year</label>
            <select
              value={year}
              onChange={(e) => navigate(month, Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-accent focus:outline-hidden"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {data.station && (
          <div className="text-center text-[12.5px] text-text pb-3 border-b border-border/80">
            {data.station.panNo && <div className="text-text-muted">PAN No: {data.station.panNo}</div>}
            <div className="font-display text-[14px] font-bold">{data.station.name}</div>
            <div className="text-text-muted">{data.station.address}</div>
          </div>
        )}

        <p className="text-center text-[12.5px] font-semibold text-text">
          Credit bills issued in {monthLabel} {year}
        </p>

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
              placeholder="Search party or bill no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-muted">
            {data.rows.length === 0
              ? `No credit bills were issued in ${monthLabel} ${year}.`
              : "No parties match that search."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                  <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                  <th className="border-r border-border/60 px-3 py-2.5 font-medium">Party&apos;s Name</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Balance Due</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-32 font-medium">Bill No.</th>
                  <th className="border-r border-border/60 px-3 py-2.5 text-right w-32 font-medium">Bill Amount</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-32 font-medium">Received By</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-28 font-medium">Mobile No.</th>
                  <th className="border-r border-border/60 px-3 py-2.5 w-24 font-medium">Signature</th>
                  <th className="px-3 py-2.5 w-24 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-[11.5px]">
                {filtered.map((r, i) => (
                  <tr key={r.customerId} className="hover:bg-surface-hi/40 transition-colors text-text">
                    <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{i + 1}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-semibold text-text whitespace-nowrap">{r.name}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text-muted whitespace-nowrap">
                      {fmtRs(r.dueAmount)}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text whitespace-nowrap">{r.billNos}</td>
                    <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent whitespace-nowrap">
                      {fmtRs(r.billAmount)}
                    </td>
                    <td className="border-r border-border/60 px-3 py-2.5">&nbsp;</td>
                    <td className="border-r border-border/60 px-3 py-2.5">&nbsp;</td>
                    <td className="border-r border-border/60 px-3 py-2.5">&nbsp;</td>
                    <td className="px-3 py-2.5">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-surface-hi/80 font-data text-xs font-bold text-text whitespace-nowrap">
                  <td colSpan={2} className="border-r border-border/60 px-3 py-2.5 font-sans font-bold text-right">TOTAL</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-bold text-text-muted">{fmtRs(totalDue)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5"></td>
                  <td colSpan={5} className="px-3 py-2.5 text-right font-bold text-accent">{fmtRs(totalBillAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
