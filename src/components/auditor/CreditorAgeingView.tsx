"use client";

import { useState, useMemo } from "react";
import {
  Truck,
  Printer,
  Download,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_CREDITOR_AGEING } from "@/lib/mock/auditor";
import type { CreditorAgeingRow } from "@/lib/auditor";

export function CreditorAgeingView() {
  const [creditors] = useState<CreditorAgeingRow[]>(MOCK_CREDITOR_AGEING);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return creditors.filter((c) => {
      if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.supplierName.toLowerCase().includes(q);
        const matchPan = c.panNumber.toLowerCase().includes(q);
        const matchRef = c.oldestInvoiceRef.toLowerCase().includes(q);
        if (!matchName && !matchPan && !matchRef) return false;
      }
      return true;
    });
  }, [creditors, searchQuery, categoryFilter]);

  const totalPayable = filtered.reduce((sum, c) => sum + c.totalPayableNpr, 0);
  const totalBucket0to30 = filtered.reduce((sum, c) => sum + c.bucket0to30Npr, 0);
  const totalBucket31to60 = filtered.reduce((sum, c) => sum + c.bucket31to60Npr, 0);
  const totalBucket61to90 = filtered.reduce((sum, c) => sum + c.bucket61to90Npr, 0);
  const totalBucket90Plus = filtered.reduce((sum, c) => sum + c.bucket90PlusNpr, 0);
  const overdueCount = filtered.filter((c) => c.isOverdue).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Supplier / Creditor",
      "PAN Number",
      "Category",
      "Payment Terms",
      "Total Payable (NPR)",
      "0-30 Days (NPR)",
      "31-60 Days (NPR)",
      "61-90 Days (NPR)",
      "90+ Days (NPR)",
      "Oldest Invoice Ref",
      "Oldest Invoice Date (BS)",
      "Overdue Status",
    ];

    const rows = filtered.map((c) => [
      `"${c.supplierName}"`,
      `"${c.panNumber}"`,
      `"${c.category}"`,
      `"${c.paymentTerms}"`,
      `"${c.totalPayableNpr}"`,
      `"${c.bucket0to30Npr}"`,
      `"${c.bucket31to60Npr}"`,
      `"${c.bucket61to90Npr}"`,
      `"${c.bucket90PlusNpr}"`,
      `"${c.oldestInvoiceRef}"`,
      `"${c.oldestInvoiceDateBS}"`,
      `"${c.isOverdue ? "OVERDUE" : "CURRENT"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `creditor_ageing_schedule_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <Truck size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Creditor Ageing Schedule (साहु भुक्तानी उमेर वर्गीकरण तालिका)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Trade and petroleum supplier payables schedule with credit term compliance tracking.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Trade Payables"
          value={fmtRs(totalPayable)}
          icon={Truck}
          tone="accent"
          small
        />
        <StatCard
          label="0–30 Days (Current)"
          value={fmtRs(totalBucket0to30)}
          icon={CheckCircle2}
          tone="success"
          small
        />
        <StatCard
          label="31–60 Days"
          value={fmtRs(totalBucket31to60)}
          icon={Clock}
          tone="text"
          small
        />
        <StatCard
          label="61–90 Days"
          value={fmtRs(totalBucket61to90)}
          icon={AlertCircle}
          tone="accent"
          small
        />
        <StatCard
          label="Overdue Invoices"
          value={`${overdueCount} Suppliers`}
          icon={AlertCircle}
          tone={overdueCount > 0 ? "error" : "success"}
          small
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by supplier name, PAN, or invoice ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[12.5px] text-text-muted">Supplier Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text"
          >
            <option value="ALL">All Categories</option>
            <option value="Fuel Refinery (NOC)">Fuel Refinery (NOC)</option>
            <option value="Lubricants & Oils">Lubricants & Oils</option>
            <option value="Spares & Maintenance">Spares & Maintenance</option>
            <option value="Utilities & Services">Utilities & Services</option>
          </select>
        </div>
      </div>

      {/* Main Creditor Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Supplier / Creditor</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Payment Terms</th>
                <th className="px-3 py-3 text-right">Total Payable</th>
                <th className="px-3 py-3 text-right text-success">0–30 Days</th>
                <th className="px-3 py-3 text-right">31–60 Days</th>
                <th className="px-3 py-3 text-right text-accent">61–90 Days</th>
                <th className="px-3 py-3 text-right text-error">90+ Days</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Oldest Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filtered.map((c) => (
                <tr key={c.supplierId} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-body">
                    <div className="font-semibold text-text">{c.supplierName}</div>
                    <div className="text-[11px] text-text-muted">PAN: {c.panNumber}</div>
                  </td>
                  <td className="px-3 py-3 font-body text-text-muted">
                    <span className="rounded-md bg-surface-hi px-2 py-0.5 text-[11px]">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-body text-[12px] text-text">
                    {c.paymentTerms}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {fmtRs(c.totalPayableNpr)}
                  </td>
                  <td className="px-3 py-3 text-right text-success">
                    {c.bucket0to30Npr > 0 ? fmtRs(c.bucket0to30Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-text">
                    {c.bucket31to60Npr > 0 ? fmtRs(c.bucket31to60Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-accent">
                    {c.bucket61to90Npr > 0 ? fmtRs(c.bucket61to90Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-error">
                    {c.bucket90PlusNpr > 0 ? fmtRs(c.bucket90PlusNpr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-center font-body">
                    {c.isOverdue ? (
                      <Badge tone="error">Overdue</Badge>
                    ) : (
                      <Badge tone="success">Current</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-body text-[11.5px] text-text-muted">
                    <div className="font-mono text-text">{c.oldestInvoiceRef}</div>
                    <div className="text-[10.5px] text-text-muted">BS: {c.oldestInvoiceDateBS}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-text">
              <tr>
                <td className="px-4 py-3 font-display">Grand Total ({filtered.length} Suppliers)</td>
                <td className="px-3 py-3" colSpan={2}></td>
                <td className="px-3 py-3 text-right font-data text-accent">{fmtRs(totalPayable)}</td>
                <td className="px-3 py-3 text-right font-data text-success">{fmtRs(totalBucket0to30)}</td>
                <td className="px-3 py-3 text-right font-data">{fmtRs(totalBucket31to60)}</td>
                <td className="px-3 py-3 text-right font-data text-accent">{fmtRs(totalBucket61to90)}</td>
                <td className="px-3 py-3 text-right font-data text-error">{fmtRs(totalBucket90Plus)}</td>
                <td className="px-3 py-3 text-center font-body">—</td>
                <td className="px-4 py-3 text-right font-body">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
