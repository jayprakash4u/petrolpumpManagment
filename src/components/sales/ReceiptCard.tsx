"use client";

import { Printer, CheckCircle2, FileText, Download, X } from "lucide-react";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";

function formatPaymentDisplay(receipt: ReceiptDTO): string {
  if (receipt.paymentMethod === "ONLINE") {
    const provider = receipt.onlineProvider ? receipt.onlineProvider.replace("_", " ") : "QR / Wallet";
    return receipt.paymentRef ? `${provider} (Ref: ${receipt.paymentRef})` : `${provider} QR`;
  }
  if (receipt.paymentMethod === "CARD") {
    return receipt.paymentRef ? `Card / POS (${receipt.paymentRef})` : "Card / POS";
  }
  if (receipt.paymentMethod === "CREDIT") {
    return `Credit Account (${receipt.customerName || "Customer"})`;
  }
  return "Cash";
}

/**
 * Enterprise Tax Invoice / Bill Print Card shown after a successful sale.
 */
export function ReceiptCard({ receipt }: { receipt: ReceiptDTO }) {
  return (
    <div className="animate-fade-in mt-5 rounded-2xl border border-success/30 bg-success/5 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-success/20 pb-3">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 size={18} />
          <span className="font-display text-sm font-bold">
            Sale Recorded & Invoice Generated: {receipt.billNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton
            type="button"
            onClick={() => window.print()}
            className="text-xs px-3.5 py-1.5 font-bold"
            aria-label="Print tax invoice"
          >
            <Printer size={13} />
            Print Tax Invoice
          </PrimaryButton>
        </div>
      </div>

      {/* Printable Tax Invoice Slip (80mm Thermal / A4 POS Formatted) */}
      <div className="print-area rounded-xl border border-border bg-surface p-5 text-xs font-mono text-text shadow-xs print:border-0 print:bg-white print:text-black print:p-0">
        {/* 1. Station Legal Header */}
        <div className="border-b border-dashed border-border pb-3 text-center space-y-1">
          <div className="font-display text-base font-bold tracking-tight text-text print:text-black">
            {receipt.stationName}
          </div>
          <div className="text-[11px] font-semibold text-text-muted print:text-gray-600">
            TAX INVOICE / कर बीजक
          </div>
          <div className="text-[10.5px] text-text-muted print:text-gray-500">
            PAN / VAT: 601234567 · Kathmandu, Nepal
          </div>
        </div>

        {/* 2. Invoice Meta & Customer Header */}
        <div className="grid grid-cols-2 gap-2 py-3 border-b border-dashed border-border text-[11px]">
          <div>
            <span className="text-text-muted block text-[10px]">Invoice No:</span>
            <strong className="text-accent print:text-black">{receipt.billNumber} (#{receipt.receiptNo})</strong>
          </div>
          <div className="text-right">
            <span className="text-text-muted block text-[10px]">Date (BS) & Time:</span>
            <span>{receipt.at}</span>
          </div>

          <div>
            <span className="text-text-muted block text-[10px]">Customer / Buyer:</span>
            <strong className="text-text print:text-black">{receipt.customerName || "Walk-In Retail Customer"}</strong>
          </div>
          <div className="text-right">
            <span className="text-text-muted block text-[10px]">Vehicle Plate:</span>
            <strong className="text-text print:text-black">{receipt.vehicleNo || "N/A"}</strong>
          </div>
        </div>

        {/* 3. Items Table */}
        <div className="py-3 border-b border-dashed border-border">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-border/80 text-[10px] text-text-muted font-bold uppercase">
                <th className="pb-1.5">Product</th>
                <th className="pb-1.5 text-right">Qty</th>
                <th className="pb-1.5 text-right">Rate</th>
                <th className="pb-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr>
                <td className="py-2 font-bold">{receipt.fuelLabel}</td>
                <td className="py-2 text-right">{receipt.liters}</td>
                <td className="py-2 text-right">{receipt.rate}</td>
                <td className="py-2 text-right font-bold">{receipt.total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Financial & Tax Breakdown */}
        <div className="py-3 space-y-1.5 border-b border-dashed border-border text-[11.5px]">
          {receipt.subtotal && (
            <div className="flex justify-between text-text-muted">
              <span>Taxable Amount (करयोग्य रकम):</span>
              <span>{receipt.subtotal}</span>
            </div>
          )}

          {receipt.vatAmount && (
            <div className="flex justify-between text-text-muted">
              <span>13% VAT (१३% भ्याट):</span>
              <span>{receipt.vatAmount}</span>
            </div>
          )}

          {receipt.discount && (
            <div className="flex justify-between text-text-muted">
              <span>Discount (छुट):</span>
              <span>-{receipt.discount}</span>
            </div>
          )}

          <div className="flex justify-between pt-1 border-t border-border font-bold text-[13px] text-text print:text-black">
            <span>Grand Total (जम्मा रकम):</span>
            <span className="text-accent print:text-black">{receipt.total}</span>
          </div>

          <div className="flex justify-between pt-1 text-[11px]">
            <span className="text-text-muted">Payment Mode:</span>
            <span className="font-semibold">{formatPaymentDisplay(receipt)}</span>
          </div>

          {receipt.changeDue && (
            <div className="flex justify-between text-[11px] text-success">
              <span>Change Returned:</span>
              <span>{receipt.changeDue}</span>
            </div>
          )}
        </div>

        {/* 5. Footer & Attendant */}
        <div className="pt-3 text-center space-y-1 text-[10px] text-text-muted print:text-gray-500">
          <div>Served by {receipt.soldBy} · System Generated Invoice</div>
          <div className="font-semibold">Thank you for fueling with us! Have a safe journey.</div>
        </div>
      </div>
    </div>
  );
}
