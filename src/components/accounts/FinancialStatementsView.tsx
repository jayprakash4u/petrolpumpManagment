"use client";

import { useState } from "react";
import {
  Scale,
  Calculator,
  Printer,
  Download,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
} from "lucide-react";
import { calculateTrialBalance, calculateProfitAndLoss } from "@/lib/accounts";
import { getLedgerHeads } from "@/lib/mock/accounts";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

export function FinancialStatementsView({
  initialTab = "TRIAL_BALANCE",
}: {
  initialTab?: "TRIAL_BALANCE" | "PROFIT_LOSS";
}) {
  const [activeTab, setActiveTab] = useState<"TRIAL_BALANCE" | "PROFIT_LOSS">(initialTab);
  const [ledgers] = useState(() => getLedgerHeads());
  const [periodBS, setPeriodBS] = useState("Bhadra 2083");

  const trialBalance = calculateTrialBalance(ledgers);
  const pnl = calculateProfitAndLoss({ periodBS });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (activeTab === "TRIAL_BALANCE") {
      const headers = ["Account Code", "Ledger Name", "Category", "Debit (NPR)", "Credit (NPR)"];
      const rows = trialBalance.items.map((item) => [
        `"${item.code}"`,
        `"${item.name}"`,
        `"${item.category}"`,
        `"${item.debitNpr}"`,
        `"${item.creditNpr}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trial_balance_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ["Financial Head", "Amount (NPR)"];
      const rows = [
        ["Total Revenue", String(pnl.totalRevenueNpr)],
        ["Cost of Goods Sold (COGS)", String(pnl.totalCogsNpr)],
        ["Gross Profit", String(pnl.grossProfitNpr)],
        ["Total Operating Expenses", String(pnl.totalOperatingExpensesNpr)],
        ["Net Profit", String(pnl.netProfitNpr)],
        ["Profit Margin (%)", `${pnl.profitMarginPct}%`],
      ];
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `profit_and_loss_${periodBS}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            {activeTab === "TRIAL_BALANCE" ? <Scale size={20} /> : <Calculator size={20} />}
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              {activeTab === "TRIAL_BALANCE" ? "Trial Balance Parity Audit" : "Station Profit & Loss Statement"}
            </h3>
            <p className="text-[12.5px] text-text-muted">
              {activeTab === "TRIAL_BALANCE"
                ? "Double-entry parity check across all general ledger accounts."
                : "Real trading margin, gross profit, operating overheads, and net station profit."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Statement
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("TRIAL_BALANCE")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "TRIAL_BALANCE"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Trial Balance (Debit = Credit)
          </button>
          <button
            onClick={() => setActiveTab("PROFIT_LOSS")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "PROFIT_LOSS"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Profit & Loss Statement (P&L)
          </button>
        </div>

        {activeTab === "PROFIT_LOSS" && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-text-muted">Accounting Period:</span>
            <Select
              value={periodBS}
              onChange={(e) => setPeriodBS(e.target.value)}
              className="text-[12px] w-auto py-1"
            >
              <option value="Bhadra 2083">Bhadra 2083 BS</option>
              <option value="Shrawan 2083">Shrawan 2083 BS</option>
              <option value="FY 2082/83">Fiscal Year 2082/83</option>
            </Select>
          </div>
        )}
      </div>

      {/* VIEW 1: TRIAL BALANCE */}
      {activeTab === "TRIAL_BALANCE" && (
        <div className="space-y-4">
          {/* Parity Status Banner */}
          <div
            className={`flex items-center justify-between rounded-xl border p-4 text-[13px] ${
              trialBalance.isBalanced
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} />
              <span className="font-semibold">
                {trialBalance.isBalanced
                  ? "Trial Balance is in Parity (Total Debits = Total Credits)"
                  : "Trial Balance Out of Balance"}
              </span>
            </div>
            <span className="font-data font-bold">{fmtRs(trialBalance.totalDebitNpr)}</span>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                  <tr>
                    <th className="p-3 w-20">Code</th>
                    <th className="p-3">Ledger Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Debit (Dr) NPR</th>
                    <th className="p-3 text-right">Credit (Cr) NPR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trialBalance.items.map((item) => (
                    <tr key={item.ledgerId} className="hover:bg-surface-hi/40 transition-colors">
                      <td className="p-3 font-data font-bold text-accent">{item.code}</td>
                      <td className="p-3 font-medium text-text">{item.name}</td>
                      <td className="p-3 font-data text-text-muted">{item.category}</td>
                      <td className="p-3 font-data text-right font-semibold text-text">
                        {item.debitNpr > 0 ? fmtRs(item.debitNpr) : "—"}
                      </td>
                      <td className="p-3 font-data text-right font-semibold text-text">
                        {item.creditNpr > 0 ? fmtRs(item.creditNpr) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-[13px]">
                  <tr>
                    <td colSpan={3} className="p-3 text-right text-text">Total Trial Balance:</td>
                    <td className="p-3 font-data text-right text-accent">{fmtRs(trialBalance.totalDebitNpr)}</td>
                    <td className="p-3 font-data text-right text-accent">{fmtRs(trialBalance.totalCreditNpr)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* VIEW 2: PROFIT & LOSS STATEMENT */}
      {activeTab === "PROFIT_LOSS" && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Fuel & Goods Revenue" value={fmtRs(pnl.totalRevenueNpr)} icon={TrendingUp} tone="accent" small />
            <StatCard label="Cost of Goods Sold (COGS)" value={fmtRs(pnl.totalCogsNpr)} icon={Layers} tone="text" small />
            <StatCard label="Gross Trading Profit" value={fmtRs(pnl.grossProfitNpr)} icon={DollarSign} tone="success" small />
            <StatCard label="Net Profit Margin" value={`${fmtRs(pnl.netProfitNpr)} (${pnl.profitMarginPct}%)`} icon={PieChart} tone="accent" small />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue & Gross Profit Card */}
            <Card className="p-5 space-y-4">
              <h4 className="font-display font-bold text-[15px] text-text border-b border-border pb-2">
                1. Trading Account (Revenue & Cost of Sales)
              </h4>

              <div className="space-y-2 text-[12.5px]">
                <div className="flex justify-between text-text-muted">
                  <span>Petrol (MS) Sales:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.petrolSalesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Diesel (HSD) Sales:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.dieselSalesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>CNG Sales:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.cngSalesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Lubricants & Engine Oil Sales:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.lubricantsSalesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Scrap & Other Income:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.otherIncomeNpr)}</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-2 font-bold text-text">
                  <span>Total Gross Revenue:</span>
                  <span className="font-data text-accent text-[13.5px]">{fmtRs(pnl.totalRevenueNpr)}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-[12.5px]">
                <span className="font-semibold text-text uppercase text-[11px] block">Less Cost of Goods Sold (COGS):</span>
                <div className="flex justify-between text-text-muted">
                  <span>NOC Fuel Purchases (Amlekhgunj / Thankot):</span>
                  <span className="font-data text-error">-{fmtRs(pnl.fuelPurchasesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Lubricants Stock Procurement:</span>
                  <span className="font-data text-error">-{fmtRs(pnl.lubricantsPurchasesNpr)}</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-2 font-bold text-text">
                  <span>Total COGS:</span>
                  <span className="font-data text-error">-{fmtRs(pnl.totalCogsNpr)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-success/30 bg-success/10 p-3.5 flex justify-between items-center text-[13.5px]">
                <strong className="text-text">Gross Trading Margin:</strong>
                <span className="font-data font-bold text-success text-[15px]">{fmtRs(pnl.grossProfitNpr)}</span>
              </div>
            </Card>

            {/* Operating Expenses & Net Margin Card */}
            <Card className="p-5 space-y-4">
              <h4 className="font-display font-bold text-[15px] text-text border-b border-border pb-2">
                2. Operating Expenses & Net Station Income
              </h4>

              <div className="space-y-2 text-[12.5px]">
                <div className="flex justify-between text-text-muted">
                  <span>Staff Salaries & Provident Fund:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.staffSalariesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Generator Diesel & Overhaul:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.generatorFuelNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>NEA Electricity & Water Utilities:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.electricityUtilitiesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Pump Nozzle Calibration & Repairs:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.maintenanceRepairsNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Bank Charges & POS Gateway Fees:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.bankChargesNpr)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Miscellaneous Station Expenses:</span>
                  <span className="font-data font-semibold text-text">{fmtRs(pnl.miscellaneousExpensesNpr)}</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-2 font-bold text-text">
                  <span>Total Operating Overheads:</span>
                  <span className="font-data text-error text-[13.5px]">-{fmtRs(pnl.totalOperatingExpensesNpr)}</span>
                </div>
              </div>

              {/* Net Profit Banner */}
              <div className="rounded-xl border border-accent/40 bg-accent/15 p-4 flex justify-between items-center text-[14px]">
                <div>
                  <strong className="text-text block">Net Station Profit ({pnl.periodBS}):</strong>
                  <span className="text-[11.5px] text-text-muted">Net margin of {pnl.profitMarginPct}% on gross turnover</span>
                </div>
                <span className="font-data font-bold text-accent text-[18px]">{fmtRs(pnl.netProfitNpr)}</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
