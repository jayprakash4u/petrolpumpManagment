"use client";

import { useState } from "react";
import {
  Boxes,
  Printer,
  Download,
  Fuel,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { MOCK_FISCAL_STOCK } from "@/lib/mock/auditor";
import type { FiscalStockRow } from "@/lib/auditor";

export function FiscalStockView() {
  const [stockRows] = useState<FiscalStockRow[]>(MOCK_FISCAL_STOCK);

  const totalOpeningValuation = stockRows.reduce((sum, s) => sum + s.openingValuationNpr, 0);
  const totalInwardCost = stockRows.reduce((sum, s) => sum + s.inwardCostNpr, 0);
  const totalSalesRevenue = stockRows.reduce((sum, s) => sum + s.meteredSalesRevenueNpr, 0);
  const totalClosingValuation = stockRows.reduce((sum, s) => sum + s.closingValuationNpr, 0);
  const totalCOGS = stockRows.reduce((sum, s) => sum + s.costOfGoodsSoldNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Product / Fuel Name",
      "Unit",
      "Opening Qty",
      "Opening Rate (NPR)",
      "Opening Valuation (NPR)",
      "Inward Purchases Qty",
      "Inward Purchases Cost (NPR)",
      "Metered Sales Outward Qty",
      "Sales Revenue (NPR)",
      "Transit Loss Allowance Qty",
      "Transit Loss Value (NPR)",
      "Physical Dip Variance Qty",
      "Closing Physical Qty",
      "Closing Valuation Rate (NPR)",
      "Closing Stock Valuation (NPR)",
      "Cost of Goods Sold COGS (NPR)",
    ];

    const rows = stockRows.map((s) => [
      `"${s.productName}"`,
      `"${s.unit}"`,
      `"${s.openingQty}"`,
      `"${s.openingRateNpr}"`,
      `"${s.openingValuationNpr}"`,
      `"${s.inwardPurchaseQty}"`,
      `"${s.inwardCostNpr}"`,
      `"${s.meteredSalesQty}"`,
      `"${s.meteredSalesRevenueNpr}"`,
      `"${s.transitLossAllowanceQty}"`,
      `"${s.transitLossValueNpr}"`,
      `"${s.dipShortageQty}"`,
      `"${s.closingPhysicalQty}"`,
      `"${s.closingValuationRateNpr}"`,
      `"${s.closingValuationNpr}"`,
      `"${s.costOfGoodsSoldNpr}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `fiscal_year_stock_valuation_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <Boxes size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Fiscal Year Stock Valuation Schedule (आर्थिक वर्षान्त मौज्दात मूल्याङ्कन)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Reconciled quantitative inventory movement and year-end valuation under Nepal Accounting Standard (NAS 2 - Inventories).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Certificate
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Opening Stock Value"
          value={fmtRs(totalOpeningValuation)}
          icon={Boxes}
          tone="text"
          small
        />
        <StatCard
          label="Inward Purchases Cost"
          value={fmtRs(totalInwardCost)}
          icon={Fuel}
          tone="accent"
          small
        />
        <StatCard
          label="Metered Sales Turnover"
          value={fmtRs(totalSalesRevenue)}
          icon={Boxes}
          tone="text"
          small
        />
        <StatCard
          label="Closing Stock Asset Value"
          value={fmtRs(totalClosingValuation)}
          icon={CheckCircle2}
          tone="success"
          small
        />
        <StatCard
          label="Cost of Goods Sold (COGS)"
          value={fmtRs(totalCOGS)}
          icon={TrendingDown}
          tone="accent"
          small
        />
      </div>

      {/* Detailed Stock Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Product / Fuel</th>
                <th className="px-3 py-3 text-right">Opening Qty</th>
                <th className="px-3 py-3 text-right">Inward (NOC)</th>
                <th className="px-3 py-3 text-right">Sales Outward</th>
                <th className="px-3 py-3 text-right text-text-muted">Transit Loss</th>
                <th className="px-3 py-3 text-right text-accent font-bold">Closing Physical Dip</th>
                <th className="px-3 py-3 text-right">Valuation Rate</th>
                <th className="px-3 py-3 text-right text-success font-bold">Closing Valuation</th>
                <th className="px-4 py-3 text-right">Cost of Goods Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {stockRows.map((s) => (
                <tr key={s.fuelType} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-body">
                    <div className="font-semibold text-text">{s.productName}</div>
                    <div className="text-[11px] text-text-muted">
                      Type: {s.fuelType} · Unit: {s.unit}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {s.openingQty.toLocaleString()} {s.unit}
                    <div className="text-[10.5px] text-text-muted/80">{fmtRs(s.openingValuationNpr)}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-text font-medium">
                    {s.inwardPurchaseQty.toLocaleString()} {s.unit}
                    <div className="text-[10.5px] text-text-muted/80">{fmtRs(s.inwardCostNpr)}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-text">
                    {s.meteredSalesQty.toLocaleString()} {s.unit}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {s.transitLossAllowanceQty > 0 ? `${s.transitLossAllowanceQty} ${s.unit}` : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-accent">
                    {s.closingPhysicalQty.toLocaleString()} {s.unit}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    Rs {s.closingValuationRateNpr.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-success">
                    {fmtRs(s.closingValuationNpr)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-text">
                    {fmtRs(s.costOfGoodsSoldNpr)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi font-bold text-text">
              <tr>
                <td className="px-4 py-3 font-display">Grand Total</td>
                <td className="px-3 py-3 text-right font-data text-text-muted">{fmtRs(totalOpeningValuation)}</td>
                <td className="px-3 py-3 text-right font-data text-accent">{fmtRs(totalInwardCost)}</td>
                <td className="px-3 py-3 text-right font-data">{fmtRs(totalSalesRevenue)}</td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3 text-right font-data text-success">{fmtRs(totalClosingValuation)}</td>
                <td className="px-4 py-3 text-right font-data text-text">{fmtRs(totalCOGS)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Stock Dip Certification Sign-Off Card */}
      <div className="rounded-xl border border-border bg-surface p-5 text-[12.5px]">
        <div className="flex items-center gap-2 font-semibold text-text text-[13.5px] mb-2">
          <ShieldCheck size={18} className="text-success" /> Physical Stock Verification & Dip Certification
        </div>
        <p className="text-text-muted leading-relaxed">
          The closing stock of petroleum products (Petrol MS, Diesel HSD, CNG, and Lubricants) was physically verified via underground storage tank dip measurements on the closing date (Ashadh 31, 2083 BS) in the presence of the Station Manager and the Statutory Auditor. Transit decanting variance was found to be within standard Nepal Oil Corporation (NOC) dealer tolerance limits (≤ 0.20%). Valuation has been computed at the lower of weighted average cost or net realizable value (NRV) in compliance with <strong>NAS 2 (Inventories)</strong>.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-border text-[11.5px] text-text-muted">
          <div>
            <div className="font-semibold text-text">Dip Checked By:</div>
            <div>Bimal Gautam (Station Operations In-Charge)</div>
            <div>Shree Pashupati Petroleum Center</div>
          </div>
          <div className="sm:text-right">
            <div className="font-semibold text-text">Audited & Certified By:</div>
            <div>CA. Pradeep Sharma, FCA (FCA-1928)</div>
            <div>Sharma & Associates, Chartered Accountants</div>
          </div>
        </div>
      </div>
    </div>
  );
}
