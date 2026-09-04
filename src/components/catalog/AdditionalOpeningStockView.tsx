"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  Coins,
  FileText,
  Calendar,
  Layers,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

export interface FiscalOpeningStockRow {
  id: string;
  sn: number;
  fiscalYear: string;
  product: string;
  stock: number;
  amount: number;
  total: number;
}

const STORAGE_KEY = "fsm_fiscal_opening_stock_records";

const FISCAL_YEAR_OPTIONS = [
  "2083/2084",
  "2082/2083",
  "2081/2082",
  "2080/2081",
  "2079/2080",
];

const COMMON_PRODUCTS = [
  "MS - PETROL",
  "HSD - Diesel",
  "Servo Pride 20W40 (5L)",
  "Mak 4T Plus 10W30 (1L)",
  "Mobil Delvac 15W40 (20L)",
  "Castrol GTX Diesel 15W-40 (5L)",
  "Gulf Pride 4T Plus 20W-40 (1L)",
  "Radiator Coolant Concentrate (1L)",
  "Transportation",
];

const INITIAL_FISCAL_OPENING_RECORDS: FiscalOpeningStockRow[] = [
  {
    id: "fos-1",
    sn: 1,
    fiscalYear: "2083/2084",
    product: "MS - PETROL",
    stock: 30084.0,
    amount: 160.0,
    total: 4813440.0,
  },
  {
    id: "fos-2",
    sn: 2,
    fiscalYear: "2083/2084",
    product: "HSD - Diesel",
    stock: 14805.46,
    amount: 128.67,
    total: 1905018.54,
  },
  {
    id: "fos-3",
    sn: 3,
    fiscalYear: "2083/2084",
    product: "Servo Pride 20W40 (5L)",
    stock: 120.0,
    amount: 450.0,
    total: 54000.0,
  },
  {
    id: "fos-4",
    sn: 4,
    fiscalYear: "2083/2084",
    product: "Mak 4T Plus 10W30 (1L)",
    stock: 85.0,
    amount: 480.0,
    total: 40800.0,
  },
  {
    id: "fos-5",
    sn: 5,
    fiscalYear: "2083/2084",
    product: "Transportation",
    stock: 0.0,
    amount: 0.0,
    total: 0.0,
  },
  {
    id: "fos-6",
    sn: 6,
    fiscalYear: "2082/2083",
    product: "MS - PETROL",
    stock: 24500.0,
    amount: 155.0,
    total: 3797500.0,
  },
  {
    id: "fos-7",
    sn: 7,
    fiscalYear: "2082/2083",
    product: "HSD - Diesel",
    stock: 18200.0,
    amount: 122.5,
    total: 2229500.0,
  },
  {
    id: "fos-8",
    sn: 8,
    fiscalYear: "2082/2083",
    product: "Mobil Delvac 15W40 (20L)",
    stock: 60.0,
    amount: 420.0,
    total: 25200.0,
  },
];

interface AdditionalOpeningStockViewProps {
  stationName?: string;
  stationAddress?: string;
}

export function AdditionalOpeningStockView({
  stationName = "Nepal Petroleum",
  stationAddress = "New Baneshwor-31, Kathmandu",
}: AdditionalOpeningStockViewProps) {
  // Shared local storage records with FiscalOpeningStockView
  const [records, setRecords] = useState<FiscalOpeningStockRow[]>(() => {
    if (typeof window === "undefined") return INITIAL_FISCAL_OPENING_RECORDS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FISCAL_OPENING_RECORDS;
  });

  const saveRecords = (newRecords: FiscalOpeningStockRow[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    } catch {}
  };

  // Form State matching screenshot
  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [customProduct, setCustomProduct] = useState<string>("");
  const [stock, setStock] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Toast / feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastAddedRow, setLastAddedRow] = useState<FiscalOpeningStockRow | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculated live preview valuation
  const liveTotal = useMemo(() => {
    const s = parseFloat(stock) || 0;
    const a = parseFloat(amount) || 0;
    return s * a;
  }, [stock, amount]);

  // Submit handler
  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fiscalYear) {
      alert("Please select a Fiscal Year.");
      return;
    }

    const finalProduct =
      selectedProduct === "Custom" ? customProduct.trim() : selectedProduct;

    if (!finalProduct) {
      alert("Please select or specify a Product.");
      return;
    }

    const stockNum = parseFloat(stock) || 0;
    const amountNum = parseFloat(amount) || 0;
    const totalVal = stockNum * amountNum;

    const newRow: FiscalOpeningStockRow = {
      id: `fos-${Date.now()}`,
      sn: records.length + 1,
      fiscalYear,
      product: finalProduct,
      stock: stockNum,
      amount: amountNum,
      total: totalVal,
    };

    const updated = [newRow, ...records];
    // Re-index SN
    const reIndexed = updated.map((r, i) => ({ ...r, sn: i + 1 }));
    saveRecords(reIndexed);
    setLastAddedRow(newRow);

    showToast(
      `Opening balance for "${finalProduct}" in FY ${fiscalYear} saved successfully!`
    );

    // Reset fields for convenient next entry
    setStock("");
    setAmount("");
  };

  return (
    <div className="w-full space-y-4 max-w-5xl mx-auto">
      {/* 1. Page Header Bar matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
            Additional Opening Stock
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Record supplemental initial inventory quantities and unit purchase rates per fiscal year.
          </p>
        </div>

        <Link href="/catalog/fiscal-opening-stock">
          <GhostButton
            type="button"
            className="h-8.5 px-3.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>« Back</span>
          </GhostButton>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {toastMessage && (
        <div className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Link
            href="/catalog/fiscal-opening-stock"
            className="text-xs font-bold underline hover:opacity-80 transition-opacity"
          >
            View Fiscal Ledger →
          </Link>
        </div>
      )}

      {/* 2. Main Form Card matching reference screenshot */}
      <div className="rounded-xl border border-border bg-surface shadow-xs p-5 sm:p-6 space-y-5">
        <form onSubmit={handleSaveBalance} className="space-y-4">
          {/* Row 1: Fiscal Year & Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fiscal Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text tracking-wide">
                Fiscal Year:
              </label>
              <select
                required
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
              >
                <option value="">--Select Type--</option>
                {FISCAL_YEAR_OPTIONS.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            {/* Products */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text tracking-wide">
                Products:
              </label>
              <select
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
              >
                <option value="">--Select Product--</option>
                {COMMON_PRODUCTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="Custom">+ Custom Product...</option>
              </select>
            </div>
          </div>

          {/* Custom product name if selected */}
          {selectedProduct === "Custom" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text tracking-wide">
                Custom Product Name:
              </label>
              <input
                type="text"
                required
                placeholder="Enter custom product name..."
                value={customProduct}
                onChange={(e) => setCustomProduct(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs text-text focus:border-accent focus:outline-hidden"
              />
            </div>
          )}

          {/* Row 2: Stock & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stock */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text tracking-wide">
                Stock:
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Opening Stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text tracking-wide">
                Amount:
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="Opening Balance"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-xs font-mono text-text focus:border-accent focus:outline-hidden"
              />
            </div>
          </div>

          {/* Live Valuation Summary */}
          {(parseFloat(stock) > 0 || parseFloat(amount) > 0) && (
            <div className="rounded-lg border border-border/80 bg-surface-hi/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-text-muted font-medium">
                Calculated Total Valuation:
              </span>
              <span className="font-data text-sm font-bold text-accent">
                NPR{" "}
                {liveTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* Save Action Button */}
          <div className="pt-2">
            <PrimaryButton
              type="submit"
              className="h-8.5 px-6 text-xs font-semibold shadow-xs"
            >
              Save Balance
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* 3. Recent Opening Stock Balances Preview Table */}
      <div className="rounded-xl border border-border bg-surface shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="font-display text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
            <Layers size={14} className="text-accent" />
            <span>Registered Fiscal Opening Stock Records</span>
          </div>

          <Link
            href="/catalog/fiscal-opening-stock"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            <span>View Full Fiscal Ledger</span>
            <span>→</span>
          </Link>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[650px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted select-none">
                <th className="border-r border-border/60 px-3 py-2 text-center w-12 font-medium">SN</th>
                <th className="border-r border-border/60 px-3 py-2 w-28 font-medium">Fiscal Year</th>
                <th className="border-r border-border/60 px-3 py-2 font-medium">Product</th>
                <th className="border-r border-border/60 px-3 py-2 text-right w-28 font-medium">Stock</th>
                <th className="border-r border-border/60 px-3 py-2 text-right w-28 font-medium">Amount</th>
                <th className="px-3 py-2 text-right w-32 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-[11.5px]">
              {records.slice(0, 5).map((r) => (
                <tr key={r.id} className="hover:bg-surface-hi/40 transition-colors whitespace-nowrap text-text">
                  <td className="border-r border-border/60 px-3 py-2 text-center font-data text-text-muted">
                    {r.sn}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 font-mono text-text">
                    {r.fiscalYear}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 font-medium text-text">
                    {r.product}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 text-right font-data font-semibold text-text">
                    {r.stock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border-r border-border/60 px-3 py-2 text-right font-data text-text-muted">
                    {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right font-data font-bold text-accent">
                    {r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
