"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Search,
  Calendar,
  Layers,
  DollarSign,
  Building2,
} from "lucide-react";
import { type IrdPurchaseEntry } from "@/lib/ird";
import { getIrdPurchases } from "@/lib/mock/ird";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatCard } from "@/components/dashboard/StatCard";

export function IrdPurchaseRegisterView() {
  const [purchases] = useState<IrdPurchaseEntry[]>(() => getIrdPurchases());
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = purchases.filter((p) => {
    if (selectedMonth !== "ALL" && !p.dateBS.startsWith(selectedMonth)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchInv = p.invoiceNo.toLowerCase().includes(q);
      const matchSupplier = p.supplierName.toLowerCase().includes(q);
      const matchPan = p.supplierPan.toLowerCase().includes(q);
      if (!matchInv && !matchSupplier && !matchPan) return false;
    }
    return true;
  });

  const totalGross = filtered.reduce((sum, p) => sum + p.totalAmountNpr, 0);
  const totalTaxable = filtered.reduce((sum, p) => sum + p.taxableAmountNpr, 0);
  const totalInputVat = filtered.reduce((sum, p) => sum + p.vatAmountNpr, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Date (BS)",
      "NOC / Supplier Invoice No",
      "Supplier Name",
      "Supplier PAN",
      "Product Type",
      "Total Amount (NPR)",
      "Non-Taxable Amount (NPR)",
      "Taxable Amount (NPR)",
      "Input VAT 13% (NPR)",
    ];

    const rows = filtered.map((p) => [
      `"${p.dateBS}"`,
      `"${p.invoiceNo}"`,
      `"${p.supplierName}"`,
      `"${p.supplierPan}"`,
      `"${p.productType}"`,
      `"${p.totalAmountNpr}"`,
      `"${p.nonTaxableAmountNpr}"`,
      `"${p.taxableAmountNpr}"`,
      `"${p.vatAmountNpr}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ird_purchase_register_schedule_4_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Purchase Book / Register (खरिद खाता — अनुसूची ४)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory VAT purchase register prescribed under Rule 23(1) of VAT Rules, 2053 for NOC bulk deliveries and lubricant purchases.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Schedule 4
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Fuel Procurement (Gross)" value={fmtRs(totalGross)} icon={Layers} tone="accent" small />
        <StatCard label="Taxable Purchase Base" value={fmtRs(totalTaxable)} icon={FileSpreadsheet} tone="text" small />
        <StatCard label="Eligible Input VAT Claim (13%)" value={fmtRs(totalInputVat)} icon={DollarSign} tone="success" small />
        <StatCard label="NOC Depot Consignments" value={`${filtered.length} Tankers`} icon={Building2} tone="text" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, depot, or PAN..."
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

      {/* Official Schedule 4 Table */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surface-hi/60 px-4 py-2 text-center text-[12px] text-text-muted">
          कर अधिकृत समक्ष पेश गरिने आन्तरिक राजस्व विभाग स्वीकृत ढाँचा (अनुसूची ४ — खरिद खाता)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border bg-surface-hi font-medium text-text-muted whitespace-nowrap">
              <tr>
                <th className="p-3">मिति (BS)</th>
                <th className="p-3">आपूर्तिकर्ताको बीजक नं.</th>
                <th className="p-3">आपूर्तिकर्ताको नाम</th>
                <th className="p-3">स्थायी लेखा नं. (PAN)</th>
                <th className="p-3">प्रकार</th>
                <th className="p-3 text-right">जम्मा खरिद मूल्य (रु.)</th>
                <th className="p-3 text-right">करयोग्य खरिद मूल्य (रु.)</th>
                <th className="p-3 text-right">दाबी गर्न पाउने कर १३% (रु.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="p-3 font-data text-text-muted whitespace-nowrap">{p.dateBS}</td>
                  <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{p.invoiceNo}</td>
                  <td className="p-3 font-medium text-text">{p.supplierName}</td>
                  <td className="p-3 font-data text-text-muted">{p.supplierPan}</td>
                  <td className="p-3 font-data">
                    <span className="rounded bg-surface-hi px-2 py-0.5 text-[11px] font-medium text-text">
                      {p.productType}
                    </span>
                  </td>
                  <td className="p-3 font-data text-right font-semibold text-text whitespace-nowrap">
                    {fmtRs(p.totalAmountNpr)}
                  </td>
                  <td className="p-3 font-data text-right font-medium text-text whitespace-nowrap">
                    {fmtRs(p.taxableAmountNpr)}
                  </td>
                  <td className="p-3 font-data text-right font-bold text-success whitespace-nowrap">
                    {fmtRs(p.vatAmountNpr)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-border bg-surface-hi/80 font-bold text-[12.5px] whitespace-nowrap">
              <tr>
                <td colSpan={5} className="p-3 text-right text-text">
                  कुल जम्मा खरिद (Total Purchases Summary):
                </td>
                <td className="p-3 font-data text-right text-accent">{fmtRs(totalGross)}</td>
                <td className="p-3 font-data text-right text-text">{fmtRs(totalTaxable)}</td>
                <td className="p-3 font-data text-right text-success">{fmtRs(totalInputVat)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
