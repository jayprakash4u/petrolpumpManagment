"use client";

import { useActionState, useMemo, useState, useEffect, useRef } from "react";
import {
  Receipt as ReceiptIcon,
  QrCode,
  UserPlus,
  Pencil,
  Check,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  Plus,
  X,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import { FUEL_LABEL, FUEL_SHORT_CODE, type FuelId } from "@/lib/fuel";
import { Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { ReceiptCard } from "./ReceiptCard";
import { AddCustomerModal } from "./AddCustomerModal";
import { amountInWords } from "@/lib/number-to-words";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";

const initialState: SaleFormState = {};

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

export function SaleForm({
  tanks,
  customers,
  canSell,
  invoiceConfig,
  invoiceNumber,
  todayBS,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
  canSell: boolean;
  invoiceConfig?: MergedStationInvoiceConfig | null;
  invoiceNumber?: string;
  todayBS?: string;
}) {
  const [state, action, pending] = useActionState(recordSaleAction, initialState);

  if (!canSell) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center text-text-muted shadow-xs">
        <p className="text-sm font-semibold">Your role does not include recording sales.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SaleFields
        key={state.receipt?.receiptNo ?? "pending"}
        tanks={tanks}
        customers={customers}
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

function SaleFields({
  tanks,
  customers,
  action,
  pending,
  error,
  invoiceNumber = "SL-0001",
  todayBS,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
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
  const [quantity, setQuantity] = useState("");
  const [payment, setPayment] = useState<"CASH" | "ONLINE" | "CARD" | "CREDIT">("CASH");
  const [buyerName, setBuyerName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerOption | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, quantity, rate), [mode, quantity, rate]);

  const litersValue = mode === "LITERS" ? quantity : calc ? calc.liters.toFixed(2) : "";
  const amountValue = mode === "AMOUNT" ? quantity : calc ? calc.total.toFixed(2) : "";

  const trimmedBuyer = buyerName.trim();
  const customer = customers.find((c) => c.name.trim().toLowerCase() === trimmedBuyer.toLowerCase());
  const overStock = calc !== null && calc.liters > stock;
  const isStockLow = stock < 500 && stock > 0;

  const suggestions = trimmedBuyer
    ? customers
        .filter(
          (c) =>
            c.name.toLowerCase().includes(trimmedBuyer.toLowerCase()) ||
            c.phone?.includes(trimmedBuyer) ||
            c.panNo?.includes(trimmedBuyer)
        )
        .slice(0, 8)
    : customers.slice(0, 8);

  const discount = Math.max(0, Number(discountAmount) || 0);
  const netTotal = calc ? Math.max(0, Math.round((calc.total - discount) * 100) / 100) : 0;
  const netTaxable = calc ? Math.round((netTotal / 1.13) * 100) / 100 : 0;
  const netVat = calc ? Math.round((netTotal - netTaxable) * 100) / 100 : 0;

  const overCredit = payment === "CREDIT" && calc !== null && netTotal > Number(customer?.headroom ?? 0);
  const isFormValid = !!calc && calc.liters > 0 && !overStock && !overCredit;

  // Keyboard shortcut Ctrl+S
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

  // Handle Reset / Cancel
  const handleReset = () => {
    setQuantity("");
    setVehicleNo("");
    setBuyerName("");
    setDiscountAmount("");
    setRemarks("");
    setPayment("CASH");
    qtyInputRef.current?.focus();
  };

  return (
    <>
      <form ref={formRef} action={action} className="animate-fade-in">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="quantity" value={quantity} />
        <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />
        <input type="hidden" name="paymentMethod" value={payment} />

        {/* ========================================================================= */}
        {/* UNIFIED POS BILLING CARD                                                  */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
          {/* Header Sub-Bar: New Sale & Invoice Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div>
              <h2 className="font-display text-lg font-bold text-text tracking-tight">
                New Sale
              </h2>
              <p className="text-xs text-text-muted">
                Create a new fuel transaction
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

          {/* SECTION 1: CUSTOMER & VEHICLE / PAYMENT */}
          <div className="space-y-3">
            {/* Customer Search */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  CUSTOMER / BUYER
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  <Plus size={12} /> Add Customer
                </button>
              </div>

              <div className="relative">
                <Input
                  name="buyerName"
                  autoComplete="off"
                  value={buyerName}
                  onChange={(e) => {
                    setBuyerName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="text-xs font-semibold"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setBuyerName(c.name);
                          setShowSuggestions(false);
                        }}
                        className="flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-hi transition-colors border-b border-border/40 last:border-0"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-text">{c.name}</span>
                          {c.headroom && (
                            <span className="text-[10px] font-mono text-accent">
                              Credit: Rs {Number(c.headroom).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10.5px] text-text-muted">
                          {[c.phone, c.panNo ? `PAN: ${c.panNo}` : null, c.address].filter(Boolean).join(" · ") || "Walk-In"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {customer && (
                <div className="mt-1.5 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs text-text">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">{customer.name}</span>
                    {customer.phone && <span className="text-text-muted text-[10.5px]">Tel: {customer.phone}</span>}
                    {customer.panNo && <span className="text-text-muted text-[10.5px]">PAN: {customer.panNo}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(customer)}
                    className="cursor-pointer text-text-muted hover:text-accent p-0.5"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Vehicle Plate & Payment Mode Sub-Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                  VEHICLE PLATE
                </label>
                <Input
                  name="vehicleNo"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="font-mono uppercase text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1" htmlFor="paymentModeSelect">
                  PAYMENT MODE
                </label>
                <Select
                  id="paymentModeSelect"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value as typeof payment)}
                  className="text-xs font-bold"
                >
                  <option value="CASH">Cash (नगद)</option>
                  <option value="ONLINE">QR / Wallet (Fonepay / eSewa)</option>
                  <option value="CARD">Card / POS (कार्ड)</option>
                  <option value="CREDIT">Credit (उधारो / खाता)</option>
                </Select>
              </div>
            </div>

            {/* Dynamic Credit & QR Sub-Banners */}
            {payment === "CREDIT" && (
              <div className="rounded-xl border border-accent/40 bg-accent/10 p-2 text-xs text-text flex items-center justify-between animate-fade-in">
                <span>
                  {customer
                    ? `Credit Available: ${rs(Number(customer.headroom))} for ${customer.name}.`
                    : trimmedBuyer
                    ? `New customer — no credit limit set yet. Set one on the Credit page.`
                    : "Please select or type a customer name to bill on Credit."}
                </span>
                {customer && (
                  <span className="font-mono font-bold text-accent text-[11px]">Active Ledger</span>
                )}
              </div>
            )}

            {payment === "ONLINE" && (
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-2 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 items-center animate-fade-in">
                <div className="flex items-center gap-2 text-accent font-bold">
                  <QrCode size={15} /> Dynamic Fonepay / eSewa QR
                </div>
                <Input
                  name="paymentRef"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="text-xs h-7"
                />
              </div>
            )}
          </div>

          {/* SECTION 2: LINE ITEMS TABLE */}
          <div className="space-y-2 pt-1 border-t border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                LINE ITEMS
              </span>
            </div>

            {/* Clean Bordered Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-hi text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <th className="p-2 border-r border-border w-[36%]">Product</th>
                    <th className="p-2 border-r border-border w-[22%]">Quantity (L)</th>
                    <th className="p-2 border-r border-border w-[18%] text-center">Rate</th>
                    <th className="p-2 w-[24%] text-right">Amount (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-surface">
                    {/* Product Column */}
                    <td className="p-2 border-r border-border align-middle">
                      <Select
                        id="tankId"
                        name="tankId"
                        value={tankId}
                        onChange={(e) => setTankId(e.target.value)}
                        className="text-xs font-bold w-full"
                      >
                        {tanks.map((t) => {
                          const shortCode = FUEL_SHORT_CODE[t.fuel];
                          const label = shortCode && shortCode !== FUEL_LABEL[t.fuel] ? `${FUEL_LABEL[t.fuel]} (${shortCode})` : FUEL_LABEL[t.fuel];
                          return (
                            <option key={t.id} value={t.id}>
                              {label}
                            </option>
                          );
                        })}
                      </Select>
                    </td>

                    {/* Quantity Column */}
                    <td className="p-2 border-r border-border align-middle">
                      <div className="relative">
                        <Input
                          ref={qtyInputRef}
                          id="quantityLiters"
                          inputMode="decimal"
                          value={litersValue}
                          onChange={(e) => {
                            setMode("LITERS");
                            setQuantity(e.target.value);
                          }}
                          className={clsx(
                            "font-mono text-xs font-black pr-6 text-right",
                            mode === "LITERS" ? "border-accent ring-1 ring-accent/30" : ""
                          )}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-text-muted">
                          L
                        </span>
                      </div>
                    </td>

                    {/* Rate Column */}
                    <td className="p-2 border-r border-border align-middle text-center font-mono text-xs font-bold text-text">
                      Rs {rate.toFixed(2)}
                    </td>

                    {/* Amount Column */}
                    <td className="p-2 align-middle">
                      <div className="relative">
                        <Input
                          id="quantityAmount"
                          inputMode="decimal"
                          value={amountValue}
                          onChange={(e) => {
                            setMode("AMOUNT");
                            setQuantity(e.target.value);
                          }}
                          className={clsx(
                            "font-mono text-xs font-black pr-8 text-right",
                            mode === "AMOUNT" ? "border-accent ring-1 ring-accent/30" : ""
                          )}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-text-muted">
                          Rs
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tank Inventory Indicator Status Line */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "font-mono font-bold flex items-center gap-1.5 text-xs",
                    overStock ? "text-error" : isStockLow ? "text-amber-500" : "text-success"
                  )}
                >
                  ● Tank Inventory: {stock.toLocaleString("en-IN", { minimumFractionDigits: 2 })} L available
                </span>
              </div>

              <span className="text-[10.5px] text-text-muted font-mono">
                Qty × Rate = Amount
              </span>
            </div>
          </div>

          {/* SECTION 3: TIGHT BILL SUMMARY & REMARKS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-2 border-t border-border/70 items-start">
            {/* Remarks on the Left (6 Cols) */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
                Remarks
              </label>
              <Input
                id="remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="text-xs font-medium"
              />
              <div className="text-[10.5px] text-text-muted flex items-center gap-2 pt-1 font-mono">
                <span>[Ctrl+S] Save Sale</span>
                <span>•</span>
                <span>[Esc] Reset</span>
              </div>
            </div>

            {/* Bill Summary on the Right (6 Cols) - Tightly aligned */}
            <div className="md:col-span-6">
              <div className="rounded-xl border border-accent/40 bg-surface-hi p-3.5 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border/70 pb-1">
                  BILL SUMMARY
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>Gross Amount</span>
                    <span className="font-bold text-text">{calc ? rs(calc.total) : "Rs 0.00"}</span>
                  </div>

                  <div className="flex items-center justify-between text-text-muted">
                    <span>Discount</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">Rs</span>
                      <Input
                        name="discountAmount"
                        inputMode="decimal"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        className="h-5.5 w-20 py-0 text-right font-mono text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-text-muted text-[11px]">
                    <span>Taxable Amount</span>
                    <span>{calc ? rs(netTaxable) : "Rs 0.00"}</span>
                  </div>

                  <div className="flex items-center justify-between text-text-muted text-[11px]">
                    <span>VAT (13%)</span>
                    <span>{calc ? rs(netVat) : "Rs 0.00"}</span>
                  </div>

                  <div className="border-t border-border pt-1.5 flex items-center justify-between">
                    <span className="font-sans text-xs font-bold uppercase tracking-wider text-text">
                      GRAND TOTAL
                    </span>
                    <span className="font-mono text-xl font-black text-accent tracking-tight">
                      {calc ? rs(netTotal) : "Rs 0.00"}
                    </span>
                  </div>

                  {/* Amount in words */}
                  <div className="pt-0.5 text-[10px] italic text-text-muted text-right truncate">
                    {calc && netTotal > 0 ? amountInWords(netTotal) : "Zero Rupees Only"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings & Errors */}
          {overStock && (
            <div className="animate-fade-in rounded-xl border border-error/40 bg-error/10 p-2.5 text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>Insufficient stock: Only {stock.toLocaleString("en-IN")} L available in {tank?.fuel} tank.</span>
            </div>
          )}
          {overCredit && (
            <div className="animate-fade-in rounded-xl border border-error/40 bg-error/10 p-2.5 text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>
                {customer
                  ? `Credit limit exceeded: ${customer.name} has only ${rs(Number(customer.headroom))} available.`
                  : `"${trimmedBuyer || "This customer"}" has no credit limit set yet.`}
              </span>
            </div>
          )}
          {error && (
            <div className="animate-fade-in rounded-xl border border-error/40 bg-error/10 p-2.5 text-xs text-error font-bold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 4: FOOTER ACTION BUTTONS */}
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
                "px-7 py-2 text-xs font-black tracking-wide rounded-xl shadow-md transition-all flex items-center gap-2",
                isFormValid
                  ? "bg-accent text-[#1A1306] hover:brightness-110 shadow-accent/20 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              )}
            >
              <Check size={15} className="stroke-[3]" />
              {pending ? "Saving..." : "✓ Save Sale"}
            </PrimaryButton>
          </div>
        </div>
      </form>

      {(showAddCustomer || editingCustomer) && (
        <AddCustomerModal
          editingCustomer={editingCustomer}
          onClose={() => {
            setShowAddCustomer(false);
            setEditingCustomer(null);
          }}
          onSaved={(name) => {
            setBuyerName(name);
            setShowAddCustomer(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </>
  );
}
