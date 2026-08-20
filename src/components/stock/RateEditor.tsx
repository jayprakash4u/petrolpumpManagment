"use client";

import { useActionState, useState } from "react";
import { IndianRupee, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { updateFuelRateAction, type RateFormState } from "@/lib/actions/stock";
import type { StockTankOption } from "@/lib/queries/stock";
import { FUEL_LABEL } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: RateFormState = {};

/** Mirrors rateChangePercent() for the live prompt. The server recomputes and re-enforces it. */
function changePct(oldRate: number, next: string) {
  const n = Number(next);
  if (!next.trim() || !Number.isFinite(n) || oldRate <= 0) return null;
  return ((n - oldRate) / oldRate) * 100;
}

export function RateEditor({ tanks, canEdit }: { tanks: StockTankOption[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState(updateFuelRateAction, initialState);

  if (!canEdit) {
    return (
      <p className="rounded-lg border border-border bg-bg px-4 py-3 text-[13.5px] text-text-muted">
        Only an owner or manager can change fuel rates.
      </p>
    );
  }

  return (
    <>
      {/* Reset the fields after a successful save, but keep them on an error so the manager can correct the value. */}
      <RateFields key={state.message ?? "editing"} tanks={tanks} action={action} pending={pending} error={state.error} />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function RateFields({
  tanks,
  action,
  pending,
  error,
}: {
  tanks: StockTankOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const [tankId, setTankId] = useState(tanks[0]?.id ?? "");
  const [newRate, setNewRate] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const currentRate = Number(tank?.ratePerL ?? 0);
  const pct = changePct(currentRate, newRate);
  const isLarge = pct !== null && Math.abs(pct) >= 20;
  const unchanged = pct === 0;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="expectedRate" value={tank?.ratePerL ?? ""} />

      <Field label="Fuel" htmlFor="rateTankId">
        <Select id="rateTankId" name="tankId" value={tankId} onChange={(e) => setTankId(e.target.value)}>
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              {FUEL_LABEL[t.fuel]} — currently Rs {Number(t.ratePerL).toFixed(2)}/L
            </option>
          ))}
        </Select>
      </Field>

      <Field label="New rate per litre" htmlFor="newRate">
        <Input
          id="newRate"
          name="newRate"
          inputMode="decimal"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          placeholder={currentRate.toFixed(2)}
        />
      </Field>

      {pct !== null && !unchanged && (
        <div
          className={clsx(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]",
            isLarge ? "border-error/30 bg-error/8 text-error" : "border-border bg-bg text-text-muted"
          )}
        >
          {pct > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {pct > 0 ? "Raising" : "Cutting"} {FUEL_LABEL[tank.fuel]} by {Math.abs(pct).toFixed(2)}% — Rs{" "}
          {currentRate.toFixed(2)} → Rs {Number(newRate).toFixed(2)}
        </div>
      )}

      {isLarge && (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2.5 text-[12.5px] text-text">
          <input
            type="checkbox"
            name="confirmedLarge"
            value="yes"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-[color:var(--color-accent)]"
          />
          <span>
            This is an unusually large change. Confirm it&apos;s intentional — every sale from now on bills at the new
            rate.
          </span>
        </label>
      )}

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton
        type="submit"
        disabled={pending || pct === null || unchanged || (isLarge && !confirmed)}
        className="w-full py-2.5"
      >
        <IndianRupee size={15} />
        {pending ? "Saving…" : "Update Rate"}
      </PrimaryButton>
    </form>
  );
}
