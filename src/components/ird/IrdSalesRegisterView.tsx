"use client";

import { useState } from "react";
import {
  BookText,
  Printer,
  Download,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { type IrdSalesEntry } from "@/lib/ird";
import { getIrdSales } from "@/lib/mock/ird";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

export function IrdSalesRegisterView() {
  const [sales] = useState<IrdSalesEntry[]>(() => getIrdSales());
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = sales.filter((s) => {
    if (selectedMonth !== "ALL" && !s.dateBS.startsWith(selectedMonth)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = s.invoiceNo.toLowerCase().includes(q);
      const matchName = s.customerName.toLowerCase().includes(q);
      const matchPan = s.customerPan.toLowerCase().includes(q);
      if (!matchInv && !matchName && !matchPan) return false;
    }
    return true;
  });

  const totalGross = filtered.reduce((sum, s) => sum + s.totalAmountNpr, 0);
  const totalTaxable = filtered.reduce((sum, s) => sum + s.taxableAmountNpr, 0);
  const totalVat = filtered.reduce((sum, s) => sum + s.vatAmountNpr, 0);
  const totalExempt = filtered.reduce((sum, s) => sum + s.nonTaxableAmountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Date (BS)",
      "Invoice No",
      "Buyer Name",
      "Buyer PAN",
      "Total Amount (NPR)",
      "Non-Taxable Amount (NPR)",
      "Export Amount (NPR)",
      "Taxable Amount (NPR)",
      "VAT Amount 13% (NPR)",
      "Payment Mode",
    ];

    const rows = filtered.map((s) => [
      `"${s.dateBS}"`,
      `"${s.invoiceNo}"`,
      `"${s.customerName}"`,
      `"${s.customerPan}"`,
      `"${s.totalAmountNpr}"`,
      `"${s.nonTaxableAmountNpr}"`,
      `"${s.exportAmountNpr}"`,
      `"${s.taxableAmountNpr}"`,
      `"${s.vatAmountNpr}"`,
      `"${s.paymentMode}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ird_sales_register_schedule_5_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <BookText size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Sales Book / Register (बिक्री खाता — अनुसूची ५)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory Value Added Tax (VAT) sales register prescribed under Rule 23(1) of VAT Rules, 2053.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Schedule 5
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Gross Sales Turnover" value={fmtRs(totalGross)} icon={TrendingUp} tone="accent" small />
        <StatCard label="Taxable Sales Base (13%)" value={fmtRs(totalTaxable)} icon={Receipt} tone="text" small />
        <StatCard label="Output VAT Collected (13%)" value={fmtRs(totalVat)} icon={DollarSign} tone="success" small />
        <StatCard label="Exempt / Non-Taxable Sales" value={fmtRs(totalExempt)} icon={Receipt} tone="text" small />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer, or PAN..."
            className="pl-8 text-[12px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-accent" />
          <span className="text-[12px] text-text-muted">Month (BS):</span>
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-[12px] w-auto py-1"
          >
            <option value="ALL">All Recorded Invoices</option>
            <option value="2083-05">Bhadra 2083 BS</option>
            <option value="2083-04">Shrawan 2083 BS</option>
          </Select>
        </div>
      </div>

      {/* Official Schedule 5 Table */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surface-hi/60 px-4 py-2 text-center text-[12px] text-text-muted">
          कर अधिकृत समक्ष पेश गरिने आन्तरिक राजस्व विभाग स्वीकृत ढाँचा (अनुसूची ५ — बिक्री खाता)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted whitespace-nowrap">
              <tr>
                <th className="p-3">मिति (BS)</th>
                <th className="p-3">बीजक नं.</th>
                <th className="p-3">खरिदकर्ताको नाम</th>
                <th className="p-3">स्थायी लेखा नं. (PAN)</th>
                <th className="p-3 text-right">जम्मा बिक्री (रु.)</th>
                <th className="p-3 text-right">कर छुट बिक्री (रु.)</th>
                <th className="p-3 text-right">करयोग्य बिक्री (रु.)</th>
                <th className="p-3 text-right">मूल्य अभिवृद्धि कर १३% (रु.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-data text-text-muted whitespace-nowrap">{s.dateBS}</td>
                  <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{s.invoiceNo}</td>
                  <td className="p-3 font-medium text-text">{s.customerName}</td>
                  <td className="p-3 font-data text-text-muted">{s.customerPan}</td>
                  <td className="p-3 font-data text-right font-semibold text-text whitespace-nowrap">
                    {fmtRs(s.totalAmountNpr)}
                  </td>
                  <td className="p-3 font-data text-right text-text-muted whitespace-nowrap">
                    {s.nonTaxableAmountNpr > 0 ? fmtRs(s.nonTaxableAmountNpr) : "—"}
                  </td>
                  <td className="p-3 font-data text-right font-medium text-text whitespace-nowrap">
                    {fmtRs(s.taxableAmountNpr)}
                  </td>
                  <td className="p-3 font-data text-right font-bold text-success whitespace-nowrap">
                    {fmtRs(s.vatAmountNpr)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi/80 font-bold text-[12.5px] whitespace-nowrap">
              <tr>
                <td colSpan={4} className="p-3 text-right text-text">
                  कुल जम्मा (Total Summary):
                </td>
                <td className="p-3 font-data text-right text-accent">{fmtRs(totalGross)}</td>
                <td className="p-3 font-data text-right text-text-muted">{fmtRs(totalExempt)}</td>
                <td className="p-3 font-data text-right text-text">{fmtRs(totalTaxable)}</td>
                <td className="p-3 font-data text-right text-success">{fmtRs(totalVat)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
