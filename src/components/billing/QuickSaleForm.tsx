"use client";

import { useActionState, useMemo, useState, useRef, useEffect } from "react";
import { Zap, Check, AlertTriangle, Fuel, ArrowRight, Printer, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { ReceiptCard } from "@/components/sales/ReceiptCard";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";


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
  customers,
  invoiceConfig,
  invoiceNumber,
  todayBS,
}: {
  tanks: TankOption[];
  customers?: CustomerOption[];
  invoiceConfig?: MergedStationInvoiceConfig | null;
  invoiceNumber?: string;
  todayBS?: string;
}) {
  const [state, action, pending] = useActionState(recordSaleAction, initialState);

  // Which footer button was clicked, so a plain "Save" only persists the
  // sale, while "Save & Print" also produces the printable invoice below
  // and sends it straight to the printer.
  const [intent, setIntent] = useState<"save" | "print">("save");
  const printedForRef = useRef<number | null>(null);

  useEffect(() => {
    if (intent === "print" && state.receipt && printedForRef.current !== state.receipt.receiptNo) {
      printedForRef.current = state.receipt.receiptNo;
      // Let the invoice actually paint before handing off to the print dialog.
      const t = setTimeout(() => window.print(), 150);
      return () => clearTimeout(t);
    }
  }, [intent, state.receipt]);

  return (
    <div className="space-y-4 animate-fade-in">
      <QuickSaleFields
        key={state.receipt?.receiptNo ?? "pending"}
        tanks={tanks}
        customers={customers ?? []}
        action={action}
        pending={pending}
        error={state.error}
        invoiceNumber={invoiceNumber}
        todayBS={todayBS}
        onIntent={setIntent}
      />

      {state.receipt && intent === "print" && (
        <ReceiptCard
          receipt={state.receipt}
          business={invoiceConfig}
          settings={invoiceConfig}
        />
      )}

      {state.receipt && intent === "save" && (
        <div className="animate-fade-in mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 size={18} />
            <span className="font-display text-sm font-bold">
              Sale Saved: {state.receipt.billNumber}
            </span>
          </div>
          <GhostButton
            type="button"
            onClick={() => setIntent("print")}
            className="text-xs px-3.5 py-1.5 font-bold"
          >
            <Printer size={13} />
            Print Invoice
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function QuickSaleFields({
  tanks,
  customers,
  action,
  pending,
  error,
  invoiceNumber = "SL-0001",
  todayBS,
  onIntent,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  invoiceNumber?: string;
  todayBS?: string;
  onIntent: (intent: "save" | "print") => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // No tile pre-selected — the operator has to actively pick a fuel before
  // anything else works, rather than silently billing whichever tank
  // happened to be first in the list.
  const [tankId, setTankId] = useState("");
  const [mode, setMode] = useState<"LITERS" | "AMOUNT">("LITERS");
  const [raw, setRaw] = useState("");
  const [name, setName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "ONLINE" | "CARD">("CASH");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Matches an existing saved customer by exact name, the same way New
  // Sale does — so a customer added there (or earlier in Quick Sale) is
  // recognised here too, and their real PAN/VAT prints on the bill instead
  // of the field being invented or left to guess.
  const trimmedName = name.trim();
  const matchedCustomer = customers.find((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
  const suggestions = trimmedName
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(trimmedName.toLowerCase()) ||
            c.phone?.includes(trimmedName) ||
            c.panNo?.includes(trimmedName)
        )
        .slice(0, 6)
    : [];

  const tank = tanks.find((t) => t.id === tankId);
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, raw, rate), [mode, raw, rate]);
  const overStock = calc !== null && calc.liters > stock;
  const isStockLow = stock < 500 && stock > 0;

  const litersValue = mode === "LITERS" ? raw : calc ? calc.liters.toFixed(2) : "";
  const amountValue = mode === "AMOUNT" ? raw : calc ? calc.total.toFixed(2) : "";
  const isFormValid = !!tankId && !!calc && calc.liters > 0 && !overStock;

  // Global Keyboard POS Shortcut: Ctrl+S = Save & Print, matching the
  // primary button's own label.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isFormValid && !pending && formRef.current) {
          onIntent("print");
          formRef.current.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFormValid, pending, onIntent]);

  // The quantity field is disabled until a fuel is picked, so focusing it on
  // load would do nothing — focus it the moment a tile is chosen instead,
  // so picking fuel flows straight into typing a quantity.
  useEffect(() => {
    if (tankId) qtyInputRef.current?.focus();
  }, [tankId]);

  const handleReset = () => {
    setTankId("");
    setRaw("");
    setName("");
    setVehicleNo("");
    setPaymentMethod("CASH");
    setShowSuggestions(false);
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

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTankId((current) => (current === t.id ? "" : t.id))}
                  className={clsx(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer relative",
                    active
                      ? "border-accent/80 bg-accent/5 shadow-xs"
                      : "border-border bg-surface-hi hover:border-text-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={clsx("font-display text-xs font-bold", active ? "text-accent" : "text-text")}>
                      {label}
                    </span>
                    {active && <Check size={14} className="text-accent stroke-[3]" />}
                  </div>

                  <div className="font-mono text-sm font-black text-text">
                    Rs {Number(t.ratePerL).toFixed(2)}
                    <span className="text-[10px] font-normal text-text-muted ml-1">/ L</span>
                  </div>
                </button>
              );
            })}
          </div>

          {!tankId && (
            <p className="text-[11px] font-semibold text-accent">
              Select category first
            </p>
          )}
        </div>

        <fieldset
          disabled={!tankId}
          className={clsx("contents", !tankId && "opacity-50")}
        >
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
                  mode === "LITERS" ? "border-accent/80 bg-accent/[0.03]" : ""
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
                  mode === "AMOUNT" ? "border-accent/80 bg-accent/[0.03]" : ""
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
            <div className="relative">
              <Input
                id="qsName"
                name="buyerName"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="text-xs font-semibold"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setName(c.name);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full cursor-pointer flex-col items-start gap-0 px-2.5 py-1.5 text-left hover:bg-surface-hi"
                    >
                      <span className="text-[11px] font-semibold text-text">{c.name}</span>
                      <span className="text-[10px] text-text-muted">
                        {[c.phone, c.panNo].filter(Boolean).join(" · ") || "No phone / PAN on file"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {matchedCustomer?.panNo && (
              <div className="mt-1 text-[10.5px] text-text-muted">
                PAN/VAT: <span className="font-semibold text-text">{matchedCustomer.panNo}</span>
              </div>
            )}
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
        </fieldset>

        {/* 4. Live Grand Total Card */}
        <div className="mt-4 rounded-xl border border-accent/40 bg-surface-hi p-3.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            TOTAL BILL
          </span>

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

          <GhostButton
            type="submit"
            disabled={pending || !isFormValid}
            onClick={() => onIntent("save")}
            className={clsx(
              "px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
              isFormValid ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
            )}
          >
            <Check size={15} className="stroke-[3]" />
            {pending ? "Saving..." : "Save"}
          </GhostButton>

          <PrimaryButton
            type="submit"
            disabled={pending || !isFormValid}
            onClick={() => onIntent("print")}
            className={clsx(
              "px-7 py-2.5 text-xs font-black tracking-wide rounded-xl shadow-md transition-all flex items-center gap-2",
              isFormValid
                ? "bg-accent text-[#1A1306] hover:brightness-110 shadow-accent/20 cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            <Printer size={15} className="stroke-[3]" />
            {pending ? "Saving..." : "Save & Print (Ctrl + S)"}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
