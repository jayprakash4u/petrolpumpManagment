"use client";

import { Printer, CheckCircle2 } from "lucide-react";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { GhostButton } from "@/components/ui/Button";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className={"font-data " + (strong ? "text-[15px] font-semibold text-accent" : "text-[13px] text-text")}>{value}</span>
    </div>
  );
}

function formatPaymentDisplay(receipt: ReceiptDTO): string {
  if (receipt.paymentMethod === "ONLINE") {
    const provider = receipt.onlineProvider ? receipt.onlineProvider.replace("_", " ") : "QR / Wallet";
    return receipt.paymentRef ? `${provider} (Ref: ${receipt.paymentRef})` : `${provider} QR`;
  }
  if (receipt.paymentMethod === "CARD") {
    return receipt.paymentRef ? `Card / POS (${receipt.paymentRef})` : "Card / POS";
  }
  if (receipt.paymentMethod === "CREDIT") {
    return "Credit Account";
  }
  return "Cash";
}

/**
 * Shown after a successful sale. The `print-area` class is what the
 * @media print block in globals.css keys off — hitting Print renders just
 * this slip, not the whole dashboard chrome around it.
 */
export function ReceiptCard({ receipt }: { receipt: ReceiptDTO }) {
  return (
    <div className="animate-fade-in mt-4 rounded-xl border border-success/30 bg-success/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-success">
        <CheckCircle2 size={16} />
        <span className="font-display text-[13.5px] font-semibold">Sale recorded</span>
        <GhostButton
          type="button"
          onClick={() => window.print()}
          className="ml-auto"
          aria-label="Print receipt"
        >
          <Printer size={14} />
          Print
        </GhostButton>
      </div>

      <div className="print-area rounded-lg border border-border bg-surface p-4 print:border-0 print:bg-white print:text-black">
        <div className="mb-3 border-b border-dashed border-border pb-2 text-center">
          <div className="font-display text-[15px] font-bold text-text print:text-black">{receipt.stationName}</div>
          <div className="font-data text-[11px] text-text-muted">RECEIPT #{receipt.receiptNo}</div>
          <div className="font-data text-[10.5px] text-text-muted">{receipt.at}</div>
        </div>

        <Line label="Fuel" value={receipt.fuelLabel} />
        <Line label="Rate" value={receipt.rate + "/L"} />
        <Line label="Volume" value={receipt.liters} />
        <div className="my-1 border-t border-dashed border-border" />
        <Line label="Total" value={receipt.total} strong />
        <Line label="Payment Mode" value={formatPaymentDisplay(receipt)} />
        {receipt.customerName && <Line label="Billed to" value={receipt.customerName} />}
        {receipt.changeDue && <Line label="Change Returned" value={receipt.changeDue} />}

        <div className="mt-3 border-t border-dashed border-border pt-2 text-center font-data text-[10.5px] text-text-muted">
          Served by {receipt.soldBy} · Thank you
        </div>
      </div>
    </div>
  );
}
