"use client";

import { useActionState, useMemo, useState, useRef, useEffect } from "react";
import { Zap, Check, AlertTriangle, Fuel, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption } from "@/lib/queries/sales";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { ReceiptCard } from "@/components/sales/ReceiptCard";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";
import { amountInWords } from "@/lib/number-to-words";

const FUEL_DOT: Record<string, string> = {
  PETROL: "bg-amber-500",
  DIESEL: "bg-blue-500",
  CNG: "bg-emerald-500",
  KEROSENE: "bg-purple-500",
};

function preview(mode: "LITERS" | "AMOUNT", raw: string, rate: number) {
  const n = Number(raw);
  if (!raw.trim() || !Number.isFinite(n) || n <= 0 || rate <= 0) return null;
  const liters = mode === "LITERS" ? n : Math.floor((n / rate) * 100) / 100;
  const total = Math.round(liters * rate * 100) / 100;
  const taxable = Math.round((total / 1.13) * 100) / 100;
  const vat = Math.round((total - taxable) * 100) / 100;
  return { liters, total, taxable, vat };
}

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initialState: SaleFormState = {};

export function QuickSaleForm({
  tanks,
  invoiceConfig,
  invoiceNumber,
  todayBS,
}: {
  tanks: TankOption[];
  invoiceConfig?: MergedStationInvoiceConfig | null;
  invoiceNumber?: string;
  todayBS?: string;
}) {
  const [state, action, pending] = useActionState(recordSaleAction, initialState);

  return (
    <div className="space-y-4 animate-fade-in">
      <QuickSaleFields
        key={state.receipt?.receiptNo ?? "pending"}
        tanks={tanks}
        action={action}
        pending={pending}
        error={state.error}
        invoiceNumber={invoiceNumber}
        todayBS={todayBS}
      />

      {state.receipt && (
        <ReceiptCard
          receipt={state.receipt}
          business={invoiceConfig}
          settings={invoiceConfig}
        />
      )}
    </div>
  );
}

function QuickSaleFields({
  tanks,
  action,
  pending,
  error,
  invoiceNumber = "SL-0001",
  todayBS,
}: {
  tanks: TankOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  invoiceNumber?: string;
  todayBS?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const [tankId, setTankId] = useState(tanks[0]?.id ?? "");
  const [mode, setMode] = useState<"LITERS" | "AMOUNT">("LITERS");
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE" | "CARD">("CASH");

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, raw, rate), [mode, raw, rate]);
  const overStock = calc !== null && calc.liters > stock;
  const isStockLow = stock < 500 && stock > 0;

  const litersValue = mode === "LITERS" ? raw : calc ? calc.liters.toFixed(2) : "";
  const amountValue = mode === "AMOUNT" ? raw : calc ? calc.total.toFixed(2) : "";
  const isFormValid = !!calc && calc.liters > 0 && !overStock;

  // Global Keyboard POS Shortcuts: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isFormValid && !pending && formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormValid, pending]);

  // Auto-focus on load
  useEffect(() => {
    qtyInputRef.current?.focus();
  }, []);

  const handleReset = () => {
    setRaw("");
    setName("");
    setVehicleNo("");
    setPaymentMethod("CASH");
    qtyInputRef.current?.focus();
  };

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="tankId" value={tankId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="quantity" value={raw} />
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {/* Unified Quick POS Box */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        {/* Header Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold text-text tracking-tight flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              Quick Dispense Sale (द्रुत बिक्री)
            </h2>
            <p className="text-xs text-text-muted">
              5-second pump-side queue billing
            </p>
          </div>

          <div className="text-right">
            <div className="font-mono text-sm font-black text-accent tracking-wide">
              Invoice #{invoiceNumber}
            </div>
            {todayBS && (
              <div className="font-mono text-xs text-text-muted">
                {todayBS}
              </div>
            )}
          </div>
        </div>

        {/* 1. Fuel Product Picker Tiles */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
            SELECT FUEL PRODUCT
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {tanks.map((t) => {
              const fuelId = t.fuel as FuelId;
              const label = FUEL_LABEL[fuelId] ?? t.fuel;
              const active = t.id === tankId;
              const tStock = Number(t.levelL ?? 0);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTankId(t.id)}
                  className={clsx(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    active
                      ? "border-accent bg-accent/10 ring-2 ring-accent/40 shadow-xs"
                      : "border-border bg-surface-hi hover:border-text-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className={clsx("h-2 w-2 rounded-full", FUEL_DOT[t.fuel] ?? "bg-accent")} />
                      <span className={clsx("font-display text-xs font-bold", active ? "text-accent" : "text-text")}>
                        {label}
                      </span>
                    </span>
                    {active && <Check size={14} className="text-accent stroke-[3]" />}
                  </div>

                  <div className="font-mono text-sm font-black text-text">
                    Rs {Number(t.ratePerL).toFixed(2)}
                    <span className="text-[10px] font-normal text-text-muted ml-1">/ L</span>
                  </div>

                  <span className="font-mono text-[10px] text-text-muted mt-0.5">
                    Stock: {tStock.toLocaleString("en-IN")} L
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Litres / Amount Inputs with Instant Bi-directional Auto Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted" htmlFor="qsLiters">
                QUANTITY (LITRES)
              </label>
              {mode === "LITERS" && (
                <span className="text-[10px] font-bold text-accent uppercase">Active</span>
              )}
            </div>
            <div className="relative">
              <Input
                ref={qtyInputRef}
                id="qsLiters"
                inputMode="decimal"
                value={litersValue}
                onChange={(e) => {
                  setMode("LITERS");
                  setRaw(e.target.value);
                }}
                className={clsx(
                  "font-mono text-sm font-black pr-7",
                  mode === "LITERS" ? "border-accent ring-1 ring-accent/30" : ""
                )}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-text-muted">
                L
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted" htmlFor="qsAmount">
                AMOUNT (RUPEES)
              </label>
              {mode === "AMOUNT" && (
                <span className="text-[10px] font-bold text-accent uppercase">Active</span>
              )}
            </div>
            <div className="relative">
              <Input
                id="qsAmount"
                inputMode="decimal"
                value={amountValue}
                onChange={(e) => {
                  setMode("AMOUNT");
                  setRaw(e.target.value);
                }}
                className={clsx(
                  "font-mono text-sm font-black pr-10 text-right",
                  mode === "AMOUNT" ? "border-accent ring-1 ring-accent/30" : ""
                )}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-text-muted">
                NPR
              </span>
            </div>
          </div>
        </div>

        {/* 3. Optional Customer & Vehicle & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/60">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1" htmlFor="qsName">
              CUSTOMER / BUYER
            </label>
            <Input
              id="qsName"
              name="buyerName"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs font-semibold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1" htmlFor="qsVehicle">
              VEHICLE PLATE
            </label>
            <Input
              id="qsVehicle"
              name="vehicleNo"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              className="font-mono uppercase text-xs font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1" htmlFor="qsPaymentSelect">
              PAYMENT MODE
            </label>
            <Select
              id="qsPaymentSelect"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="text-xs font-bold"
            >
              <option value="CASH">Cash (नगद)</option>
              <option value="ONLINE">QR / Wallet</option>
              <option value="CARD">Card / POS</option>
            </Select>
          </div>
        </div>

        {/* 4. Live Grand Total Card */}
        <div className="rounded-xl border border-accent/40 bg-surface-hi p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              TOTAL BILL
            </span>
            <span className="text-[10px] italic text-text-muted">
              {calc && calc.total > 0 ? amountInWords(calc.total) : "Zero Rupees Only"}
            </span>
          </div>

          <div className="font-mono text-2xl font-black text-accent tracking-tight">
            {calc ? rs(calc.total) : "Rs 0.00"}
          </div>
        </div>

        {/* Warnings & Errors */}
        {overStock && (
          <div className="animate-fade-in rounded-xl border border-error/40 bg-error/10 p-3 text-xs text-error font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Insufficient fuel: Only {stock.toLocaleString("en-IN")} L available in tank.</span>
          </div>
        )}
        {error && (
          <div className="animate-fade-in rounded-xl border border-error/40 bg-error/10 p-3 text-xs text-error font-bold flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 5. Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/70">
          <GhostButton
            type="button"
            onClick={handleReset}
            className="px-5 py-2 text-xs font-bold text-text-muted hover:text-text"
          >
            Cancel
          </GhostButton>

          <PrimaryButton
            type="submit"
            disabled={pending || !isFormValid}
            className={clsx(
              "px-8 py-2.5 text-xs font-black tracking-wide rounded-xl shadow-md transition-all flex items-center gap-2",
              isFormValid
                ? "bg-accent text-[#1A1306] hover:brightness-110 shadow-accent/20 cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            <Check size={16} className="stroke-[3]" />
            {pending ? "Saving..." : "✓ Save Quick Sale (Ctrl + S)"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
