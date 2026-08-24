"use client";

import { useState } from "react";
import {
  BarChart3,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  Fuel,
  DollarSign,
} from "lucide-react";
import { type IrdMonthlySalesRow } from "@/lib/ird";
import { getIrdMonthlySales } from "@/lib/mock/ird";
import { fmtRs, fmtL } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";

export function IrdMonthlySummaryView() {
  const [monthlyData] = useState<IrdMonthlySalesRow[]>(() => getIrdMonthlySales());

  const totalPetrol = monthlyData.reduce((sum, m) => sum + m.petrolLiters, 0);
  const totalDiesel = monthlyData.reduce((sum, m) => sum + m.dieselLiters, 0);
  const totalGrossRevenue = monthlyData.reduce((sum, m) => sum + m.grossSalesNpr, 0);
  const totalVat = monthlyData.reduce((sum, m) => sum + m.vatAmountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Month (BS)",
      "Petrol MS (Ltr)",
      "Diesel HSD (Ltr)",
      "CNG (Kg)",
      "Lubes (Units)",
      "Gross Turnover (NPR)",
      "Taxable Base (NPR)",
      "Output VAT 13% (NPR)",
    ];

    const rows = monthlyData.map((m) => [
      `"${m.monthBS}"`,
      `"${m.petrolLiters}"`,
      `"${m.dieselLiters}"`,
      `"${m.cngKg}"`,
      `"${m.lubesUnits}"`,
      `"${m.grossSalesNpr}"`,
      `"${m.taxableSalesNpr}"`,
      `"${m.vatAmountNpr}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `monthly_sales_summary_bs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Monthly Sales Summary (मासिक बिक्री सारांश — आ.व. २०८३/८४)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Monthly progression of fuel volume dispensed and VAT tax liability across the Nepali Bikram Sambat fiscal year.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Summary
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="YTD Petrol Dispensed" value={fmtL(totalPetrol)} icon={Fuel} tone="accent" />
        <StatCard label="YTD Diesel Dispensed" value={fmtL(totalDiesel)} icon={Fuel} tone="text" />
        <StatCard label="Cumulative Sales Turnover" value={fmtRs(totalGrossRevenue)} icon={TrendingUp} tone="success" small />
        <StatCard label="Cumulative Output VAT (13%)" value={fmtRs(totalVat)} icon={DollarSign} tone="accent" small />
      </div>

      {/* Monthly Summary Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
              <tr>
                <th className="p-3">महिना (BS Month)</th>
                <th className="p-3 text-right">Petrol MS (Ltr)</th>
                <th className="p-3 text-right">Diesel HSD (Ltr)</th>
                <th className="p-3 text-right">CNG (Kg)</th>
                <th className="p-3 text-right">Lubes (Units)</th>
                <th className="p-3 text-right">Gross Sales (NPR)</th>
                <th className="p-3 text-right">Taxable Turnover</th>
                <th className="p-3 text-right">Output VAT (13%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthlyData.map((m) => (
                <tr key={m.monthIndex} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-semibold text-text whitespace-nowrap">{m.monthBS}</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">{fmtL(m.petrolLiters)}</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">{fmtL(m.dieselLiters)}</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">{m.cngKg.toLocaleString()} kg</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">{m.lubesUnits} units</td>
                  <td className="p-3 font-data text-right font-semibold text-text whitespace-nowrap">
                    {fmtRs(m.grossSalesNpr)}
                  </td>
                  <td className="p-3 font-data text-right text-text-muted whitespace-nowrap">
                    {fmtRs(m.taxableSalesNpr)}
                  </td>
                  <td className="p-3 font-data text-right font-bold text-success whitespace-nowrap">
                    {fmtRs(m.vatAmountNpr)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi/80 font-bold text-[12.5px] whitespace-nowrap">
              <tr>
                <td className="p-3 text-text">वर्षभरिको कुल जम्मा (YTD Total):</td>
                <td className="p-3 font-data text-right text-accent">{fmtL(totalPetrol)}</td>
                <td className="p-3 font-data text-right text-accent">{fmtL(totalDiesel)}</td>
                <td className="p-3 font-data text-right text-text">
                  {monthlyData.reduce((s, m) => s + m.cngKg, 0).toLocaleString()} kg
                </td>
                <td className="p-3 font-data text-right text-text">
                  {monthlyData.reduce((s, m) => s + m.lubesUnits, 0)} units
                </td>
                <td className="p-3 font-data text-right text-accent">{fmtRs(totalGrossRevenue)}</td>
                <td className="p-3 font-data text-right text-text">
                  {fmtRs(monthlyData.reduce((s, m) => s + m.taxableSalesNpr, 0))}
                </td>
                <td className="p-3 font-data text-right text-success">{fmtRs(totalVat)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
