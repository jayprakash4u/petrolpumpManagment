"use client";

import { useState } from "react";
import { Zap, Banknote } from "lucide-react";
import { clsx } from "clsx";
import type { FuelType } from "@prisma/client";
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

  const rate = Number(fuel.rate);
  const entered = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(entered) && entered > 0;

  const liters = valid ? Math.floor((entered / rate) * 100) / 100 : 0;
  const total = valid ? Math.round(liters * rate * 100) / 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium text-text-muted">Fuel</span>
        <div className="grid grid-cols-3 gap-2">
          {fuels.map((f) => (
            <button
              key={f.fuel}
              type="button"
              onClick={() => {
                setFuel(f);
                setSubmitted(null);
              }}
              aria-pressed={f.fuel === fuel.fuel}
              className={clsx(
                "font-display flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2.5 transition-colors",
                f.fuel === fuel.fuel
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:text-text"
              )}
            >
              <span className="text-[13.5px] font-semibold">{f.label}</span>
              <span className="font-data text-[11px] opacity-80">Rs {f.rate}/L</span>
            </button>
          ))}
        </div>
        <p className="mt-1 font-data text-[11.5px] text-text-muted">{fuel.stock} L in tank</p>
      </div>

      <div>
        <Field label="Amount paid (Rs)" htmlFor="quickAmount">
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
            className="text-[18px]"
          />
        </Field>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESET_AMOUNTS.map((p) => (
            <GhostButton
              key={p}
              type="button"
              onClick={() => {
                setAmount(String(p));
                setSubmitted(null);
              }}
              className="px-2.5 py-1 text-[12px]"
            >
              {rs(p)}
            </GhostButton>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg px-4 py-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] text-text-muted">Dispense</span>
          <span className="font-data text-[24px] font-semibold text-accent">
            {valid ? `${liters.toFixed(2)} L` : "—"}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between text-[12px] text-text-muted">
          <span>{valid ? `${fuel.label} @ Rs ${rate.toFixed(2)}/L` : "Enter an amount"}</span>
          {valid && total < entered && (
            // Litres round down, so there is nearly always a few paisa of change.
            <span className="font-data">change {rs(Math.round((entered - total) * 100) / 100)}</span>
          )}
        </div>
      </div>

      <PrimaryButton
        type="button"
        disabled={!valid}
        onClick={() => setSubmitted({ fuel: fuel.label, liters: `${liters.toFixed(2)} L`, total: rs(total) })}
        className="w-full py-3 text-[14.5px]"
      >
        <Zap size={16} />
        {valid ? `Record ${rs(total)} — ${liters.toFixed(2)} L` : "Record Sale"}
      </PrimaryButton>

      {submitted && (
        <div className="animate-fade-in flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/8 px-3 py-2.5">
          <Banknote size={15} className="mt-0.5 shrink-0 text-accent" />
          <div className="text-[12.5px] text-text">
            <strong className="font-semibold">Preview only.</strong> Would record {submitted.liters} of{" "}
            {submitted.fuel} for {submitted.total}. Nothing was saved — this screen is not wired to the database yet.
          </div>
        </div>
      )}
    </div>
  );
}
