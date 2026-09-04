"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Search,
  RotateCcw,
  X,
  Boxes,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Field";
import { fmtBSDate } from "@/lib/bs-date";

export interface StockAdjustmentItem {
  id: string;
  dateBS: string;
  product: string;
  quantity: number;
  tankA: number;
  tankB: number;
  remarks: string;
  createdAt: string;
}

const STORAGE_KEY = "fsm_stock_adjustments_list";

const PRODUCTS_LIST = [
  "MS - PETROL",
  "HSD - Diesel",
  "Transportation",
  "Gulf Pride 4T Plus 20W-40 (1L)",
  "Castrol GTX Diesel 15W-40 (5L)",
  "Radiator Coolant Concentrate (1L)",
];

const INITIAL_ADJUSTMENTS: StockAdjustmentItem[] = [
  {
    id: "adj-1",
    dateBS: "2083-05-18",
    product: "MS - PETROL",
    quantity: -18.5,
    tankA: -18.5,
    tankB: 0,
    remarks: "Evaporation loss during mid-day high temperature dip test",
    createdAt: new Date().toISOString(),
  },
  {
    id: "adj-2",
    dateBS: "2083-05-15",
    product: "HSD - Diesel",
    quantity: -42.0,
    tankA: -20.0,
    tankB: -22.0,
    remarks: "Thermal contraction variance after overnight cooling",
    createdAt: new Date().toISOString(),
  },
];

export function StockAdjustmentView({ initialShowForm = true }: { initialShowForm?: boolean }) {
  const [adjustments, setAdjustments] = useState<StockAdjustmentItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_ADJUSTMENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ADJUSTMENTS;
  });

  // Form inputs matching screenshot exactly
  const [dateBS, setDateBS] = useState(() => fmtBSDate(new Date()) || "2083-05-19");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tankA, setTankA] = useState("");
  const [tankB, setTankB] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table search
  const [searchQuery, setSearchQuery] = useState("");

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!product || product === "--Select Product--") {
      setErrorMessage("Please select a Product.");
      return;
    }

    const qty = parseFloat(quantity) || 0;
    if (qty === 0) {
      setErrorMessage("Please enter a valid non-zero Quantity.");
      return;
    }

    setIsSubmitting(true);

    const newAdjustment: StockAdjustmentItem = {
      id: `adj-${Date.now()}`,
      dateBS: dateBS.trim() || "2083-05-19",
      product: product.trim(),
      quantity: qty,
      tankA: parseFloat(tankA) || 0,
      tankB: parseFloat(tankB) || 0,
      remarks: remarks.trim() || "Routine stock adjustment",
      createdAt: new Date().toISOString(),
    };

    const updated = [newAdjustment, ...adjustments];
    setAdjustments(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Stock adjustment of ${qty} for ${product} saved successfully.`);
      setQuantity("");
      setTankA("");
      setTankB("");
      setRemarks("");
      setTimeout(() => setSuccessMessage(null), 3000);
    }, 250);
  };

  // Keyboard shortcut listener: Ctrl + E or Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return adjustments;
    const q = searchQuery.toLowerCase().trim();
    return adjustments.filter(
      (a) =>
        a.product.toLowerCase().includes(q) ||
        a.remarks.toLowerCase().includes(q) ||
        a.dateBS.includes(q) ||
        String(a.quantity).includes(q)
    );
  }, [adjustments, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* 1. Page Header matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-accent" />
            <span>Stock Adjustment</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Record forecourt tank evaporation, dip variances, and tank level adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/catalog/adjustments">
            <PrimaryButton type="button" className="h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs">
              <ArrowRightLeft size={14} />
              <span>Adjustment List</span>
            </PrimaryButton>
          </Link>
          <Link href="/catalog">
            <GhostButton
              type="button"
              className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
            >
              <ArrowLeft size={13} />
              <span>« Back</span>
            </GhostButton>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs font-semibold text-error shadow-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. "Add a Stock" Form Card matching screenshot */}
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="font-display text-xs font-bold text-text uppercase tracking-wider border-b border-border/70 pb-2">
          Add a Stock
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Row 1: Date & Select Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date:">
              <Input
                type="text"
                value={dateBS}
                onChange={(e) => setDateBS(e.target.value)}
                required
                className="h-9 text-xs font-mono"
              />
            </Field>

            <Field label="Select Product:">
              <Select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
                className="h-9 text-xs"
              >
                <option value="">--Select Product--</option>
                {PRODUCTS_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Row 2: Quantity & Tank A */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Quantity:">
              <Input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="h-9 text-xs font-data"
              />
            </Field>

            <Field label="Tank A:">
              <Input
                type="text"
                inputMode="decimal"
                value={tankA}
                onChange={(e) => setTankA(e.target.value)}
                className="h-9 text-xs font-data"
              />
            </Field>
          </div>

          {/* Row 3: Tank B & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tank B:">
              <Input
                type="text"
                inputMode="decimal"
                value={tankB}
                onChange={(e) => setTankB(e.target.value)}
                className="h-9 text-xs font-data"
              />
            </Field>

            <Field label="Remarks:">
              <Input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="h-9 text-xs"
              />
            </Field>
          </div>

          {/* Save Button & Shortcut Hint matching screenshot */}
          <div className="pt-2">
            <PrimaryButton
              type="submit"
              disabled={isSubmitting}
              className="h-8.5 px-6 text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </PrimaryButton>
            <div className="mt-1 text-[11px] font-semibold text-error">
              Press Ctrl + E
            </div>
          </div>
        </form>
      </div>

      {/* 3. Recent Adjustments History Table */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xs font-bold text-text uppercase tracking-wider">
            Recent Stock Adjustments
          </h2>

          <div className="relative w-48 sm:w-60">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7.5 pl-7.5 pr-6 text-xs w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[650px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-hi/80 font-data text-[11px] tracking-wide text-text-muted">
                <th className="px-3 py-2.5 font-medium w-12 text-center">S.N.</th>
                <th className="px-3 py-2.5 font-medium">Date (BS)</th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 text-right font-medium">Quantity</th>
                <th className="px-3 py-2.5 text-right font-medium">Tank A</th>
                <th className="px-3 py-2.5 text-right font-medium">Tank B</th>
                <th className="px-3 py-2.5 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-text-muted">
                    No adjustment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((adj, idx) => (
                  <tr key={adj.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="px-3 py-2.5 text-center font-data text-xs text-text-muted">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-text">
                      {adj.dateBS}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-text">
                      {adj.product}
                    </td>
                    <td className="px-3 py-2.5 text-right font-data font-bold text-accent">
                      {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right font-data text-xs text-text-muted">
                      {adj.tankA || 0}
                    </td>
                    <td className="px-3 py-2.5 text-right font-data text-xs text-text-muted">
                      {adj.tankB || 0}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-muted">
                      {adj.remarks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
