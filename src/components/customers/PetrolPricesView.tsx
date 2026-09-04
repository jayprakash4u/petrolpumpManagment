"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Fuel,
  Search,
  Copy,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Plus,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface PetrolPriceRule {
  id: string;
  sn: number;
  customerName: string;
  pan: string;
  rateType: "Standard Retail" | "Contracted Discount" | "Special Surcharge";
  basePrice: number;
  discountPerLitre: number;
  finalPrice: number;
  effectiveDateBS: string;
  remarks: string;
}

const INITIAL_PETROL_PRICES: PetrolPriceRule[] = [
  {
    id: "pp-0",
    sn: 1,
    customerName: "General Retail Customers (Default)",
    pan: "-",
    rateType: "Standard Retail",
    basePrice: 178.0,
    discountPerLitre: 0.0,
    finalPrice: 178.0,
    effectiveDateBS: "2083/04/01",
    remarks: "Standard NOC Retail Rate",
  },
  {
    id: "pp-1",
    sn: 2,
    customerName: "Kantipur Media Fleet Services",
    pan: "601829471",
    rateType: "Contracted Discount",
    basePrice: 178.0,
    discountPerLitre: 2.0,
    finalPrice: 176.0,
    effectiveDateBS: "2083/04/15",
    remarks: "Corporate media fleet agreement (Rs. 2 off)",
  },
  {
    id: "pp-2",
    sn: 3,
    customerName: "Everest Tour & Travels Fleet",
    pan: "301829374",
    rateType: "Contracted Discount",
    basePrice: 178.0,
    discountPerLitre: 1.5,
    finalPrice: 176.5,
    effectiveDateBS: "2083/05/01",
    remarks: "Tourism fleet rate discount",
  },
  {
    id: "pp-3",
    sn: 4,
    customerName: "National Highway Project JV",
    pan: "600981723",
    rateType: "Contracted Discount",
    basePrice: 178.0,
    discountPerLitre: 2.5,
    finalPrice: 175.5,
    effectiveDateBS: "2083/03/01",
    remarks: "High-volume bulk purchaser",
  },
];

export function PetrolPricesView() {
  const [prices, setPrices] = useState<PetrolPriceRule[]>(INITIAL_PETROL_PRICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filtered = useMemo(() => {
    return prices.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.customerName.toLowerCase().includes(q) || p.remarks.toLowerCase().includes(q);
    });
  }, [prices, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Fuel size={20} className="text-accent" />
            <span>Petrol (MS) Prices Matrix</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Standard station retail rates and customized party pricing agreements for Motor Spirit (MS Petrol).
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-xl border border-border bg-surface shadow-xs p-4 sm:p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <GhostButton type="button" onClick={() => showToast("Copied Petrol prices!")} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <Copy size={13} />
              <span>Copy</span>
            </GhostButton>
            <GhostButton type="button" onClick={() => showToast("Exported CSV!")} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <FileSpreadsheet size={13} />
              <span>CSV</span>
            </GhostButton>
            <GhostButton type="button" onClick={() => window.print()} className="h-8 px-2.5 text-xs font-semibold gap-1">
              <Printer size={13} />
              <span>Print</span>
            </GhostButton>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search petrol price rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7.5 pr-2.5 text-xs w-full rounded-lg border border-border bg-surface text-text focus:border-accent focus:outline-hidden"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[750px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                <th className="border-r border-border/60 px-3 py-2.5 text-center w-12">SN</th>
                <th className="border-r border-border/60 px-3 py-2.5 font-medium">Customer / Category</th>
                <th className="border-r border-border/60 px-3 py-2.5 w-24 font-medium">PAN</th>
                <th className="border-r border-border/60 px-3 py-2.5 w-32 font-medium">Rate Type</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Base Price</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-right w-24 font-medium">Discount</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-right w-28 font-medium">Final Rate (Rs/L)</th>
                <th className="border-r border-border/60 px-3 py-2.5 text-center w-28 font-medium">Effective Date</th>
                <th className="px-3 py-2.5 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[11.5px]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                  <td className="border-r border-border/60 px-3 py-2.5 text-center font-data text-text-muted">{p.sn}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 font-bold text-text">{p.customerName}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 font-mono text-text-muted">{p.pan}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 font-medium text-text">{p.rateType}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-text-muted">Rs. {p.basePrice.toFixed(2)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-data text-success">
                    {p.discountPerLitre > 0 ? `- Rs. ${p.discountPerLitre.toFixed(2)}` : "-"}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-right font-data font-bold text-accent">Rs. {p.finalPrice.toFixed(2)}</td>
                  <td className="border-r border-border/60 px-3 py-2.5 text-center font-mono text-text">{p.effectiveDateBS}</td>
                  <td className="px-3 py-2.5 text-text-muted truncate max-w-xs">{p.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
