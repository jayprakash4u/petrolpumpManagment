"use client";

import { useState } from "react";
import {
  FileCheck2,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { calculateVatReturn } from "@/lib/ird";
import {
  getIrdSales,
  getIrdPurchases,
  getIrdSalesReturns,
  getIrdPurchaseReturns,
} from "@/lib/mock/ird";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

export function IrdVatReturnView() {
  const [periodBS, setPeriodBS] = useState("Bhadra 2083");
  const sales = getIrdSales();
  const purchases = getIrdPurchases();
  const salesReturns = getIrdSalesReturns();
  const purchaseReturns = getIrdPurchaseReturns();

  const vatReturn = calculateVatReturn({
    sales,
    purchases,
    salesReturns,
    purchaseReturns,
    fiscalYear: "2083/84",
    periodBS,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <FileCheck2 size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Periodic VAT Return (मूल्य अभिवृद्धि कर विवरण — अनुसूची १०)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Official monthly VAT declaration filed with the Inland Revenue Department (IRD) under Section 18 of the VAT Act, 2052.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-text-muted">Tax Period:</span>
            <Select
              value={periodBS}
              onChange={(e) => setPeriodBS(e.target.value)}
              className="text-[12px] w-auto py-1"
            >
              <option value="Bhadra 2083">Bhadra 2083 BS</option>
              <option value="Shrawan 2083">Shrawan 2083 BS</option>
              <option value="Ashadh 2083">Ashadh 2083 BS</option>
            </Select>
          </div>

          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Official Return
          </GhostButton>
        </div>
      </div>

      {/* Net Tax Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 ${
          vatReturn.isCreditCarryForward
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-success/40 bg-success/10 text-success"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface shadow-xs">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[12px] font-medium text-text-muted block uppercase tracking-wider">
              {vatReturn.isCreditCarryForward
                ? "Excess Input Tax (आगामी महिनामा मिलान हुने कर - Credit Carry Forward)"
                : "Net Output VAT Payable to IRD (दाखिला गर्नुपर्ने खुद मूल्य अभिवृद्धि कर)"}
            </span>
            <div className="font-data text-[24px] font-bold mt-0.5">
              {fmtRs(vatReturn.netVatPayableNpr)}
            </div>
          </div>
        </div>

        <Badge tone={vatReturn.isCreditCarryForward ? "accent" : "success"} className="text-[13px] px-3 py-1">
          {vatReturn.isCreditCarryForward ? "Excess Tax Credit" : "Tax Payable (दाखिला)"}
        </Badge>
      </div>

      {/* Official Schedule 10 Document Card */}
      <Card className="p-6 space-y-6">
        {/* Document Header */}
        <div className="border-b border-border pb-4 text-center space-y-1">
          <div className="text-[13px] font-semibold text-text-muted uppercase">नेपाल सरकार | अर्थ मन्त्रालय</div>
          <h3 className="font-display text-[18px] font-bold text-text">आन्तरिक राजस्व विभाग (Inland Revenue Department)</h3>
          <div className="text-[14px] font-bold text-accent">मूल्य अभिवृद्धि कर विवरण (अनुसूची १०)</div>
          <div className="text-[12px] text-text-muted">
            करदाताको नाम: <strong>Shree Petroleum</strong> · PAN: <strong>601928374</strong> · कर अवधि: <strong>{periodBS}</strong> (आ.व. {vatReturn.fiscalYear})
          </div>
        </div>

        {/* Section A: Sales */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-[14.5px] text-text flex items-center gap-2 border-b border-border pb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              क
            </span>
            बिक्री सम्बन्धी विवरण (Sales Turnover Details)
          </h4>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">१. करयोग्य बिक्री (Taxable Sales @ 13%):</span>
              <span className="font-data font-semibold text-text">{fmtRs(vatReturn.taxableSalesNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">२. कर छुट बिक्री (Exempt / Non-Taxable Sales):</span>
              <span className="font-data text-text">{fmtRs(vatReturn.exemptSalesNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">३. निकासी बिक्री (Export Sales @ 0%):</span>
              <span className="font-data text-text">{fmtRs(vatReturn.exportSalesNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">४. घटाउने: बिक्री फिर्ता (Sales Returns - Credit Notes):</span>
              <span className="font-data text-error">-{fmtRs(vatReturn.salesReturnTaxableNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/80 py-1.5 font-bold bg-surface-hi/40 px-2 rounded">
              <span className="text-text">जम्मा खुद करयोग्य बिक्री (Net Taxable Turnover):</span>
              <span className="font-data text-accent">{fmtRs(vatReturn.netTaxableSalesNpr)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-[13px] bg-accent/10 px-2 rounded text-accent">
              <span>५. संकलित मूल्य अभिवृद्धि कर (Output VAT Collected @ 13%):</span>
              <span className="font-data">{fmtRs(vatReturn.outputVatCollectedNpr)}</span>
            </div>
          </div>
        </div>

        {/* Section B: Purchases */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-[14.5px] text-text flex items-center gap-2 border-b border-border pb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              ख
            </span>
            खरिद तथा पैठारी सम्बन्धी विवरण (Procurement & Import Details)
          </h4>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">६. स्वदेशी करयोग्य खरिद (NOC Fuel & Lubricants Taxable Purchases):</span>
              <span className="font-data font-semibold text-text">{fmtRs(vatReturn.taxablePurchasesNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">७. कर छुट खरिद (Exempt Procurement):</span>
              <span className="font-data text-text">{fmtRs(vatReturn.exemptPurchasesNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 py-1">
              <span className="text-text-muted">८. घटाउने: खरिद फिर्ता (Purchase Returns - Debit Notes):</span>
              <span className="font-data text-error">-{fmtRs(vatReturn.purchaseReturnTaxableNpr)}</span>
            </div>
            <div className="flex justify-between border-b border-border/80 py-1.5 font-bold bg-surface-hi/40 px-2 rounded">
              <span className="text-text">जम्मा खुद करयोग्य खरिद (Net Taxable Purchases):</span>
              <span className="font-data text-text">{fmtRs(vatReturn.netTaxablePurchasesNpr)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold text-[13px] bg-surface-hi px-2 rounded text-text">
              <span>९. दाबी गर्न पाउने खरिद कर (Eligible Input VAT Claim @ 13%):</span>
              <span className="font-data text-success">{fmtRs(vatReturn.inputVatPaidNpr)}</span>
            </div>
          </div>
        </div>

        {/* Section C: Net Tax Calculation */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-[14.5px] text-text flex items-center gap-2 border-b border-border pb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              ग
            </span>
            कर मिलान तथा दाखिला हिसाब (Tax Reconciliation & Settlement)
          </h4>

          <div className="rounded-xl border border-border bg-bg p-4 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-muted">संकलित कर (Output Tax):</span>
              <span className="font-data font-semibold text-text">{fmtRs(vatReturn.outputVatCollectedNpr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">कट्टा गर्न पाउने कर (Input Tax):</span>
              <span className="font-data font-semibold text-text">-{fmtRs(vatReturn.inputVatPaidNpr)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-[14px]">
              <span className="text-text">
                {vatReturn.isCreditCarryForward
                  ? "आगामी महिनामा मिलान हुने बाँकी कर (Excess Credit):"
                  : "आन्तरिक राजस्व कार्यालयमा दाखिला गर्नुपर्ने कर (Net Tax Payable):"}
              </span>
              <span className="font-data text-accent text-[16px]">{fmtRs(vatReturn.netVatPayableNpr)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11.5px] text-text-muted border-t border-border mt-4">
          <div className="border-t border-dashed border-border pt-1">
            करदाताको अख्तियार प्राप्त प्रतिनिधीको दस्तखत
          </div>
          <div className="border-t border-dashed border-border pt-1">
            आन्तरिक राजस्व कार्यालय दर्ता / प्रमाणीकरण छाप
          </div>
        </div>
      </Card>
    </div>
  );
}
