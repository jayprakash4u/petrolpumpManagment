"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Receipt as ReceiptIcon,
  Banknote,
  CreditCard,
  QrCode,
  CheckCircle2,
  Building2,
  Wallet,
  Car,
  Calendar,
  FileText,
  Printer,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import { FUEL_LABEL } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ReceiptCard } from "./ReceiptCard";
import { fmtBSDate } from "@/lib/bs-date";

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
  const [quantity, setQuantity] = useState("500");
  const [payment, setPayment] = useState<"CASH" | "ONLINE" | "CARD" | "CREDIT">("CREDIT");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [vehicleNo, setVehicleNo] = useState("NA 4 KHA 9021");
  const [discountAmount, setDiscountAmount] = useState("");
  const [onlineProvider, setOnlineProvider] = useState<"FONEPAY" | "ESEWA" | "KHALTI" | "MOBILE_BANKING">("FONEPAY");
  const [paymentRef, setPaymentRef] = useState("");
  const [tendered, setTendered] = useState("");
  const [shouldPrint, setShouldPrint] = useState(false);

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, quantity, rate), [mode, quantity, rate]);

  const customer = customers.find((c) => c.id === customerId);
  const overStock = calc !== null && calc.liters > stock;
  const overCredit = payment === "CREDIT" && !!customer && calc !== null && calc.total > Number(customer.headroom);
  const change = payment === "CASH" && calc && Number(tendered) >= calc.total ? Number(tendered) - calc.total : null;

  const todayBS = fmtBSDate(new Date());

  return (
    <form
      action={async (formData) => {
        await action(formData);
        if (shouldPrint) {
          setTimeout(() => window.print(), 300);
        }
      }}
      className="space-y-4"
    >
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />
      <input type="hidden" name="paymentMethod" value={payment} />

      {/* 1. Header: Customer, Date & Vehicle Information */}
      <div className="rounded-xl border border-border bg-bg p-3.5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11.5px] font-semibold text-text-muted block mb-1">
              Customer / Buyer (ग्राहक)
            </label>
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => {
                const val = e.target.value;
                setCustomerId(val);
                if (val === "") {
                  setPayment("CASH");
                } else {
                  setPayment("CREDIT");
                }
              }}
              className="w-full rounded-lg border border-border bg-surface p-2 text-xs font-semibold text-text focus:border-accent"
            >
              <option value="">Retail Walk-In Customer (Cash)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ({rs(Number(c.headroom))} credit available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11.5px] font-semibold text-text-muted block mb-1">
              Vehicle Plate No (गाडी नं.)
            </label>
            <Input
              name="vehicleNo"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              placeholder="e.g. BA 2 PA 1234 / NA 4 KHA 9021"
              className="font-mono uppercase text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/80 text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-accent" />
            <span>Invoice Date: <strong>{todayBS}</strong> (30-Aug-2026)</span>
          </div>
          <div className="font-mono text-accent font-semibold">
            Status: Ready to Bill
          </div>
        </div>
      </div>

      {/* 2. Items Line Table */}
      <div className="rounded-xl border border-border bg-surface p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Line Items (इन्धन विवरण)
          </span>
          <div className="flex gap-1 rounded-lg border border-border bg-bg p-0.5">
            {(["LITERS", "AMOUNT"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={clsx(
                  "rounded px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer",
                  mode === m ? "bg-accent text-[#1A1306]" : "text-text-muted hover:text-text"
                )}
              >
                {m === "LITERS" ? "Qty (Liters)" : "Amount (Rs)"}
              </button>
            ))}
          </div>
        </div>

        {/* Product & Qty Row */}
        <div className="grid grid-cols-12 gap-2.5 items-end">
          <div className="col-span-5">
            <label className="text-[11px] text-text-muted block mb-1">Product</label>
            <Select
              id="tankId"
              name="tankId"
              value={tankId}
              onChange={(e) => setTankId(e.target.value)}
              className="text-xs font-semibold"
            >
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {FUEL_LABEL[t.fuel]} (Rs {Number(t.ratePerL).toFixed(2)}/L)
                </option>
              ))}
            </Select>
          </div>

          <div className="col-span-4">
            <label className="text-[11px] text-text-muted block mb-1">
              {mode === "LITERS" ? "Quantity (Liters)" : "Rupees Amount"}
            </label>
            <Input
              id="quantity"
              name="quantity"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 500"
              className="font-mono font-bold text-xs"
              required
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

      {/* 3. Tax & Financial Breakdown */}
      <div className="rounded-xl border border-border bg-surface-hi p-3.5 space-y-2 text-xs font-mono">
        <div className="flex justify-between text-text-muted">
          <span>Gross Fuel Amount:</span>
          <span className="font-bold text-text">{calc ? rs(calc.total) : "Rs 0.00"}</span>
        </div>

        <div className="flex justify-between text-text-muted">
          <span>Taxable Amount (करयोग्य रकम):</span>
          <span>{calc ? rs(calc.taxable) : "Rs 0.00"}</span>
        </div>

        <div className="flex justify-between text-text-muted">
          <span>13% VAT (१३% भ्याट):</span>
          <span>{calc ? rs(calc.vat) : "Rs 0.00"}</span>
        </div>

        <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-text">
          <span className="font-sans">Grand Total (जम्मा रकम):</span>
          <span className="text-accent text-base">{calc ? rs(calc.total) : "Rs 0.00"}</span>
        </div>
      </div>

      {/* 4. Payment Method Selector */}
      <div className="space-y-2">
        <span className="text-[11.5px] font-semibold text-text-muted block">Payment Method</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { v: "CREDIT", label: "Credit (खाता)", Icon: Wallet },
              { v: "CASH", label: "Cash (नगद)", Icon: Banknote },
              { v: "ONLINE", label: "QR / Wallet", Icon: QrCode },
              { v: "CARD", label: "Card / POS", Icon: CreditCard },
            ] as const
          ).map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setPayment(v)}
              className={clsx(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-all",
                payment === v
                  ? "border-accent bg-accent/15 text-accent shadow-xs"
                  : "border-border text-text-muted hover:text-text hover:bg-surface-hi"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Online / Card Reference Inputs */}
      {payment === "ONLINE" && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <QrCode size={14} /> Fonepay / eSewa Dynamic QR
          </div>
          <Input
            name="paymentRef"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Enter Transaction Ref / Slip ID (optional)..."
            className="text-xs"
          />
        </div>
      )}

      {payment === "CASH" && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            name="cashTendered"
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
            placeholder="Cash Tendered (Rs)"
            className="text-xs font-mono"
          />
          {change !== null && change > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/10 px-3 text-xs text-success font-bold">
              <span>Change:</span>
              <span>{rs(change)}</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings & Errors */}
      {overStock && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          Insufficient fuel in tank: Only {stock.toLocaleString("en-IN")} L remaining.
        </div>
      )}
      {overCredit && customer && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          Credit limit exceeded: {customer.name} has only {rs(Number(customer.headroom))} available.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          {error}
        </div>
      )}

      {/* 5. Dual Action Buttons: SAVE and SAVE & PRINT */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <PrimaryButton
          type="submit"
          onClick={() => setShouldPrint(false)}
          disabled={pending || !calc || overStock || overCredit}
          className="w-full py-2.5 text-xs font-bold"
        >
          <ReceiptIcon size={14} />
          {pending ? "Saving…" : "Save Sale"}
        </PrimaryButton>

        <PrimaryButton
          type="submit"
          onClick={() => setShouldPrint(true)}
          disabled={pending || !calc || overStock || overCredit}
          className="w-full py-2.5 text-xs font-bold bg-accent text-[#1A1306] hover:bg-accent-hi"
        >
          <Printer size={14} />
          {pending ? "Printing…" : "Save & Print Bill"}
        </PrimaryButton>
      </div>
    </form>
  );
}
