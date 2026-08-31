"use client";

import { Printer, X } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { fmtRs, fmtL, fmtRate } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import type { ReceiptDTO } from "@/lib/actions/sales";
import { TaxInvoice } from "./TaxInvoice";

interface PrintableSaleItem {
  id: string;
  receiptNo: number;
  billNumber: string;
  fuel: string;
  liters: any;
  ratePerL: any;
  totalAmount: any;
  paymentMethod: string;
  createdAt: Date | string;
  customerName?: string | null;
  vehicleNo?: string | null;
  soldByName: string;
}

/** Reconstruct the same ReceiptDTO shape TaxInvoice renders elsewhere, from
 *  a historical sale record. Fields that were never persisted for older
 *  sales (discount, online/card reference, cash change) are simply absent —
 *  the invoice layout already treats them as optional. */
function toReceiptDTO(sale: PrintableSaleItem, stationName: string): ReceiptDTO {
  const total = Number(sale.totalAmount);
  const taxable = total / 1.13;
  const vat = total - taxable;
  const createdAt = typeof sale.createdAt === "string" ? new Date(sale.createdAt) : sale.createdAt;

  return {
    receiptNo: sale.receiptNo,
    billNumber: sale.billNumber,
    stationName,
    fuelLabel: FUEL_LABEL[sale.fuel as FuelId] || sale.fuel,
    liters: fmtL(sale.liters),
    rate: fmtRate(sale.ratePerL),
    total: fmtRs(total),
    subtotal: fmtRs(taxable),
    taxableAmount: fmtRs(taxable),
    vatAmount: fmtRs(vat),
    paymentMethod: sale.paymentMethod as ReceiptDTO["paymentMethod"],
    customerName: sale.customerName ?? null,
    vehicleNo: sale.vehicleNo ?? null,
    changeDue: null,
    soldBy: sale.soldByName,
    at: fmtBSDateTime(createdAt),
    dateBS: fmtBSDateTime(createdAt).split(" ")[0] || "",
  };
}

export function PrintReceiptModal({
  sale,
  stationName,
  onClose,
}: {
  sale: PrintableSaleItem;
  stationName: string;
  onClose: () => void;
}) {
  const receipt = toReceiptDTO(sale, stationName);

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
          <TaxInvoice receipt={receipt} />
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
