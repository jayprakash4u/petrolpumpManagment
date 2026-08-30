"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs } from "@/lib/money";
import { MOCK_LARGE_TRANSACTIONS } from "@/lib/mock/auditor";
import { filterLargeTransactions, type LargeTransactionEntry, type TransactionType } from "@/lib/auditor";

export function LargeTransactionsView() {
  const [threshold, setThreshold] = useState<number>(100000);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const byThresholdAndType = filterLargeTransactions(MOCK_LARGE_TRANSACTIONS, threshold, typeFilter);
    if (!searchQuery.trim()) return byThresholdAndType;

    const q = searchQuery.toLowerCase();
    return byThresholdAndType.filter((t) => {
      const matchRef = t.referenceNo.toLowerCase().includes(q);
      const matchParty = t.partyName.toLowerCase().includes(q);
      const matchPan = t.partyPan.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      return matchRef || matchParty || matchPan || matchDesc;
    });
  }, [threshold, typeFilter, searchQuery]);

  const totalValue = filtered.reduce((sum, t) => sum + t.amountNpr, 0);
  const nonPanCount = filtered.filter((t) => !t.isPanCompliant).length;
  const maxTransaction = filtered.reduce((max, t) => (t.amountNpr > max ? t.amountNpr : max), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Date (BS)",
      "Date (AD)",
      "Reference No",
      "Transaction Type",
      "Party Name",
      "Party PAN",
      "Amount (NPR)",
      "Payment Mode",
      "PAN Compliance",
      "Description",
      "Auditor Flags",
    ];

    const rows = filtered.map((t) => [
      `"${t.dateBS}"`,
      `"${t.dateAD}"`,
      `"${t.referenceNo}"`,
      `"${t.type}"`,
      `"${t.partyName}"`,
      `"${t.partyPan}"`,
      `"${t.amountNpr}"`,
      `"${t.paymentMode}"`,
      `"${t.isPanCompliant ? "COMPLIANT" : "NON_COMPLIANT"}"`,
      `"${t.description}"`,
      `"${(t.flags || []).join("; ")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `large_transactions_schedule_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeLabel = (type: TransactionType) => {
    switch (type) {
      case "SALES_INVOICE":
        return "Sales Invoice";
      case "FUEL_PURCHASE":
        return "NOC Purchase";
      case "BANK_DEPOSIT":
        return "Cash Deposit";
      case "CUSTOMER_SETTLEMENT":
        return "Receivable Receipt";
      case "SUPPLIER_PAYMENT":
        return "Trade Payment";
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Large Transactions Report (ठूला कारोबार विवरण — १ लाख माथि)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory disclosure of transactions exceeding the reporting threshold under Nepal AML & IRD Rule 23.
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

      {/* Threshold Configuration Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-3">
          <Sliders size={18} className="text-accent" />
          <div>
            <div className="text-[13px] font-semibold text-text">
              Configurable Reporting Threshold:{" "}
              <span className="font-data text-accent">{fmtRs(threshold)}</span>
            </div>
            <div className="text-[11.5px] text-text-muted">
              Statutory default: NPR 1,00,000 (1 Lakh). Adjust to filter specific audit scrutiny levels.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[50000, 100000, 200000, 500000, 1000000].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setThreshold(val)}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                threshold === val
                  ? "bg-accent text-bg font-bold shadow-xs"
                  : "bg-surface border border-border text-text hover:bg-surface-hi"
              }`}
            >
              {val === 100000 ? "1 Lakh (Std)" : fmtRs(val)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Filtered Transactions"
          value={`${filtered.length} Records`}
          icon={FileCheck}
          tone="accent"
          small
        />
        <StatCard
          label="Cumulative Value Above Threshold"
          value={fmtRs(totalValue)}
          icon={TrendingUp}
          tone="text"
          small
        />
        <StatCard
          label="Largest Single Transaction"
          value={fmtRs(maxTransaction)}
          icon={DollarSign}
          tone="success"
          small
        />
        <StatCard
          label="PAN Non-Compliance Flags"
          value={`${nonPanCount} Txns`}
          icon={AlertCircle}
          tone={nonPanCount > 0 ? "error" : "success"}
          small
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-text">
          <Search size={15} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search party name, PAN, reference no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-[12.5px] text-text-muted">Transaction Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12.5px] text-text"
          >
            <option value="ALL">All Types</option>
            <option value="SALES_INVOICE">Sales Invoices</option>
            <option value="FUEL_PURCHASE">NOC Fuel Purchases</option>
            <option value="BANK_DEPOSIT">Bank Cash Deposits</option>
            <option value="CUSTOMER_SETTLEMENT">Customer Settlements</option>
            <option value="SUPPLIER_PAYMENT">Supplier Payments</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Date (BS)</th>
                <th className="px-3 py-3">Ref No</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Party Name / Counterparty</th>
                <th className="px-3 py-3">PAN</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Payment Channel</th>
                <th className="px-3 py-3 text-center">Compliance</th>
                <th className="px-4 py-3">Description / Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 text-text font-medium">{t.dateBS}</td>
                  <td className="px-3 py-3 font-mono text-accent">{t.referenceNo}</td>
                  <td className="px-3 py-3 font-body text-text-muted">
                    <span className="rounded bg-surface-hi px-2 py-0.5 text-[11px]">
                      {getTypeLabel(t.type)}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-body font-semibold text-text">
                    {t.partyName}
                  </td>
                  <td className="px-3 py-3 text-text-muted">
                    {t.partyPan}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {fmtRs(t.amountNpr)}
                  </td>
                  <td className="px-3 py-3 font-body text-[11.5px] text-text-muted">
                    {t.paymentMode}
                  </td>
                  <td className="px-3 py-3 text-center font-body">
                    {t.isPanCompliant ? (
                      <Badge tone="success">Compliant</Badge>
                    ) : (
                      <Badge tone="error">Missing PAN</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-[11.5px] text-text-muted max-w-xs truncate">
                    {t.description}
                    {t.flags && t.flags.length > 0 && (
                      <div className="text-error font-medium text-[10.5px]">
                        ⚠️ {t.flags.join(", ")}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-text">
              <tr>
                <td className="px-4 py-3 font-display" colSpan={5}>
                  Total ({filtered.length} Transactions ≥ {fmtRs(threshold)})
                </td>
                <td className="px-3 py-3 text-right font-data text-accent">
                  {fmtRs(totalValue)}
                </td>
                <td className="px-3 py-3" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
