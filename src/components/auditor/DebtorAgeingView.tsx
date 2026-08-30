"use client";

import { useState, useMemo } from "react";
import {
  HandCoins,
  Printer,
  Download,
  Search,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Phone,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_DEBTOR_AGEING } from "@/lib/mock/auditor";
import type { DebtorAgeingRow, RiskLevel } from "@/lib/auditor";

export function DebtorAgeingView() {
  const [debtors] = useState<DebtorAgeingRow[]>(MOCK_DEBTOR_AGEING);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return debtors.filter((d) => {
      if (riskFilter !== "ALL" && d.riskLevel !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = d.customerName.toLowerCase().includes(q);
        const matchPan = d.panNumber.toLowerCase().includes(q);
        const matchPhone = d.phone.toLowerCase().includes(q);
        if (!matchName && !matchPan && !matchPhone) return false;
      }
      return true;
    });
  }, [debtors, searchQuery, riskFilter]);

  const totalOutstanding = filtered.reduce((sum, d) => sum + d.totalDueNpr, 0);
  const totalBucket0to30 = filtered.reduce((sum, d) => sum + d.bucket0to30Npr, 0);
  const totalBucket31to60 = filtered.reduce((sum, d) => sum + d.bucket31to60Npr, 0);
  const totalBucket61to90 = filtered.reduce((sum, d) => sum + d.bucket61to90Npr, 0);
  const totalBucket90Plus = filtered.reduce((sum, d) => sum + d.bucket90PlusNpr, 0);

  // Recommended Provision for Doubtful Debts under NFRS 9: 100% on 90+, 50% on 61-90, 10% on 31-60
  const recommendedProvision = totalBucket90Plus * 1.0 + totalBucket61to90 * 0.5 + totalBucket31to60 * 0.1;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "PAN Number",
      "Phone",
      "Credit Limit (NPR)",
      "Total Due (NPR)",
      "0-30 Days (NPR)",
      "31-60 Days (NPR)",
      "61-90 Days (NPR)",
      "90+ Days (NPR)",
      "Oldest Invoice (BS)",
      "Risk Level",
      "Last Payment Date (BS)",
      "Last Payment Amount (NPR)",
    ];

    const rows = filtered.map((d) => [
      `"${d.customerName}"`,
      `"${d.panNumber}"`,
      `"${d.phone}"`,
      `"${d.creditLimitNpr}"`,
      `"${d.totalDueNpr}"`,
      `"${d.bucket0to30Npr}"`,
      `"${d.bucket31to60Npr}"`,
      `"${d.bucket61to90Npr}"`,
      `"${d.bucket90PlusNpr}"`,
      `"${d.oldestInvoiceDateBS}"`,
      `"${d.riskLevel}"`,
      `"${d.lastPaymentDateBS || ""}"`,
      `"${d.lastPaymentAmountNpr || 0}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `debtor_ageing_schedule_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case "LOW":
        return <Badge tone="success">Low Risk</Badge>;
      case "MODERATE":
        return <Badge tone="muted">Moderate</Badge>;
      case "HIGH":
        return <Badge tone="accent">High Overdue</Badge>;
      case "CRITICAL":
        return <Badge tone="error">Critical Default</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <HandCoins size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Debtor Ageing Schedule (आसामी उधारी उमेर वर्गीकरण तालिका)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory year-end accounts receivable aging matrix partitioned into 30-day buckets under NFRS 9.
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

      {/* Ageing KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Receivables"
          value={fmtRs(totalOutstanding)}
          icon={HandCoins}
          tone="accent"
          small
        />
        <StatCard
          label="0–30 Days (Current)"
          value={fmtRs(totalBucket0to30)}
          icon={ShieldCheck}
          tone="success"
          small
        />
        <StatCard
          label="31–60 Days"
          value={fmtRs(totalBucket31to60)}
          icon={AlertTriangle}
          tone="text"
          small
        />
        <StatCard
          label="61–90 Days"
          value={fmtRs(totalBucket61to90)}
          icon={AlertTriangle}
          tone="accent"
          small
        />
        <StatCard
          label="90+ Days (Overdue)"
          value={fmtRs(totalBucket90Plus)}
          icon={AlertTriangle}
          tone="error"
          small
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by customer name, PAN, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[12.5px] text-text-muted">Risk Profile:</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk (Current)</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Overdue</option>
            <option value="CRITICAL">Critical Default (90+ Days)</option>
          </select>
        </div>
      </div>

      {/* Main Ageing Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Customer / Debtor</th>
                <th className="px-3 py-3 text-right">Credit Limit</th>
                <th className="px-3 py-3 text-right">Total Due</th>
                <th className="px-3 py-3 text-right text-success">0–30 Days</th>
                <th className="px-3 py-3 text-right">31–60 Days</th>
                <th className="px-3 py-3 text-right text-accent">61–90 Days</th>
                <th className="px-3 py-3 text-right text-error">90+ Days</th>
                <th className="px-3 py-3 text-center">Risk Grade</th>
                <th className="px-4 py-3 text-right">Last Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filtered.map((d) => (
                <tr key={d.customerId} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-body">
                    <div className="font-semibold text-text">{d.customerName}</div>
                    <div className="text-[11px] text-text-muted">
                      PAN: {d.panNumber} · {d.phone}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {fmtRs(d.creditLimitNpr)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {fmtRs(d.totalDueNpr)}
                  </td>
                  <td className="px-3 py-3 text-right text-success">
                    {d.bucket0to30Npr > 0 ? fmtRs(d.bucket0to30Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right text-text">
                    {d.bucket31to60Npr > 0 ? fmtRs(d.bucket31to60Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-accent">
                    {d.bucket61to90Npr > 0 ? fmtRs(d.bucket61to90Npr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-error">
                    {d.bucket90PlusNpr > 0 ? fmtRs(d.bucket90PlusNpr) : "—"}
                  </td>
                  <td className="px-3 py-3 text-center font-body">
                    {getRiskBadge(d.riskLevel)}
                  </td>
                  <td className="px-4 py-3 text-right font-body text-[11.5px] text-text-muted">
                    {d.lastPaymentDateBS ? (
                      <div>
                        <span className="font-medium text-text">{fmtRs(d.lastPaymentAmountNpr || 0)}</span>
                        <div className="text-[10.5px] text-text-muted">BS: {d.lastPaymentDateBS}</div>
                      </div>
                    ) : (
                      "No prior settlement"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-text">
              <tr>
                <td className="px-4 py-3 font-display">Grand Total ({filtered.length} Debtors)</td>
                <td className="px-3 py-3 text-right font-data">—</td>
                <td className="px-3 py-3 text-right font-data text-accent">{fmtRs(totalOutstanding)}</td>
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

      {/* Auditor Note on Expected Credit Loss (ECL) Provision */}
      <div className="rounded-xl border border-border bg-surface p-4 text-[12.5px]">
        <div className="flex items-center gap-2 font-semibold text-text mb-1.5">
          <ShieldCheck size={16} className="text-accent" /> Statutory Auditor Note on Provisioning (NFRS 9)
        </div>
        <p className="text-text-muted leading-relaxed">
          In accordance with Nepal Financial Reporting Standard 9 (NFRS 9 - Financial Instruments), debts aged beyond 90 days require full impairment provisioning. The calculated Recommended Provision for Expected Credit Losses is{" "}
          <span className="font-data font-bold text-text">{fmtRs(recommendedProvision)}</span> (comprising 100% of 90+ days, 50% of 61-90 days, and 10% of 31-60 days).
        </p>
      </div>
    </div>
  );
}
