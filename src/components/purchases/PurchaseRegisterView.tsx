"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Download, Printer, CalendarRange, Search } from "lucide-react";
import { fmtRs, fmtL } from "@/lib/money";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { toDateInput, parseDateInput } from "@/lib/reports";
import { fiscalYearRange } from "@/lib/bs-date";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import type { PurchaseRegisterData, PurchaseRegisterFilters } from "@/lib/queries/purchase-register";

export function PurchaseRegisterView({
  data,
  filters,
  fiscalYears,
}: {
  data: PurchaseRegisterData;
  filters: PurchaseRegisterFilters;
  fiscalYears: { label: string; startYear: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startNav] = useTransition();

  const [fiscalYear, setFiscalYear] = useState("");
  const [fromDate, setFromDate] = useState(toDateInput(filters.range.from));
  const [toDate, setToDate] = useState(toDateInput(filters.range.to));
  const [search, setSearch] = useState(filters.search);

  const navigate = (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.q) qs.set("q", params.q);
    const s = qs.toString();
    startNav(() => router.push(`${pathname}${s ? `?${s}` : ""}`));
  };

  const handleFiscalYearChange = (value: string) => {
    setFiscalYear(value);
    const fy = fiscalYears.find((f) => String(f.startYear) === value);
    if (!fy) return;
    const range = fiscalYearRange(fy.startYear);
    if (!range) return;
    navigate({ from: toDateInput(range.from), to: toDateInput(range.to), q: search || null });
  };

  const handleFilter = () => {
    const from = parseDateInput(fromDate);
    const to = parseDateInput(toDate);
    if (!from || !to) return;
    navigate({ from: toDateInput(from), to: toDateInput(to), q: search || null });
  };

  const handleExportCSV = () => {
    const headers = [
      "Purchase Date (BS)",
      "Purchase Date (English)",
      "Bill Number",
      "Supplier Name",
      "Supplier PAN",
      "Subtotal Purchase Price",
      "Taxable Amount",
      "Non-Taxable Amount",
      "Discount Amount",
      "Tax Amount",
      "Total Purchase Price",
      "Recorded By",
    ];
    const rows = data.rows.map((r) => [
      r.purchaseDateBS ?? "",
      r.dateGregorian,
      r.invoiceNo ?? "",
      r.supplier,
      r.supplierPan ?? "",
      r.subTotal,
      r.taxableAmount,
      r.nonTaxableAmount,
      r.discountAmount,
      r.taxAmount,
      r.totalAmount,
      r.recordedBy,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `purchase_register_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <option value="">Custom range</option>
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
            placeholder="Bill number, supplier, tanker no."
            className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] text-text"
          />
        </div>

        <PrimaryButton type="button" onClick={handleFilter} disabled={isPending} className="px-4 py-1.75 text-[12px]">
          {isPending ? "Loading…" : "Filter"}
        </PrimaryButton>

        <div className="ml-auto flex gap-2">
          <GhostButton type="button" onClick={() => window.print()} className="gap-1.5 text-xs">
            <Printer size={14} />
            Print
          </GhostButton>
          <PrimaryButton type="button" onClick={handleExportCSV} className="gap-1.5 text-xs">
            <Download size={14} />
            Export CSV
          </PrimaryButton>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Subtotal Purchase Price</div>
          <div className="font-data mt-1 text-lg font-bold text-text">{fmtRs(data.totals.subTotal)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Taxable Amount</div>
          <div className="font-data mt-1 text-lg font-bold text-text">{fmtRs(data.totals.taxable)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Tax Amount (VAT)</div>
          <div className="font-data mt-1 text-lg font-bold text-text">{fmtRs(data.totals.tax)}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs text-text-muted">Total Purchase Price</div>
          <div className="font-data mt-1 text-lg font-bold text-accent">{fmtRs(data.totals.grandTotal)}</div>
        </div>
      </div>

      {/* Register Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-295 border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-hi font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">S.N.</th>
              <th className="px-3 py-2.5 font-medium">DATE (BS)</th>
              <th className="px-3 py-2.5 font-medium">DATE (AD)</th>
              <th className="px-3 py-2.5 font-medium">BILL NUMBER</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER NAME</th>
              <th className="px-3 py-2.5 font-medium">SUPPLIER PAN</th>
              <th className="px-3 py-2.5 text-right font-medium">SUBTOTAL (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TAXABLE (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">NON-TAXABLE (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">DISCOUNT (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TAX (RS)</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL (RS)</th>
              <th className="px-3 py-2.5 font-medium">RECORDED BY</th>
              <th className="px-3 py-2.5 font-medium">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-3 py-10 text-center text-xs text-text-muted">
                  No purchases recorded in this range.
                </td>
              </tr>
            ) : (
              data.rows.map((r, idx) => (
                <tr key={r.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3 text-[12px] text-text-muted">{idx + 1}</td>
                  <td className="px-3 py-3 font-data text-[12.5px] text-text">{r.purchaseDateBS ?? "—"}</td>
                  <td className="px-3 py-3 font-data text-[11.5px] text-text-muted">{r.dateGregorian}</td>
                  <td className="px-3 py-3 font-data text-xs font-semibold text-accent">{r.invoiceNo ?? "—"}</td>
                  <td className="px-3 py-3 text-[13px] text-text">
                    {r.supplier}
                    <div className="text-[11px] text-text-muted">
                      {FUEL_LABEL[r.fuel as FuelId] ?? r.fuel} · {fmtL(r.liters)}
                    </div>
                  </td>
                  <td className="px-3 py-3 font-data text-[12px] text-text-muted">{r.supplierPan ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(r.subTotal)}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(r.taxableAmount)}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">{fmtRs(r.nonTaxableAmount)}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text-muted">{fmtRs(r.discountAmount)}</td>
                  <td className="px-3 py-3 text-right font-data text-[12.5px] text-text">{fmtRs(r.taxAmount)}</td>
                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">{fmtRs(r.totalAmount)}</td>
                  <td className="px-3 py-3 text-[12px] text-text-muted">{r.recordedBy}</td>
                  <td className="px-3 py-3">
                    <Link href="/purchases/returns" className="text-[12px] font-semibold text-error hover:underline">
                      Return Purchase
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
