"use client";

import { useState } from "react";
import { Zap, Banknote, Fuel as FuelIcon, ArrowRight, CornerDownLeft } from "lucide-react";
import { clsx } from "clsx";
import type { FuelType } from "@/lib/permissions";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

interface FuelOption {
  fuel: FuelType;
  label: string;
  rate: string;
  stock: string;
}

/** Preset amounts, because most cash fills at a pump are a round number of rupees. */
const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

/** Same fuel → color convention used in the Sales register, so a pump colour
 *  means the same thing everywhere in the app. */
const FUEL_TONE: Record<FuelType, { dot: string; text: string; ring: string; bg: string }> = {
  PETROL: { dot: "bg-amber-500", text: "text-amber-500", ring: "ring-amber-500/40", bg: "bg-amber-500/10" },
  DIESEL: { dot: "bg-blue-500", text: "text-blue-500", ring: "ring-blue-500/40", bg: "bg-blue-500/10" },
  CNG: { dot: "bg-emerald-500", text: "text-emerald-500", ring: "ring-emerald-500/40", bg: "bg-emerald-500/10" },
};

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

/**
 * Quick Sale — cash only, no customer, keyboard-first.
 *
 * Static: submitting only previews what would be recorded. The arithmetic
 * mirrors the real sale rules on purpose — litres round DOWN in amount mode,
 * so a customer paying Rs 500 never receives more fuel than their money
 * covers — so the preview will not change meaning when the action is wired up.
 */
export function QuickSaleForm({ fuels }: { fuels: FuelOption[] }) {
  const [fuel, setFuel] = useState(fuels[0]);
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState<{ fuel: string; liters: string; total: string } | null>(null);

  const tone = FUEL_TONE[fuel.fuel] ?? FUEL_TONE.PETROL;
  const rate = Number(fuel.rate);
  const entered = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(entered) && entered > 0;

  const liters = valid ? Math.floor((entered / rate) * 100) / 100 : 0;
  const total = valid ? Math.round(liters * rate * 100) / 100 : 0;
  const change = valid && total < entered ? Math.round((entered - total) * 100) / 100 : 0;

  const record = () => {
    if (!valid) return;
    setSubmitted({ fuel: fuel.label, liters: `${liters.toFixed(2)} L`, total: rs(total) });
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        record();
      }}
    >
      {/* Fuel picker */}
      <div>
        <span className="mb-2 block text-[11.5px] font-semibold uppercase tracking-wide text-text-muted">
          Fuel
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          {fuels.map((f) => {
            const t = FUEL_TONE[f.fuel] ?? FUEL_TONE.PETROL;
            const active = f.fuel === fuel.fuel;
            return (
              <button
                key={f.fuel}
                type="button"
                onClick={() => {
                  setFuel(f);
                  setSubmitted(null);
                }}
                aria-pressed={active}
                className={clsx(
                  "group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border px-3 py-3.5 text-center transition-all duration-150",
                  active
                    ? clsx("border-transparent shadow-sm ring-2", t.bg, t.ring)
                    : "border-border bg-bg hover:border-text-muted/40 hover:bg-surface-hi"
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    active ? clsx(t.bg, t.text) : "bg-border/60 text-text-muted group-hover:text-text"
                  )}
                >
                  <FuelIcon size={15} />
                </span>
                <span className={clsx("font-display text-[13.5px] font-bold", active ? t.text : "text-text")}>
                  {f.label}
                </span>
                <span className="font-data text-[11px] text-text-muted">Rs {f.rate}/L</span>
                <span className="font-data text-[10px] text-text-muted/70">{f.stock} L in tank</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount input */}
      <div>
        <Field label="Amount paid" htmlFor="quickAmount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.25 top-1/2 -translate-y-1/2 font-data text-[18px] font-semibold text-text-muted">
              Rs
            </span>
            <Input
              id="quickAmount"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSubmitted(null);
              }}
              placeholder="500"
              className="py-3 pl-10.5 text-[22px] font-bold tracking-tight"
            />
          </div>
        </Field>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESET_AMOUNTS.map((p) => {
            const active = amount.trim() !== "" && entered === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setAmount(String(p));
                  setSubmitted(null);
                }}
                className={clsx(
                  "rounded-full border px-3 py-1 font-data text-[12px] font-semibold transition-colors cursor-pointer",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-muted hover:border-text-muted/50 hover:text-text"
                )}
              >
                {rs(p)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dispense preview */}
      <div
        className={clsx(
          "rounded-xl border px-4 py-3.5 transition-colors",
          valid ? clsx(tone.bg, "border-transparent") : "border-dashed border-border bg-bg"
        )}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-medium text-text-muted">Will dispense</span>
          <span className={clsx("font-data text-[28px] font-bold leading-none", valid ? tone.text : "text-text-muted/50")}>
            {valid ? liters.toFixed(2) : "0.00"}
            <span className="ml-1 text-[15px] font-semibold">L</span>
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between border-t border-dashed border-border/60 pt-1.5 text-[12px] text-text-muted">
          <span>{valid ? `${fuel.label} @ Rs ${rate.toFixed(2)}/L` : "Enter an amount to preview"}</span>
          {change > 0 && (
            // Litres round down, so there is nearly always a few paisa of change.
            <span className="font-data font-semibold text-text">Change {rs(change)}</span>
          )}
        </div>
      </div>

      <PrimaryButton
        type="submit"
        disabled={!valid}
        className="w-full gap-2 py-3.5 text-[14.5px] shadow-sm"
      >
        <Zap size={16} className="fill-current" />
        {valid ? `Record ${rs(total)} — ${liters.toFixed(2)} L` : "Record Sale"}
        {valid && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-normal opacity-70">
            <CornerDownLeft size={12} /> Enter
          </span>
        )}
      </PrimaryButton>

      {submitted && (
        <div className="animate-fade-in flex items-start gap-2.5 rounded-xl border border-dashed border-accent/40 bg-accent/8 px-4 py-3">
          <Banknote size={16} className="mt-0.5 shrink-0 text-accent" />
          <div className="text-[12.5px] text-text">
            <div className="flex items-center gap-1.5 font-display font-semibold text-accent">
              Preview only <ArrowRight size={12} />
            </div>
            <p className="mt-0.5 text-text-muted">
              Would record <strong className="text-text">{submitted.liters}</strong> of{" "}
              <strong className="text-text">{submitted.fuel}</strong> for{" "}
              <strong className="text-text">{submitted.total}</strong>. Nothing was saved — this screen isn&apos;t
              wired to the database yet.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
