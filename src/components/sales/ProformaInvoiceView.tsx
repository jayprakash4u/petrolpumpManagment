"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Calendar,
  Fuel,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  Download,
  Car,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { fmtRs, fmtL } from "@/lib/money";
import { fmtBSDate } from "@/lib/bs-date";

interface ProformaItem {
  id: string;
  product: string;
  quantityL: number;
  ratePerL: number;
}

export function ProformaInvoiceView({
  stationName,
  tanks,
  customers,
}: {
  stationName: string;
  tanks: Array<{ id: string; fuel: string; ratePerL: string }>;
  customers: Array<{ id: string; name: string }>;
}) {
  const [docType, setDocType] = useState<"PROFORMA" | "QUOTATION" | "DRAFT">("PROFORMA");
  const [customerName, setCustomerName] = useState("ABC Transport Pvt. Ltd.");
  const [customerPAN, setCustomerPAN] = useState("301984210");
  const [vehicleNo, setVehicleNo] = useState("NA 4 KHA 9021");
  const [validDays, setValidDays] = useState("7");
  const [notes, setNotes] = useState("Rates are subject to official Nepal Oil Corporation (NOC) revisions at the time of delivery.");

  const [items, setItems] = useState<ProformaItem[]>([
    {
      id: "item-1",
      product: tanks[0]?.fuel || "DIESEL",
      quantityL: 1000,
      ratePerL: Number(tanks[0]?.ratePerL || 150),
    },
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        product: tanks[0]?.fuel || "DIESEL",
        quantityL: 500,
        ratePerL: Number(tanks[0]?.ratePerL || 150),
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((it) => it.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: keyof ProformaItem, value: any) => {
    setItems(
      items.map((it) => {
        if (it.id === id) {
          if (field === "product") {
            const matchedTank = tanks.find((t) => t.fuel === value);
            return {
              ...it,
              product: value,
              ratePerL: matchedTank ? Number(matchedTank.ratePerL) : it.ratePerL,
            };
          }
          return { ...it, [field]: value };
        }
        return it;
      })
    );
  };

  const totalGross = items.reduce((sum, it) => sum + it.quantityL * it.ratePerL, 0);
  const taxableAmount = totalGross / 1.13;
  const vatAmount = totalGross - taxableAmount;

  const todayBS = fmtBSDate(new Date());

  const docTitle =
    docType === "PROFORMA"
      ? "PROFORMA INVOICE (अग्रिम बीजक)"
      : docType === "QUOTATION"
      ? "PRICE QUOTATION (दरभाउ प्रस्ताव)"
      : "DRAFT ESTIMATION (अनुमानित विवरण)";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Compliance Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <FileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[17px] font-bold text-text">
                Quotation & Proforma Invoice Generator (दरभाउ तथा अग्रिम बीजक)
              </h2>
              <Badge tone="muted" className="text-[11px]">
                Non-Accounting Document
              </Badge>
            </div>
            <p className="text-[12px] text-text-muted">
              Generate non-final estimates and price quotations for corporate budget approvals without affecting physical tank inventory or tax ledgers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton onClick={() => window.print()} className="text-xs font-bold px-4 py-2">
            <Printer size={13} /> Print Document
          </PrimaryButton>
        </div>
      </div>

      {/* 2. Strict Compliance Safety Notice */}
      <div className="flex items-center gap-2.5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-text-muted">
        <ShieldCheck size={16} className="text-accent shrink-0" />
        <span>
          <strong>Zero Accounting & Stock Impact:</strong> This document is strictly an estimation / quotation. Generating or printing this document will <strong>not</strong> decrement storage tanks, charge customer credit, or create a tax liability in IRD registers.
        </span>
      </div>

      {/* 3. Studio Split: Configuration (Left) & Live Printable Preview (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Document Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                1. Document Settings
              </span>
              <span className="text-[11px] text-accent font-semibold">{todayBS}</span>
            </div>

            {/* Document Type Selector */}
            <div>
              <label className="text-[11.5px] font-semibold text-text-muted block mb-1">
                Document Type
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-bg p-1 text-[11px]">
                {(
                  [
                    { id: "PROFORMA", label: "Proforma" },
                    { id: "QUOTATION", label: "Quotation" },
                    { id: "DRAFT", label: "Draft" },
                  ] as const
                ).map((dt) => (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setDocType(dt.id)}
                    className={clsx(
                      "rounded-lg py-1.5 font-bold transition-all cursor-pointer",
                      docType === dt.id
                        ? "bg-surface text-accent shadow-xs border border-border"
                        : "text-text-muted hover:text-text"
                    )}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer Details */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11.5px] font-semibold text-text-muted block mb-1">
                  Recipient / Customer Name
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. ABC Transport Pvt. Ltd."
                  className="text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Buyer PAN (Optional)</label>
                  <Input
                    value={customerPAN}
                    onChange={(e) => setCustomerPAN(e.target.value)}
                    placeholder="e.g. 601984210"
                    className="text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">Vehicle Plate (Optional)</label>
                  <Input
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g. NA 4 KHA 9021"
                    className="text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-text-muted block mb-1">Validity (Days)</label>
                <Input
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  placeholder="7"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Items Configuration */}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text">Quoted Products</span>
                <GhostButton
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] py-0.5 px-2 text-accent"
                >
                  <Plus size={12} /> Add Item
                </GhostButton>
              </div>

              <div className="space-y-2.5">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-border bg-bg p-3 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text">Item #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-text-muted hover:text-error cursor-pointer p-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          value={it.product}
                          onChange={(e) => handleUpdateItem(it.id, "product", e.target.value)}
                          className="w-full rounded-lg border border-border bg-surface p-1.5 text-xs text-text"
                        >
                          {tanks.map((t) => (
                            <option key={t.id} value={t.fuel}>
                              {t.fuel}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <Input
                          type="number"
                          value={it.quantityL}
                          onChange={(e) =>
                            handleUpdateItem(it.id, "quantityL", Number(e.target.value) || 0)
                          }
                          placeholder="Qty (L)"
                          className="text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={it.ratePerL}
                          onChange={(e) =>
                            handleUpdateItem(it.id, "ratePerL", Number(e.target.value) || 0)
                          }
                          placeholder="Rate"
                          className="text-xs font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms / Remarks */}
            <div className="space-y-1 border-t border-border pt-3">
              <label className="text-[11px] text-text-muted block">Quotation Terms & Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-bg p-2 text-xs text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Printable Document Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                2. Live Printable Document Preview (80mm / A4)
              </span>
              <GhostButton onClick={() => window.print()} className="text-xs">
                <Printer size={12} /> Print Now
              </GhostButton>
            </div>

            {/* Printable Document Canvas */}
            <div className="print-area rounded-xl border border-border bg-bg p-6 text-xs font-mono text-text shadow-inner print:border-0 print:bg-white print:text-black print:p-0">
              {/* Prominent Non-Accounting Watermark Header */}
              <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/10 p-2 text-center text-[11px] font-bold text-amber-400 print:text-black print:border-black mb-4">
                *** {docTitle} — NOT A TAX INVOICE ***
              </div>

              {/* Station Header */}
              <div className="border-b border-dashed border-border pb-3 text-center space-y-1">
                <div className="font-display text-base font-bold text-text print:text-black">
                  {stationName}
                </div>
                <div className="text-[11px] text-text-muted print:text-gray-600">
                  PAN / VAT: 601234567 · Kathmandu, Nepal
                </div>
                <div className="text-[10px] text-text-muted print:text-gray-500">
                  REF NO: EST-{new Date().toISOString().slice(2, 10).replace(/-/g, "")}-01
                </div>
              </div>

              {/* Meta & Buyer Header */}
              <div className="grid grid-cols-2 gap-2 py-3 border-b border-dashed border-border text-[11px]">
                <div>
                  <span className="text-text-muted block text-[10px]">Issued To / Company:</span>
                  <strong className="text-text print:text-black">{customerName || "Customer Estimation"}</strong>
                  {customerPAN && <div className="text-[10px] text-text-muted">PAN: {customerPAN}</div>}
                </div>
                <div className="text-right">
                  <span className="text-text-muted block text-[10px]">Date & Validity:</span>
                  <div>{todayBS} (BS)</div>
                  <div className="text-[10px] text-text-muted">Valid for {validDays} Days</div>
                </div>

                {vehicleNo && (
                  <div className="col-span-2 pt-1">
                    <span className="text-text-muted text-[10px]">Target Vehicle: </span>
                    <strong>{vehicleNo}</strong>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-border">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-border/80 text-[10px] text-text-muted font-bold uppercase">
                      <th className="pb-1.5">Description</th>
                      <th className="pb-1.5 text-right">Estimated Qty</th>
                      <th className="pb-1.5 text-right">Unit Rate</th>
                      <th className="pb-1.5 text-right">Amount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 font-bold">{it.product}</td>
                        <td className="py-2 text-right">{fmtL(it.quantityL)}</td>
                        <td className="py-2 text-right">Rs {it.ratePerL.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold">
                          {fmtRs(it.quantityL * it.ratePerL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="py-3 space-y-1.5 border-b border-dashed border-border text-[11.5px]">
                <div className="flex justify-between text-text-muted">
                  <span>Estimated Taxable Base:</span>
                  <span>{fmtRs(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Estimated 13% VAT:</span>
                  <span>{fmtRs(vatAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm text-text print:text-black">
                  <span>Estimated Grand Total:</span>
                  <span className="text-accent print:text-black">{fmtRs(totalGross)}</span>
                </div>
              </div>

              {/* Notes & Disclaimer */}
              <div className="pt-3 space-y-1 text-[10px] text-text-muted print:text-gray-600">
                <div><strong>Terms & Conditions:</strong> {notes}</div>
                <div className="text-center pt-2 font-semibold">
                  This is a commercial quotation for budget approval. It does not constitute a delivery receipt or tax invoice.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
