"use client";

import { useState } from "react";
import {
  Undo2,
  Printer,
  Download,
  Search,
  Receipt,
  RotateCcw,
} from "lucide-react";
import {
  type IrdSalesReturnEntry,
  type IrdPurchaseReturnEntry,
} from "@/lib/ird";
import {
  getIrdSalesReturns,
  getIrdPurchaseReturns,
} from "@/lib/mock/ird";
import { fmtRs } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function IrdReturnsView({
  defaultTab = "SALES_RETURN",
}: {
  defaultTab?: "SALES_RETURN" | "PURCHASE_RETURN";
}) {
  const [activeTab, setActiveTab] = useState<"SALES_RETURN" | "PURCHASE_RETURN">(defaultTab);
  const [salesReturns] = useState<IrdSalesReturnEntry[]>(() => getIrdSalesReturns());
  const [purchaseReturns] = useState<IrdPurchaseReturnEntry[]>(() => getIrdPurchaseReturns());
  const [searchQuery, setSearchQuery] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const filteredSalesReturns = salesReturns.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = r.creditNoteNo.toLowerCase().includes(q);
      const matchParty = r.customerName.toLowerCase().includes(q);
      const matchInv = r.originalInvoiceNo.toLowerCase().includes(q);
      if (!matchNote && !matchParty && !matchInv) return false;
    }
    return true;
  });

  const filteredPurchaseReturns = purchaseReturns.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = r.debitNoteNo.toLowerCase().includes(q);
      const matchParty = r.supplierName.toLowerCase().includes(q);
      const matchInv = r.originalInvoiceRef.toLowerCase().includes(q);
      if (!matchNote && !matchParty && !matchInv) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Undo2 size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              {activeTab === "SALES_RETURN"
                ? "Sales Return Register (बिक्री फिर्ता खाता)"
                : "Purchase Return Register (खरिद फिर्ता खाता)"}
            </h3>
            <p className="text-[12.5px] text-text-muted">
              {activeTab === "SALES_RETURN"
                ? "Credit notes issued to buyers for billing corrections or meter adjustments."
                : "Debit notes raised against suppliers for damaged product returns or tanker claims."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Register
          </GhostButton>
        </div>
      </div>

      {/* Tab Switcher & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("SALES_RETURN")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "SALES_RETURN"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Sales Returns (Credit Notes)
          </button>
          <button
            onClick={() => setActiveTab("PURCHASE_RETURN")}
            className={`font-display cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              activeTab === "PURCHASE_RETURN"
                ? "bg-accent/15 font-semibold text-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            Purchase Returns (Debit Notes)
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note # or party..."
            className="pl-8 text-[12px]"
          />
        </div>
      </div>

      {/* Tab 1: Sales Returns */}
      {activeTab === "SALES_RETURN" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                <tr>
                  <th className="p-3">Date (BS)</th>
                  <th className="p-3">Credit Note #</th>
                  <th className="p-3">Original Invoice #</th>
                  <th className="p-3">Buyer Name & PAN</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Taxable Return</th>
                  <th className="p-3 text-right">VAT 13%</th>
                  <th className="p-3 text-right">Total Return (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSalesReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 font-data text-text-muted whitespace-nowrap">{r.dateBS}</td>
                    <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{r.creditNoteNo}</td>
                    <td className="p-3 font-data text-text whitespace-nowrap">{r.originalInvoiceNo}</td>
                    <td className="p-3">
                      <div className="font-semibold text-text">{r.customerName}</div>
                      <div className="font-data text-[11px] text-text-muted">PAN: {r.customerPan}</div>
                    </td>
                    <td className="p-3 text-text-muted italic text-[12px]">"{r.reason}"</td>
                    <td className="p-3 font-data text-right font-medium text-text whitespace-nowrap">
                      {fmtRs(r.taxableAmountNpr)}
                    </td>
                    <td className="p-3 font-data text-right text-text whitespace-nowrap">
                      {fmtRs(r.vatAmountNpr)}
                    </td>
                    <td className="p-3 font-data text-right font-bold text-accent whitespace-nowrap">
                      {fmtRs(r.totalAmountNpr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Purchase Returns */}
      {activeTab === "PURCHASE_RETURN" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="border-b border-border bg-surface-hi font-medium text-text-muted">
                <tr>
                  <th className="p-3">Date (BS)</th>
                  <th className="p-3">Debit Note #</th>
                  <th className="p-3">Original Invoice Ref</th>
                  <th className="p-3">Supplier Name & PAN</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Taxable Return</th>
                  <th className="p-3 text-right">VAT 13%</th>
                  <th className="p-3 text-right">Total Return (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPurchaseReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="p-3 font-data text-text-muted whitespace-nowrap">{r.dateBS}</td>
                    <td className="p-3 font-data font-bold text-accent whitespace-nowrap">{r.debitNoteNo}</td>
                    <td className="p-3 font-data text-text whitespace-nowrap">{r.originalInvoiceRef}</td>
                    <td className="p-3">
                      <div className="font-semibold text-text">{r.supplierName}</div>
                      <div className="font-data text-[11px] text-text-muted">PAN: {r.supplierPan}</div>
                    </td>
                    <td className="p-3 text-text-muted italic text-[12px]">"{r.reason}"</td>
                    <td className="p-3 font-data text-right font-medium text-text whitespace-nowrap">
                      {fmtRs(r.taxableAmountNpr)}
                    </td>
                    <td className="p-3 font-data text-right text-text whitespace-nowrap">
                      {fmtRs(r.vatAmountNpr)}
                    </td>
                    <td className="p-3 font-data text-right font-bold text-accent whitespace-nowrap">
                      {fmtRs(r.totalAmountNpr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
