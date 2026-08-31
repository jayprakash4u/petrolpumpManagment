"use client";

import { useActionState, useMemo, useState } from "react";
import { Zap, CornerDownLeft } from "lucide-react";
import { clsx } from "clsx";
import { recordSaleAction, type SaleFormState } from "@/lib/actions/sales";
import type { TankOption } from "@/lib/queries/sales";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";
import { ReceiptCard } from "@/components/sales/ReceiptCard";

/**
 * Fuel gets only a small identifying dot, the same amber/blue/emerald
 * convention as the Sales register — everything that means "selected" (the
 * tile ring, the fuel bar, the Save button) stays the app's one accent
 * color, the same as every other selectable control in this app (New
 * Sale's payment-method buttons, the fuel Select there, etc.).
 */
const FUEL_DOT: Record<FuelId, string> = {
  PETROL: "bg-amber-500",
  DIESEL: "bg-blue-500",
  CNG: "bg-emerald-500",
};

function preview(mode: "LITERS" | "AMOUNT", raw: string, rate: number) {
  const n = Number(raw);
  if (!raw.trim() || !Number.isFinite(n) || n <= 0 || rate <= 0) return null;
  const liters = mode === "LITERS" ? n : Math.floor((n / rate) * 100) / 100;
  const total = Math.round(liters * rate * 100) / 100;
  return { liters, total };
}

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const initialState: SaleFormState = {};

/**
 * Quick Sale — a lean, single-column ticket for a queue at the pump: pick a
 * fuel, type litres or an amount (whichever's easier — the other side fills
 * itself in), a name and plate if the customer gives one, done. Records a
 * real cash/card/online sale through the same `recordSaleAction` the full
 * New Sale form uses — credit is deliberately left out here, that still
 * needs the full customer picker on New Sale.
 */
export function QuickSaleForm({ tanks }: { tanks: TankOption[] }) {
  const [state, action, pending] = useActionState(recordSaleAction, initialState);

  return (
    <div className="space-y-4">
      <QuickSaleFields key={state.receipt?.receiptNo ?? "pending"} tanks={tanks} action={action} pending={pending} error={state.error} />
      {state.receipt && <ReceiptCard receipt={state.receipt} />}
    </div>
  );
}

function QuickSaleFields({
  tanks,
  action,
  pending,
  error,
}: {
  tanks: TankOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
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

  const litersValue = mode === "LITERS" ? raw : calc ? calc.liters.toFixed(2) : "";
  const amountValue = mode === "AMOUNT" ? raw : calc ? calc.total.toFixed(2) : "";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tankId" value={tankId} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="quantity" value={raw} />
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      {/* Fuel picker */}
      <div className="grid grid-cols-3 gap-2.5">
        {tanks.map((t) => {
          const fuelId = t.fuel as FuelId;
          const label = FUEL_LABEL[fuelId] ?? t.fuel;
          const active = t.id === tankId;
          return (
            <label
              key={t.id}
              className={clsx(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2.5 py-3 text-center transition-all",
                active ? "border-transparent bg-accent/10 shadow-sm ring-2 ring-accent/40" : "border-border bg-bg hover:border-text-muted/40"
              )}
            >
              <input
                type="radio"
                name="fuelPick"
                className="sr-only"
                checked={active}
                onChange={() => setTankId(t.id)}
              />
              <span className="flex items-center gap-1.5">
                <span className={clsx("h-1.5 w-1.5 rounded-full", FUEL_DOT[fuelId] ?? FUEL_DOT.PETROL)} />
                <span className={clsx("font-display text-[12.5px] font-bold", active ? "text-accent" : "text-text")}>{label}</span>
              </span>
              <span className="font-data text-[14px] font-bold text-text">{Number(t.ratePerL).toFixed(2)}</span>
              <span className="font-data text-[10px] text-text-muted">Rs / L</span>
            </label>
          );
        })}
      </div>

      {/* Selected fuel bar */}
      {tank && (
        <div className="rounded-lg bg-accent py-2 text-center font-display text-[13.5px] font-bold text-[#1A1306]">
          {FUEL_LABEL[tank.fuel as FuelId] ?? tank.fuel}
        </div>
      )}

      {/* Litres / Amount — editing either fills in the other */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Litres" htmlFor="qsLiters">
          <Input
            id="qsLiters"
            inputMode="decimal"
            autoFocus
            value={litersValue}
            onChange={(e) => {
              setMode("LITERS");
              setRaw(e.target.value);
            }}
            placeholder="0.00"
            className="font-data text-[16px] font-bold"
          />
        </Field>
        <Field label="Total Amount" htmlFor="qsAmount">
          <Input
            id="qsAmount"
            inputMode="decimal"
            value={amountValue}
            onChange={(e) => {
              setMode("AMOUNT");
              setRaw(e.target.value);
            }}
            placeholder="0.00"
            className="font-data text-[16px] font-bold"
          />
        </Field>
      </div>

      <Field label="Name (optional)" htmlFor="qsName">
        <Input id="qsName" name="buyerName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Walk-in customer" />
      </Field>

      <Field label="Vehicle No (optional)" htmlFor="qsVehicle">
        <Input
          id="qsVehicle"
          name="vehicleNo"
          value={vehicleNo}
          onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
          placeholder="BA 2 PA 1234"
          className="font-mono uppercase"
        />
      </Field>

      <div>
        <label className="mb-1 block text-[12.5px] font-medium text-text-muted" htmlFor="qsPayment">
          Payment Method
        </label>
        <select
          id="qsPayment"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
          className="w-full rounded-lg border border-border bg-bg p-2.5 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value="CASH">Cash</option>
          <option value="ONLINE">QR / Wallet</option>
          <option value="CARD">Card / POS</option>
        </select>
      </div>

      {overStock && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">
          Only {stock.toLocaleString("en-IN")} L left in tank — reduce the quantity.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-error/30 bg-error/8 p-2.5 text-xs text-error">{error}</div>
      )}

      <PrimaryButton type="submit" disabled={pending || !calc || overStock} className="w-full gap-2 py-3.5 text-[14.5px] font-bold shadow-sm">
        <Zap size={16} className="fill-current" />
        {pending ? "Saving…" : calc ? `Save — ${rs(calc.total)} · ${calc.liters.toFixed(2)} L` : "Save"}
        {calc && !pending && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-normal opacity-70">
            <CornerDownLeft size={12} /> Enter
          </span>
        )}
      </PrimaryButton>
    </form>
  );
}
