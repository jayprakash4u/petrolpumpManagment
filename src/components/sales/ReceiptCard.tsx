"use client";

import { Printer, CheckCircle2 } from "lucide-react";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { PrimaryButton } from "@/components/ui/Button";
import { TaxInvoice } from "./TaxInvoice";

/**
 * Confirmation banner + the canonical printable tax invoice, shown right
 * after a sale is recorded.
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

      <TaxInvoice receipt={receipt} />
    </div>
  );
}
