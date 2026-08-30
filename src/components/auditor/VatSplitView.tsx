"use client";

import { useState, useMemo } from "react";
import {
  Percent,
  Printer,
  Download,
  Search,
  CheckCircle2,
  TrendingUp,
  Receipt,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_VAT_SPLIT_ROWS, getVatSplitSummary } from "@/lib/mock/auditor";
import type { VatSplitRow } from "@/lib/auditor";

export function VatSplitView() {
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "SALES" | "PURCHASE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => getVatSplitSummary(), []);

  const filteredRows = useMemo(() => {
    return MOCK_VAT_SPLIT_ROWS.filter((r) => {
      if (directionFilter !== "ALL" && r.direction !== directionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.categoryName.toLowerCase().includes(q);
        const matchCode = r.code.toLowerCase().includes(q);
        const matchRef = r.statutoryReference.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRef) return false;
      }
      return true;
    });
  }, [directionFilter, searchQuery]);

  const totalGross = filteredRows.reduce((sum, r) => sum + r.totalGrossNpr, 0);
  const totalTaxable = filteredRows.reduce((sum, r) => sum + r.taxableAmountNpr, 0);
  const totalExempt = filteredRows.reduce((sum, r) => sum + r.exemptAmountNpr, 0);
  const totalVat = filteredRows.reduce((sum, r) => sum + r.vatAmountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Product / Ledger Category",
      "Code",
      "Direction",
      "Taxable Base (NPR)",
      "VAT Rate (%)",
      "VAT Amount (NPR)",
      "Exempt / Non-Taxable (NPR)",
      "Total Gross Turnover (NPR)",
      "Statutory Authority / Reference",
    ];

    const rows = filteredRows.map((r) => [
      `"${r.categoryName}"`,
      `"${r.code}"`,
      `"${r.direction}"`,
      `"${r.taxableAmountNpr}"`,
      `"${r.vatRatePct}"`,
      `"${r.vatAmountNpr}"`,
      `"${r.exemptAmountNpr}"`,
      `"${r.totalGrossNpr}"`,
      `"${r.statutoryReference}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `vat_taxable_exempt_split_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Percent size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Taxable vs Non-Taxable VAT Split (करयोग्य र करछुट कारोबार विश्लेषण)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory year-end classification of sales & purchases into Standard 13% Taxable and Schedule 1 Exempt.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Schedule
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* Statutory VAT Reconciliation Box */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] uppercase tracking-wider text-text-muted font-medium">
            Outward Sales (बिक्री)
          </div>
          <div className="mt-2 space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Taxable Sales (13%):</span>
              <span className="font-data font-semibold text-text">{fmtRs(summary.salesTaxableNpr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Exempt Sales (Schedule 1):</span>
              <span className="font-data text-text">{fmtRs(summary.salesExemptNpr)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span className="text-accent">Output VAT Collected:</span>
              <span className="font-data text-accent">{fmtRs(summary.salesOutputVatNpr)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[12px] uppercase tracking-wider text-text-muted font-medium">
            Inward Purchases (खरिद)
          </div>
          <div className="mt-2 space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Taxable Purchases (13%):</span>
              <span className="font-data font-semibold text-text">{fmtRs(summary.purchaseTaxableNpr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Exempt Purchases (Schedule 1):</span>
              <span className="font-data text-text">{fmtRs(summary.purchaseExemptNpr)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span className="text-text">Input VAT Paid:</span>
              <span className="font-data text-text">{fmtRs(summary.purchaseInputVatNpr)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="text-[12px] uppercase tracking-wider text-text font-semibold flex items-center justify-between">
            <span>Net Tax Position (कर दायित्व)</span>
            <Badge tone="success">Reconciled</Badge>
          </div>
          <div className="mt-2 space-y-1.5 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Output VAT (Sales):</span>
              <span className="font-data text-text">{fmtRs(summary.salesOutputVatNpr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Less: Input VAT (Purchases):</span>
              <span className="font-data text-text">- {fmtRs(summary.purchaseInputVatNpr)}</span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-1 text-[13px] font-bold">
              <span className="text-text">Net VAT Payable:</span>
              <span className="font-data text-accent">{fmtRs(summary.netVatLiabilityNpr)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search category, item code, statutory reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDirectionFilter("ALL")}
            className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
              directionFilter === "ALL"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("SALES")}
            className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
              directionFilter === "SALES"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Sales (Outward)
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter("PURCHASE")}
            className={`rounded-lg px-3 py-1 text-[12px] font-medium transition-colors ${
              directionFilter === "PURCHASE"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Purchases (Inward)
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Product / Ledger Category</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Direction</th>
                <th className="px-3 py-3 text-right">Taxable Base (13%)</th>
                <th className="px-3 py-3 text-right">VAT Rate</th>
                <th className="px-3 py-3 text-right text-accent">VAT Amount</th>
                <th className="px-3 py-3 text-right">Exempt (0%)</th>
                <th className="px-3 py-3 text-right">Total Gross</th>
                <th className="px-4 py-3">Statutory Schedule Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredRows.map((r, i) => (
                <tr key={`${r.code}-${i}`} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-body font-semibold text-text">
                    {r.categoryName}
                  </td>
                  <td className="px-3 py-3 font-mono text-text-muted text-[11.5px]">
                    {r.code}
                  </td>
                  <td className="px-3 py-3 font-body">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                        r.direction === "SALES"
                          ? "bg-accent/10 text-accent"
                          : "bg-surface-hi text-text-muted"
                      }`}
                    >
                      {r.direction === "SALES" ? "Outward (Sales)" : "Inward (Purchase)"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-text font-medium">
                    {r.taxableAmountNpr > 0 ? fmtRs(r.taxableAmountNpr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {r.vatRatePct}%
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-accent">
                    {r.vatAmountNpr > 0 ? fmtRs(r.vatAmountNpr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {r.exemptAmountNpr > 0 ? fmtRs(r.exemptAmountNpr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {fmtRs(r.totalGrossNpr)}
                  </td>
                  <td className="px-4 py-3 font-body text-[11.5px] text-text-muted">
                    {r.statutoryReference}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-text">
              <tr>
                <td className="px-4 py-3 font-display" colSpan={3}>
                  Total ({filteredRows.length} Items)
                </td>
                <td className="px-3 py-3 text-right font-data">{fmtRs(totalTaxable)}</td>
                <td className="px-3 py-3 text-right font-data">—</td>
                <td className="px-3 py-3 text-right font-data text-accent">{fmtRs(totalVat)}</td>
                <td className="px-3 py-3 text-right font-data text-text-muted">{fmtRs(totalExempt)}</td>
                <td className="px-3 py-3 text-right font-data text-text">{fmtRs(totalGross)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
