"use client";

import { useActionState, useMemo, useState } from "react";
import { Receipt as ReceiptIcon, QrCode, UserPlus, Pencil } from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import { FUEL_LABEL, FUEL_SHORT_CODE } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReceiptCard } from "./ReceiptCard";
import { AddCustomerModal } from "./AddCustomerModal";
import { amountInWords } from "@/lib/number-to-words";

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

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function SaleForm({
  tanks,
  customers,
  canSell,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
  canSell: boolean;
}) {
  const [state, action, pending] = useActionState(recordSaleAction, initialState);

  if (!canSell) {
    return (
      <p className="rounded-lg border border-border bg-bg px-4 py-3 text-[13.5px] text-text-muted">
        Your role doesn&apos;t include recording sales.
      </p>
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
      />

      {state.receipt && <ReceiptCard receipt={state.receipt} />}
    </div>
  );
}

function SaleFields({
  tanks,
  customers,
  action,
  pending,
  error,
}: {
  tanks: TankOption[];
  customers: CustomerOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const [tankId, setTankId] = useState(tanks[0]?.id ?? "");
  const [mode, setMode] = useState<"LITERS" | "AMOUNT">("LITERS");
  const [quantity, setQuantity] = useState("");
  const [payment, setPayment] = useState<"CASH" | "ONLINE" | "CARD" | "CREDIT">("CASH");
  const [buyerName, setBuyerName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [onlineProvider, setOnlineProvider] = useState<"FONEPAY" | "ESEWA" | "KHALTI" | "MOBILE_BANKING">("FONEPAY");
  const [paymentRef, setPaymentRef] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerOption | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, quantity, rate), [mode, quantity, rate]);

  // Whichever field the operator is currently typing in drives the other —
  // the inactive one just displays what that works out to.
  const litersValue = mode === "LITERS" ? quantity : calc ? calc.liters.toFixed(2) : "";
  const amountValue = mode === "AMOUNT" ? quantity : calc ? calc.total.toFixed(2) : "";

  // The typed name only maps to a ledger account if it matches an existing
  // customer; a brand-new name gets created with a zero credit limit when
  // the sale is submitted, so treat it as zero headroom here too.
  const trimmedBuyer = buyerName.trim();
  const customer = customers.find((c) => c.name.trim().toLowerCase() === trimmedBuyer.toLowerCase());
  const overStock = calc !== null && calc.liters > stock;

  // Search by name, phone, or PAN — a cashier is as likely to recall a
  // regular's plate/phone as their exact registered name.
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

  // A discount comes off what's actually charged, so VAT and the credit
  // check apply to the discounted (net) figure, not the gross line amount —
  // the server recomputes this same way rather than trusting this preview.
  const discount = Math.max(0, Number(discountAmount) || 0);
  const netTotal = calc ? Math.max(0, Math.round((calc.total - discount) * 100) / 100) : 0;
  const netTaxable = calc ? Math.round((netTotal / 1.13) * 100) / 100 : 0;
  const netVat = calc ? Math.round((netTotal - netTaxable) * 100) / 100 : 0;

  const overCredit = payment === "CREDIT" && calc !== null && netTotal > Number(customer?.headroom ?? 0);

  return (
    <>
    <form action={action} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />
      <input type="hidden" name="paymentMethod" value={payment} />

      {/* 1. Header: Customer, Vehicle & Payment Mode */}
      <div className="rounded-xl border border-border bg-bg p-3.5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-[11.5px] font-semibold text-text-muted">
                Customer / Buyer (ग्राहक)
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="flex shrink-0 cursor-pointer items-center gap-1 text-[10.5px] font-semibold text-accent hover:underline"
              >
                <UserPlus size={11} /> Add Customer
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
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="text-xs font-semibold"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setBuyerName(c.name);
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

            {customer && (
              <div className="mt-1.5 flex items-start justify-between gap-2 rounded-lg border border-border/70 bg-surface-hi px-2.5 py-2">
                <div className="min-w-0 text-[10.5px] leading-relaxed text-text-muted">
                  <div className="truncate font-semibold italic text-text">{customer.name}</div>
                  {customer.phone && <div>Phone: {customer.phone}</div>}
                  {customer.panNo && <div>PAN: {customer.panNo}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(customer)}
                  className="shrink-0 cursor-pointer rounded-md border border-border p-1 text-text-muted hover:text-accent"
                  title="Edit customer details"
                >
                  <Pencil size={12} />
                </button>
              </div>
            )}

            {payment === "CREDIT" && (
              <p className="mt-1 text-[10.5px] text-text-muted">
                {customer
                  ? `${rs(Number(customer.headroom))} credit available for ${customer.name}.`
                  : trimmedBuyer
                    ? `New customer — no credit limit set yet. Set one on the Credit page before billing them on credit.`
                    : "Enter the customer's name to bill this on credit."}
              </p>
            )}
          </div>

          <div>
            <label className="text-[11.5px] font-semibold text-text-muted block mb-1">
              Vehicle Plate No (गाडी नं.)
            </label>
            <Input
              name="vehicleNo"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="font-mono uppercase text-xs"
            />
          </div>

          <div>
            <label className="text-[11.5px] font-semibold text-text-muted block mb-1" htmlFor="paymentMethod">
              Payment Mode
            </label>
            <Select
              id="paymentMethod"
              value={payment}
              onChange={(e) => setPayment(e.target.value as typeof payment)}
              className="text-xs font-semibold"
            >
              <option value="CREDIT">Credit (खाता)</option>
              <option value="CASH">Cash (नगद)</option>
              <option value="ONLINE">QR / Wallet</option>
              <option value="CARD">Card / POS</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 2. Items Line Table */}
      <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3 shadow-xs">
        <div className="border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Line Items (इन्धन विवरण)
          </span>
        </div>

        {/* Product, Qty, Amount & Rate Row — fill either Qty or Amount, the other fills itself in */}
        <div className="grid grid-cols-12 gap-2.5 items-end">
          <div className="col-span-3">
            <label className="text-[11px] text-text-muted block mb-1">Product</label>
            <Select
              id="tankId"
              name="tankId"
              value={tankId}
              onChange={(e) => setTankId(e.target.value)}
              className="text-xs font-semibold"
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
          </div>

          <div className="col-span-3">
            <label className="text-[11px] text-text-muted block mb-1">Quantity (L)</label>
            <Input
              id="quantityLiters"
              inputMode="decimal"
              value={litersValue}
              onChange={(e) => {
                setMode("LITERS");
                setQuantity(e.target.value);
              }}
              className="font-mono font-bold text-xs"
            />
          </div>

          <div className="col-span-3">
            <label className="text-[11px] text-text-muted block mb-1">Amount (Rs)</label>
            <Input
              id="quantityAmount"
              inputMode="decimal"
              value={amountValue}
              onChange={(e) => {
                setMode("AMOUNT");
                setQuantity(e.target.value);
              }}
              className="font-mono font-bold text-xs"
            />
          </div>

          <div className="col-span-3 text-right">
            <span className="text-[10.5px] text-text-muted block mb-1">Rate</span>
            <div className="font-mono text-xs font-bold text-text pt-2">
              Rs {rate.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tank Stock Warning */}
        <div className="flex justify-between items-center text-[11px] text-text-muted pt-1 border-t border-border/60">
          <span>Tank Inventory:</span>
          <span className={clsx("font-mono font-semibold", overStock ? "text-error" : "text-text")}>
            {stock.toLocaleString("en-IN")} L available in tank
          </span>
        </div>
      </div>

      {/* 3. Tax & Financial Breakdown, with Amount in Words / Remarks filling the space beside it */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-3">
          <div>
            <span className="text-[11px] text-text-muted block mb-1">Amount in Words</span>
            <p className="rounded-lg border border-dashed border-border bg-bg px-3 py-2 text-[11.5px] italic text-text-muted">
              {calc ? amountInWords(netTotal) : "—"}
            </p>
          </div>
          <Field label="Remarks (optional)" htmlFor="remarks">
            <Input
              id="remarks"
              name="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="text-xs"
            />
          </Field>
        </div>

        <div className="w-full space-y-1.5 rounded-xl border border-border bg-surface-hi p-3.5 font-mono text-xs sm:max-w-72">
          <div className="flex items-center justify-between gap-3 text-text-muted">
            <span>Gross Amount:</span>
            <span className="font-bold text-text">{calc ? rs(calc.total) : "Rs 0.00"}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-text-muted">
            <span>Discount:</span>
            <Input
              name="discountAmount"
              inputMode="decimal"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="0"
              className="h-6 w-20 py-0.5 text-right font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-text-muted">
            <span>Taxable:</span>
            <span>{calc ? rs(netTaxable) : "Rs 0.00"}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-text-muted">
            <span>VAT (13%):</span>
            <span>{calc ? rs(netVat) : "Rs 0.00"}</span>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-1.5 text-sm font-bold text-text">
            <span className="font-sans">Grand Total:</span>
            <span className="text-base text-accent">{calc ? rs(netTotal) : "Rs 0.00"}</span>
          </div>
        </div>
      </div>

      {/* Online / Card Reference Inputs */}
      {payment === "ONLINE" && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <QrCode size={14} /> Fonepay / eSewa Dynamic QR
          </div>
          <label className="text-[11px] text-text-muted block mb-1" htmlFor="paymentRef">
            Transaction Ref (optional)
          </label>
          <Input
            id="paymentRef"
            name="paymentRef"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            className="text-xs"
          />
        </div>
      )}

      {/* Warnings & Errors */}
      {overStock && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          Insufficient fuel in tank: Only {stock.toLocaleString("en-IN")} L remaining.
        </div>
      )}
      {overCredit && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          {customer
            ? `Credit limit exceeded: ${customer.name} has only ${rs(Number(customer.headroom))} available.`
            : `"${trimmedBuyer || "This customer"}" has no credit limit set yet — set one on the Credit page, or choose Cash / Card / Online for this sale.`}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          {error}
        </div>
      )}

      {/* 5. Save — the bill preview (with a manual Print action) appears below once saved */}
      <div className="pt-2">
        <PrimaryButton
          type="submit"
          disabled={pending || !calc || overStock || overCredit}
          className="w-full py-2.5 text-xs font-bold"
        >
          <ReceiptIcon size={14} />
          {pending ? "Saving…" : "Save Sale"}
        </PrimaryButton>
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
