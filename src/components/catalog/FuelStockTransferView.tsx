"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  ArrowLeft,
  Fuel,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { fmtBSDate } from "@/lib/bs-date";

export interface FuelTransferRecord {
  id: string;
  transferDateBS: string;
  fuelType: string;
  fromTank: string;
  toTank: string;
  quantityLiters: number;
  remarks?: string;
  transferredBy: string;
  createdAt: string;
}

const STORAGE_KEY = "fsm_fuel_transfers_list";

const FUEL_TYPES = [
  "Petrol (MS)",
  "Diesel (HSD)",
];

const TANKS = [
  "Tank 1",
  "Tank 2",
  "Tank 3",
  "Tank 4",
];

const INITIAL_TRANSFERS: FuelTransferRecord[] = [
  {
    id: "tr-1",
    transferDateBS: "2083-05-18",
    fuelType: "Diesel (HSD)",
    fromTank: "Tank 1",
    toTank: "Tank 2",
    quantityLiters: 2500,
    remarks: "Balancing underground storage volume prior to NOC delivery",
    transferredBy: "Station Operator",
    createdAt: new Date().toISOString(),
  },
  {
    id: "tr-2",
    transferDateBS: "2083-05-12",
    fuelType: "Petrol (MS)",
    fromTank: "Tank 2",
    toTank: "Tank 1",
    quantityLiters: 1200,
    remarks: "Pump intake pipe clearance and decanting",
    transferredBy: "Manager",
    createdAt: new Date().toISOString(),
  },
];

export function FuelStockTransferView() {
  const [transfers, setTransfers] = useState<FuelTransferRecord[]>(() => {
    if (typeof window === "undefined") return INITIAL_TRANSFERS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TRANSFERS;
  });

  // Form states matching screenshot
  const [transferDate, setTransferDate] = useState(() => fmtBSDate(new Date()) || "2083-05-19");
  const [fromTank, setFromTank] = useState("Tank 1");
  const [toTank, setToTank] = useState("Tank 2");
  const [fuelType, setFuelType] = useState("Petrol (MS)");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Table search
  const [searchQuery, setSearchQuery] = useState("");

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const qty = parseFloat(quantity) || 0;
    if (qty <= 0) {
      setErrorMessage("Please enter a valid transfer quantity greater than 0.");
      return;
    }

    if (fromTank === toTank) {
      setErrorMessage("From Tank and To Tank cannot be the same tank.");
      return;
    }

    setIsSubmitting(true);

    const newRecord: FuelTransferRecord = {
      id: `tr-${Date.now()}`,
      transferDateBS: transferDate.trim() || "2083-05-19",
      fuelType,
      fromTank,
      toTank,
      quantityLiters: qty,
      remarks: remarks.trim() || "Routine inter-tank transfer",
      transferredBy: "Station Operator",
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...transfers];
    setTransfers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(`Successfully transferred ${qty.toLocaleString("en-IN")} Litres of ${fuelType} from ${fromTank} to ${toTank}.`);
      setQuantity("");
      setRemarks("");
      setTimeout(() => setSuccessMessage(null), 3500);
    }, 300);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return transfers;
    const q = searchQuery.toLowerCase().trim();
    return transfers.filter(
      (t) =>
        t.fuelType.toLowerCase().includes(q) ||
        t.fromTank.toLowerCase().includes(q) ||
        t.toTank.toLowerCase().includes(q) ||
        t.transferDateBS.includes(q) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
    );
  }, [transfers, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* 1. Header Toolbar matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <Fuel size={20} className="text-accent" />
            <span>Fuel Transfer Form</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Inter-tank fuel decanting, tank-to-tank transfers, and calibration volume balancing.
          </p>
        </div>

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

      {/* 2. Main Transfer Form Card matching screenshot fields */}
      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
        <form onSubmit={handleTransfer} className="space-y-4">
          {/* Transfer Date */}
          <Field label="Transfer Date:">
            <Input
              type="text"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
              className="h-9 text-xs font-mono"
            />
          </Field>

          {/* From Tank */}
          <Field label="From Tank:">
            <Select
              value={fromTank}
              onChange={(e) => setFromTank(e.target.value)}
              required
              className="h-9 text-xs"
            >
              {TANKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          {/* To Tank */}
          <Field label="To Tank:">
            <Select
              value={toTank}
              onChange={(e) => setToTank(e.target.value)}
              required
              className="h-9 text-xs"
            >
              {TANKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          {/* Fuel Type */}
          <Field label="Fuel Type:">
            <Select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              required
              className="h-9 text-xs"
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </Field>

          {/* Quantity (in liters) */}
          <Field label="Quantity (in liters):">
            <Input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="h-9 text-xs font-data"
            />
          </Field>

          {/* Optional Remarks */}
          <Field label="Remarks:">
            <Input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="h-9 text-xs"
            />
          </Field>

          {/* Transfer Stock Submit Button */}
          <div className="pt-2">
            <PrimaryButton
              type="submit"
              disabled={isSubmitting}
              className="h-8.5 px-6 text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? "Transferring…" : "Transfer Stock"}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* 3. Recent Transfer Log History */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <ArrowRightLeft size={14} className="text-accent" />
            <span>Recent Tank Transfers</span>
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
                <th className="px-3 py-2.5 font-medium">Fuel Type</th>
                <th className="px-3 py-2.5 font-medium">From Tank</th>
                <th className="px-3 py-2.5 font-medium">To Tank</th>
                <th className="px-3 py-2.5 text-right font-medium">Quantity (L)</th>
                <th className="px-3 py-2.5 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-text-muted">
                    No transfer records found.
                  </td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-surface-hi/40 transition-colors">
                    <td className="px-3 py-2.5 text-center font-data text-xs text-text-muted">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-text">
                      {t.transferDateBS}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-text">
                      {t.fuelType}
                    </td>
                    <td className="px-3 py-2.5 font-data text-xs text-text-muted">
                      {t.fromTank}
                    </td>
                    <td className="px-3 py-2.5 font-data text-xs text-text-muted">
                      {t.toTank}
                    </td>
                    <td className="px-3 py-2.5 text-right font-data font-bold text-accent">
                      {t.quantityLiters.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} L
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-muted">
                      {t.remarks || "-"}
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
