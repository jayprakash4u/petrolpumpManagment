"use client";

import { useState } from "react";
import { Printer, X, CheckCircle2 } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";

interface PrintableSaleItem {
  id: string;
  receiptNo: number;
  fuel: string;
  liters: any;
  ratePerL: any;
  totalAmount: any;
  paymentMethod: string;
  createdAt: Date | string;
  customerName?: string | null;
  soldByName: string;
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className={"font-data " + (strong ? "text-[15px] font-semibold text-accent" : "text-[13px] text-text")}>
        {value}
      </span>
    </div>
  );
}

export function PrintReceiptModal({
  sale,
  onClose,
}: {
  sale: PrintableSaleItem;
  onClose: () => void;
}) {
  const fuelLabel = FUEL_LABEL[sale.fuel as FuelId] || sale.fuel;
  const dateStr =
    typeof sale.createdAt === "string"
      ? new Date(sale.createdAt).toLocaleString()
      : sale.createdAt.toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-hi px-4 py-3">
          <div className="flex items-center gap-2 text-text font-semibold text-[14px]">
            <Printer size={16} className="text-accent" />
            <span>Print Receipt #{sale.receiptNo}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-white/10 hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-4">
          <div className="print-area rounded-xl border border-border bg-bg p-4 print:border-0 print:bg-white print:text-black">
            <div className="mb-3 border-b border-dashed border-border pb-2 text-center">
              <div className="font-display text-[15px] font-bold text-text print:text-black">
                SHREE PASHUPATI PETROLEUM
              </div>
              <div className="font-data text-[11px] text-text-muted">
                RECEIPT #{sale.receiptNo}
              </div>
              <div className="font-data text-[10.5px] text-text-muted">{dateStr}</div>
            </div>

            <Line label="Fuel Product" value={fuelLabel} />
            <Line label="Unit Rate" value={`Rs ${Number(sale.ratePerL).toFixed(2)}/L`} />
            <Line label="Volume" value={fmtL(sale.liters)} />
            <div className="my-1 border-t border-dashed border-border" />
            <Line label="Total Amount" value={fmtRs(sale.totalAmount)} strong />
            <Line label="Payment Mode" value={sale.paymentMethod} />
            {sale.customerName && <Line label="Billed to" value={sale.customerName} />}

            <div className="mt-3 border-t border-dashed border-border pt-2 text-center font-data text-[10.5px] text-text-muted">
              Served by {sale.soldByName} · Thank you!
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-surface-hi px-4 py-3">
          <GhostButton onClick={onClose} className="text-[12px]">
            Close
          </GhostButton>
          <PrimaryButton
            onClick={() => window.print()}
            className="text-[12px] px-3.5 py-1.5"
            autoFocus
          >
            <Printer size={14} /> Print Slip
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
