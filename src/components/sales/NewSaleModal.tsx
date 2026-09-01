"use client";

import { useState } from "react";
import { X, PlusCircle, Fuel } from "lucide-react";
import { SaleForm } from "@/components/sales/SaleForm";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";

export function NewSaleModal({
  tanks,
  customers,
  canSell,
  invoiceConfig,
  onClose,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
  canSell: boolean;
  invoiceConfig?: MergedStationInvoiceConfig | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
              <PlusCircle size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display text-[16px] font-bold text-text">
                Record New Fuel Sale (नयाँ बिक्री प्रविष्टि)
              </h3>
              <p className="text-[11.5px] text-text-muted">
                Billed instantly at current dispenser rates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Fast Sale Form */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          <SaleForm
            tanks={tanks}
            customers={customers}
            canSell={canSell}
            invoiceConfig={invoiceConfig}
          />
        </div>
      </div>
    </div>
  );
}
