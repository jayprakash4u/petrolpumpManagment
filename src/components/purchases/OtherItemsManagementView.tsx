"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  FileSpreadsheet,
  Search,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  History,
  Eye,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { clsx } from "clsx";
import type { InventoryItem } from "@/lib/purchases";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { fmtRs } from "@/lib/money";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { InventoryItemsTable } from "@/components/purchases/InventoryItemsTable";
import { AddOtherItemPurchaseForm, type OtherItemPurchaseRecord } from "./AddOtherItemPurchaseForm";

const STORAGE_KEY = "fsm_other_item_purchases";

const INITIAL_PURCHASES: OtherItemPurchaseRecord[] = [
  {
    id: "purch-101",
    supplierId: "sup-gulf",
    supplierName: "Gulf Lubricants Nepal Ltd.",
    purchaseDateBS: "2083-05-15",
    invoiceNo: "GL-INV-4491",
    totalPurchaseAmount: 115000,
    discountAmount: 2000,
    nonTaxableAmount: 0,
    taxableAmount: 113000,
    vatAmount: 14690,
    shippingAmount: 1500,
    insuranceAmount: 500,
    clearanceExpense: 0,
    importDuty: 0,
    grandTotal: 129690,
    description: "Monthly stock replenishment: Gulf Pride 4T Plus 20W-40 & Syntrac 10W-30",
    createdAt: "2026-08-30T10:30:00Z",
  },
  {
    id: "purch-102",
    supplierId: "sup-castrol",
    supplierName: "Castrol India & BP Distributors",
    purchaseDateBS: "2083-05-10",
    invoiceNo: "CAS-99214",
    totalPurchaseAmount: 85000,
    discountAmount: 1500,
    nonTaxableAmount: 0,
    taxableAmount: 83500,
    vatAmount: 10855,
    shippingAmount: 1000,
    insuranceAmount: 0,
    clearanceExpense: 0,
    importDuty: 0,
    grandTotal: 95355,
    description: "Castrol GTX Diesel 15W-40 5L Cans and Brake Fluid DOT-4",
    createdAt: "2026-08-25T14:15:00Z",
  },
  {
    id: "purch-103",
    supplierId: "sup-spares",
    supplierName: "Himalayan Petroleum Equipment & Spares",
    purchaseDateBS: "2083-05-04",
    invoiceNo: "HPE-8812",
    totalPurchaseAmount: 42000,
    discountAmount: 0,
    nonTaxableAmount: 0,
    taxableAmount: 42000,
    vatAmount: 5460,
    shippingAmount: 500,
    insuranceAmount: 0,
    clearanceExpense: 0,
    importDuty: 0,
    grandTotal: 47960,
    description: "ZVA Nozzle Spout replacement kits, fuel filter cartridges, and rubber seals",
    createdAt: "2026-08-19T09:00:00Z",
  },
];

export function OtherItemsManagementView({ items }: { items: InventoryItem[] }) {
  const [activeTab, setActiveTab] = useState<"STOCK" | "ADD_PURCHASE" | "PURCHASES">("STOCK");
  const [purchases, setPurchases] = useState<OtherItemPurchaseRecord[]>(INITIAL_PURCHASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<OtherItemPurchaseRecord | null>(null);

  // Hydrate purchases from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPurchases(parsed);
        }
      }
    } catch {}
  }, []);

  const handlePurchaseSaved = (newRecord: OtherItemPurchaseRecord) => {
    setPurchases((prev) => [newRecord, ...prev]);
    setActiveTab("PURCHASES");
  };

  // Filtered Purchases
  const filteredPurchases = useMemo(() => {
    if (!searchQuery.trim()) return purchases;
    const q = searchQuery.toLowerCase().trim();
    return purchases.filter(
      (p) =>
        p.invoiceNo.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.purchaseDateBS.includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [purchases, searchQuery]);

  // Total metrics
  const totalStockCost = useMemo(() => {
    return items.reduce((sum, i) => sum + i.stockInHand * i.costPriceNpr, 0);
  }, [items]);

  const totalStockRetail = useMemo(() => {
    return items.reduce((sum, i) => sum + i.stockInHand * i.sellingPriceNpr, 0);
  }, [items]);

  const totalPurchasedValue = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  }, [purchases]);

  const totalVatPaid = useMemo(() => {
    return purchases.reduce((sum, p) => sum + p.vatAmount, 0);
  }, [purchases]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full min-w-0 animate-fade-in">
      <PurchaseSubnav />

      {/* Top Header Toolbar & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center gap-2">
              Other Items <span className="text-accent">& Lubricants</span>
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-text-muted font-mono">
              {items.length} SKUs in Stock
            </span>
          </div>
          <p className="text-[11.5px] text-text-muted hidden sm:block">
            Procure lubricants, vehicle consumables, forecourt spares, and manage inventory valuation.
          </p>
        </div>

        {/* View Switcher Tabs & Quick Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("STOCK")}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all cursor-pointer text-xs",
                activeTab === "STOCK"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <Package size={13} />
              <span>Stock Register</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PURCHASES")}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all cursor-pointer text-xs",
                activeTab === "PURCHASES"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <ShoppingBag size={13} />
              <span>Purchase Bills ({purchases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ADD_PURCHASE")}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-all cursor-pointer text-xs",
                activeTab === "ADD_PURCHASE"
                  ? "bg-accent text-[#1A1306] font-bold shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <Plus size={13} />
              <span>Add Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Stock Valuation (Cost)
          </span>
          <div className="font-data font-bold text-[15px] text-accent mt-0.5 truncate">
            {fmtRs(totalStockCost)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Inventory in warehouse</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Retail Value (MRP)
          </span>
          <div className="font-data font-bold text-[15px] text-text mt-0.5 truncate">
            {fmtRs(totalStockRetail)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Projected retail revenue</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Total Procurements
          </span>
          <div className="font-data font-bold text-[15px] text-text mt-0.5 truncate">
            {fmtRs(totalPurchasedValue)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">{purchases.length} invoices recorded</span>
        </div>

        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block truncate">
            Input VAT Paid (13%)
          </span>
          <div className="font-data font-bold text-[15px] text-success mt-0.5 truncate">
            {fmtRs(totalVatPaid)}
          </div>
          <span className="text-[9.5px] text-text-muted truncate block">Claimable IRD tax credit</span>
        </div>
      </div>

      {/* TAB 1: ADD PURCHASE VIEW (Matching Screenshot) */}
      {activeTab === "ADD_PURCHASE" && (
        <AddOtherItemPurchaseForm
          onSaved={handlePurchaseSaved}
          onCancel={() => setActiveTab("STOCK")}
        />
      )}

      {/* TAB 2: INVENTORY STOCK REGISTER VIEW */}
      {activeTab === "STOCK" && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs">
          <InventoryItemsTable items={items} />
        </div>
      )}

      {/* TAB 3: PURCHASES INVOICE LEDGER VIEW */}
      {activeTab === "PURCHASES" && (
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          {/* Card Header & Search */}
          <div className="p-3.5 sm:p-4 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 bg-surface">
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-text">
                Other Items Purchase Invoices (खरिद बीजक खाता)
              </h2>
              <p className="text-xs text-text-muted">
                Statutory procurement register for lubricants, spare parts, and forecourt consumables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoice or vendor..."
                  className="h-8 pl-8 pr-7 text-xs font-medium w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <GhostButton
                type="button"
                onClick={() => setActiveTab("ADD_PURCHASE")}
                className="h-8 px-3 text-xs font-semibold rounded-lg bg-accent text-[#1A1306] hover:bg-accent-hover flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Purchase</span>
              </GhostButton>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-2.5 border-r border-border">Date (BS)</th>
                  <th className="p-2.5 border-r border-border">Invoice #</th>
                  <th className="p-2.5 border-r border-border">Supplier / Vendor</th>
                  <th className="p-2.5 border-r border-border text-right">Taxable (Rs)</th>
                  <th className="p-2.5 border-r border-border text-right">VAT 13% (Rs)</th>
                  <th className="p-2.5 border-r border-border text-right">Duties & Exp</th>
                  <th className="p-2.5 border-r border-border text-right">Grand Total (Rs)</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-data">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted text-xs font-sans">
                      No purchase invoices found matching &quot;{searchQuery}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-surface-hi/40">
                      <td className="p-2.5 border-r border-border font-mono text-text">
                        {p.purchaseDateBS}
                      </td>
                      <td className="p-2.5 border-r border-border font-mono font-bold text-accent">
                        {p.invoiceNo}
                      </td>
                      <td className="p-2.5 border-r border-border font-sans font-medium text-text">
                        {p.supplierName}
                      </td>
                      <td className="p-2.5 border-r border-border text-right font-mono text-text">
                        {fmtRs(p.taxableAmount)}
                      </td>
                      <td className="p-2.5 border-r border-border text-right font-mono text-success font-semibold">
                        {fmtRs(p.vatAmount)}
                      </td>
                      <td className="p-2.5 border-r border-border text-right font-mono text-text-muted">
                        {fmtRs(p.shippingAmount + p.insuranceAmount + p.clearanceExpense + p.importDuty)}
                      </td>
                      <td className="p-2.5 border-r border-border text-right font-mono font-bold text-text">
                        {fmtRs(p.grandTotal)}
                      </td>
                      <td className="p-2.5 text-right font-sans">
                        <GhostButton
                          type="button"
                          onClick={() => setSelectedRecord(p)}
                          className="h-7 px-2 text-[11px] font-semibold border border-border hover:bg-surface-hi"
                        >
                          View Bill
                        </GhostButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="border-t border-border bg-surface-hi/70 px-4 py-2 flex items-center justify-between text-xs text-text-muted font-sans">
            <span>
              Showing <strong className="text-text font-mono">{filteredPurchases.length}</strong> of{" "}
              <strong className="text-text font-mono">{purchases.length}</strong> invoices
            </span>
            <span>
              Total Value: <strong className="text-accent font-mono font-bold">{fmtRs(totalPurchasedValue)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* View Bill Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                <h3 className="font-display text-base font-bold text-text">
                  Purchase Invoice #{selectedRecord.invoiceNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-text-muted hover:text-text cursor-pointer p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Supplier / Vendor:</span>
                <strong className="text-text">{selectedRecord.supplierName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Purchase Date (BS):</span>
                <span className="font-mono text-text">{selectedRecord.purchaseDateBS}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Total Purchase Amount:</span>
                <span className="font-mono text-text">{fmtRs(selectedRecord.totalPurchaseAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Discount Deducted:</span>
                <span className="font-mono text-text-muted">-{fmtRs(selectedRecord.discountAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Taxable Amount:</span>
                <span className="font-mono text-text">{fmtRs(selectedRecord.taxableAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">13% VAT Paid:</span>
                <span className="font-mono text-success font-bold">+{fmtRs(selectedRecord.vatAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Shipping & Insurance:</span>
                <span className="font-mono text-text">
                  {fmtRs(selectedRecord.shippingAmount + selectedRecord.insuranceAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-text-muted">Clearance & Import Duty:</span>
                <span className="font-mono text-text">
                  {fmtRs(selectedRecord.clearanceExpense + selectedRecord.importDuty)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t border-border font-bold text-sm">
                <span className="text-text">Grand Total:</span>
                <span className="font-mono text-accent">{fmtRs(selectedRecord.grandTotal)}</span>
              </div>
              {selectedRecord.description && (
                <div className="pt-2 text-text-muted text-[11.5px] bg-bg p-2.5 rounded-lg border border-border">
                  <span className="font-bold text-text block mb-0.5">Remarks / Memo:</span>
                  {selectedRecord.description}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <GhostButton
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="h-8 px-4 text-xs font-semibold"
              >
                Close
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
