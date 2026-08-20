"use client";

import { useActionState, useMemo, useState } from "react";
import { Receipt as ReceiptIcon, Banknote, CreditCard } from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption, CustomerOption } from "@/lib/queries/sales";
import { FUEL_LABEL } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { ReceiptCard } from "./ReceiptCard";

const initialState: SaleFormState = {};

/**
 * Live preview only. The numbers shown here are computed in plain JS for
 * responsiveness, but the sale is *always* re-derived server-side from the
 * database's own rate (src/lib/sale-math.ts) — nothing the browser computes
 * is trusted or stored. Mirrors deriveSale(): litres round down in AMOUNT
 * mode, and the total is litres x rate, never the figure typed in.
 */
function preview(mode: "LITERS" | "AMOUNT", raw: string, rate: number) {
  const n = Number(raw);
  if (!raw.trim() || !Number.isFinite(n) || n <= 0 || rate <= 0) return null;
  const liters = mode === "LITERS" ? n : Math.floor((n / rate) * 100) / 100;
  return { liters, total: Math.round(liters * rate * 100) / 100 };
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
    <>
      {/*
        Keying on the receipt number resets every field the moment a sale
        lands, so the next customer is served on a clean form. React's own
        "reset state with a key" pattern — no effect, and crucially the
        fields survive untouched when the action comes back with an *error*,
        since the key only changes on success.
      */}
      <SaleFields
        key={state.receipt?.receiptNo ?? "pending"}
        tanks={tanks}
        customers={customers}
        action={action}
        pending={pending}
        error={state.error}
      />

      {state.receipt && <ReceiptCard receipt={state.receipt} />}
    </>
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
  const [payment, setPayment] = useState<"CASH" | "CREDIT">("CASH");
  const [customerId, setCustomerId] = useState("");
  const [tendered, setTendered] = useState("");

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const rate = Number(tank?.ratePerL ?? 0);
  const stock = Number(tank?.levelL ?? 0);
  const calc = useMemo(() => preview(mode, quantity, rate), [mode, quantity, rate]);

  const customer = customers.find((c) => c.id === customerId);
  const overStock = calc !== null && calc.liters > stock;
  const overCredit = payment === "CREDIT" && !!customer && calc !== null && calc.total > Number(customer.headroom);
  const change = payment === "CASH" && calc && Number(tendered) >= calc.total ? Number(tendered) - calc.total : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />
      {/* Pins the price the operator was shown; the action refuses the sale if the tank's rate has moved since. */}
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />

      <Field label="Fuel" htmlFor="tankId">
        <Select id="tankId" name="tankId" value={tankId} onChange={(e) => setTankId(e.target.value)}>
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              {FUEL_LABEL[t.fuel]} — Rs {Number(t.ratePerL).toFixed(2)}/L
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-text-muted">Enter by</span>
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {(["LITERS", "AMOUNT"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={clsx(
                  "font-display cursor-pointer rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                  mode === m ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text"
                )}
              >
                {m === "LITERS" ? "Litres" : "Amount"}
              </button>
            ))}
          </div>
        </div>
        <Input
          id="quantity"
          name="quantity"
          inputMode="decimal"
          autoFocus
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={mode === "LITERS" ? "40" : "500"}
        />
        <p className="mt-1 text-[11.5px] text-text-muted">
          {mode === "LITERS" ? "Litres dispensed" : "Rupees paid — litres are rounded down to the nearest 0.01 L"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] text-text-muted">Total</span>
          <span className="font-data text-[22px] font-semibold text-accent">{calc ? rs(calc.total) : "—"}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-[12px] text-text-muted">
          <span>{calc ? `${calc.liters.toFixed(2)} L @ Rs ${rate.toFixed(2)}/L` : "Enter a quantity"}</span>
          <span className={clsx("font-data", overStock && "text-error")}>{stock.toLocaleString("en-IN")} L in tank</span>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Payment</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { v: "CASH", label: "Cash", Icon: Banknote },
              { v: "CREDIT", label: "Credit", Icon: CreditCard },
            ] as const
          ).map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setPayment(v)}
              aria-pressed={payment === v}
              className={clsx(
                "font-display flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-colors",
                payment === v ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text"
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="paymentMethod" value={payment} />
      </div>

      {payment === "CREDIT" ? (
        <Field label="Credit customer" htmlFor="customerId">
          <Select
            id="customerId"
            name="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {rs(Number(c.headroom))} available
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Cash tendered (optional)" htmlFor="cashTendered">
          <Input
            id="cashTendered"
            name="cashTendered"
            inputMode="decimal"
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
            placeholder="500"
          />
        </Field>
      )}

      {change !== null && change > 0 && (
        <div className="rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[13px] text-success">
          Change to return: <span className="font-data font-semibold">{rs(change)}</span>
        </div>
      )}

      {/* Client-side warnings mirror the server's rules so the operator sees
          the problem before submitting; the server still enforces both. */}
      {overStock && (
        <div className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          Only {stock.toLocaleString("en-IN")} L left in this tank.
        </div>
      )}
      {overCredit && customer && (
        <div className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {customer.name} has only {rs(Number(customer.headroom))} of credit available.
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error"
        >
          {error}
        </div>
      )}

      <PrimaryButton
        type="submit"
        disabled={pending || !calc || overStock || overCredit}
        className="w-full py-3 text-[14.5px]"
      >
        <ReceiptIcon size={16} />
        {pending ? "Recording…" : calc ? `Record Sale — ${rs(calc.total)}` : "Record Sale"}
      </PrimaryButton>
    </form>
  );
}
