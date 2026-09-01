"use client";

import { Printer, CheckCircle2 } from "lucide-react";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { PrimaryButton } from "@/components/ui/Button";
import { TaxInvoice } from "./TaxInvoice";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";
import { clsx } from "clsx";

/**
 * Confirmation banner + the canonical printable tax invoice, shown right
 * after a sale is recorded.
 */
export function ReceiptCard({
  receipt,
  business,
  settings,
}: {
  receipt: ReceiptDTO;
  business?: Partial<MergedStationInvoiceConfig> | null;
  settings?: Partial<MergedStationInvoiceConfig> | null;
}) {
  const paper = settings?.paperSize || "A4";

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
            Print Tax Invoice ({paper})
          </PrimaryButton>
        </div>
      </div>

      <div
        className={clsx(
          "transition-all",
          paper === "80MM" && "max-w-[360px] mx-auto",
          paper === "58MM" && "max-w-[280px] mx-auto",
          paper === "A5" && "max-w-xl mx-auto",
          paper === "A4" && "w-full max-w-3xl mx-auto"
        )}
      >
        <TaxInvoice
          receipt={receipt}
          business={business || { name: receipt.stationName }}
          settings={settings}
        />
      </div>
    </div>
  );
}
