"use client";

import { useState } from "react";
import {
  Boxes,
  Printer,
  Download,
  Fuel,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Layers,
} from "lucide-react";
import { type IrdQuantitativeStockRow } from "@/lib/ird";
import { getIrdQuantitativeStock } from "@/lib/mock/ird";
import { fmtRs, fmtL } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { StatCard } from "@/components/dashboard/StatCard";

export function IrdQuantitativeStockView() {
  const [stock] = useState<IrdQuantitativeStockRow[]>(() => getIrdQuantitativeStock());

  const totalClosingValuation = stock.reduce((sum, s) => sum + s.closingValuationNpr, 0);
  const totalFuelLitersInTanks = stock
    .filter((s) => s.unit === "Ltr")
    .reduce((sum, s) => sum + s.closingStock, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Item Code",
      "Item Name",
      "Unit",
      "Opening Stock",
      "Inward Purchases",
      "Outward Sales",
      "Transit / Decanting Loss",
      "Closing Physical Stock",
      "Rate per Unit (NPR)",
      "Stock Valuation (NPR)",
    ];

    const rows = stock.map((s) => [
      `"${s.itemCode}"`,
      `"${s.itemName}"`,
      `"${s.unit}"`,
      `"${s.openingStock}"`,
      `"${s.purchaseInward}"`,
      `"${s.salesOutward}"`,
      `"${s.transitLoss}"`,
      `"${s.closingStock}"`,
      `"${s.ratePerUnitNpr}"`,
      `"${s.closingValuationNpr}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quantitative_stock_report_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <Boxes size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Quantitative Stock Register (मात्रात्मक मौज्दात विवरण)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory stock movement statement required for petroleum goods dealers reconciling tank dip levels and pump meter readings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Stock Book
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Closing Stock Valuation" value={fmtRs(totalClosingValuation)} icon={Layers} tone="accent" small />
        <StatCard label="Total Fuel in Underground Tanks" value={fmtL(totalFuelLitersInTanks)} icon={Fuel} tone="text" />
        <StatCard label="Reconciliation Parity" value="100% Matched" icon={CheckCircle2} tone="success" />
        <StatCard label="Active Stock SKUs" value={`${stock.length} Products`} icon={Boxes} tone="text" />
      </div>

      {/* Quantitative Stock Table */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surface-hi/60 px-4 py-2 text-center text-[12px] text-text-muted">
          कर अधिकृत समक्ष पेश गरिने आन्तरिक राजस्व विभाग स्वीकृत ढाँचा (मात्रात्मक मौज्दात विवरण)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted whitespace-nowrap">
              <tr>
                <th className="p-3">वस्तुको नाम (Item Name)</th>
                <th className="p-3">इकाई (Unit)</th>
                <th className="p-3 text-right">सुरु मौज्दात (Opening)</th>
                <th className="p-3 text-right">खरिद पैठारी (Inward)</th>
                <th className="p-3 text-right">बिक्री निकासी (Outward)</th>
                <th className="p-3 text-right">घटी / क्षति (Loss)</th>
                <th className="p-3 text-right">अन्तिम मौज्दात (Closing)</th>
                <th className="p-3 text-right">दर रु. (Rate)</th>
                <th className="p-3 text-right">अन्तिम मूल्य (Valuation)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stock.map((item) => (
                <tr key={item.itemCode} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-semibold text-text whitespace-nowrap">
                    {item.itemName}
                    <div className="text-[10.5px] font-data text-text-muted font-normal">Code: {item.itemCode}</div>
                  </td>
                  <td className="p-3 font-data text-text-muted">{item.unit}</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">{item.openingStock.toLocaleString()}</td>
                  <td className="p-3 font-data text-right font-medium text-text whitespace-nowrap">+{item.purchaseInward.toLocaleString()}</td>
                  <td className="p-3 font-data text-right text-text whitespace-nowrap">-{item.salesOutward.toLocaleString()}</td>
                  <td className="p-3 font-data text-right text-error whitespace-nowrap">
                    {item.transitLoss > 0 ? `-${item.transitLoss}` : "0"}
                  </td>
                  <td className="p-3 font-data text-right font-bold text-accent whitespace-nowrap">
                    {item.closingStock.toLocaleString()} {item.unit}
                  </td>
                  <td className="p-3 font-data text-right text-text-muted whitespace-nowrap">{fmtRs(item.ratePerUnitNpr)}</td>
                  <td className="p-3 font-data text-right font-bold text-text whitespace-nowrap">
                    {fmtRs(item.closingValuationNpr)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi/80 font-bold text-[12.5px] whitespace-nowrap">
              <tr>
                <td colSpan={8} className="p-3 text-right text-text">
                  कुल अन्तिम मौज्दात सम्पत्ति (Total Physical Stock Valuation):
                </td>
                <td className="p-3 font-data text-right text-accent text-[13.5px]">
                  {fmtRs(totalClosingValuation)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
