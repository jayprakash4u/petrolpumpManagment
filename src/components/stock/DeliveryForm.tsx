"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TruckIcon, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { recordDeliveryAction, type DeliveryFormState } from "@/lib/actions/stock";
import type { StockTankOption } from "@/lib/queries/stock";
import type { Supplier } from "@/lib/purchases";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";
import { FUEL_LABEL } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: DeliveryFormState = {};

// Same key SuppliersTable.tsx saves to — there's no server-side supplier
// store yet, so this is the one place a station's supplier list actually
// lives. Reading it here is what makes "the suppliers I added" show up.
const SUPPLIERS_STORAGE_KEY = "fsm_suppliers";
const OTHER_SUPPLIER = "__other__";

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function DeliveryForm({ tanks }: { tanks: StockTankOption[] }) {
  const [state, action, pending] = useActionState(recordDeliveryAction, initialState);

  return (
    <>
      {/* Cleared on success, preserved on error — same pattern as the sale form. */}
      <DeliveryFields
        key={state.message ?? "entering"}
        tanks={tanks}
        action={action}
        pending={pending}
        error={state.error}
      />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function DeliveryFields({
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
  const [liters, setLiters] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [supplierChoice, setSupplierChoice] = useState("");
  const [customSupplier, setCustomSupplier] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setSuppliers(parsed);
      }
    } catch {}
  }, []);

  const activeSuppliers = suppliers.filter((s) => s.active);
  const supplierName = supplierChoice === OTHER_SUPPLIER ? customSupplier : supplierChoice;

  const tank = tanks.find((t) => t.id === tankId) ?? tanks[0];
  const room = Number(tank?.room ?? 0);
  const level = Number(tank?.levelL ?? 0);
  const rate = Number(tank?.ratePerL ?? 0);

  const derived = useMemo(() => {
    const l = Number(liters);
    const c = Number(totalCost);
    if (!liters.trim() || !Number.isFinite(l) || l <= 0) return null;
    const costPerL = totalCost.trim() && Number.isFinite(c) && c >= 0 ? c / l : null;
    return { liters: l, costPerL, margin: costPerL === null ? null : rate - costPerL, levelAfter: level + l };
  }, [liters, totalCost, rate, level]);

  const overCapacity = derived !== null && derived.liters > room;

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Fuel" htmlFor="deliveryTankId">
        <Select id="deliveryTankId" name="tankId" value={tankId} onChange={(e) => setTankId(e.target.value)}>
          {tanks.map((t) => (
            <option key={t.id} value={t.id}>
              {FUEL_LABEL[t.fuel]} — {Number(t.room).toLocaleString("en-IN")} L room
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Volume delivered (litres)" htmlFor="liters">
        <Input
          id="liters"
          name="liters"
          inputMode="decimal"
          value={liters}
          onChange={(e) => setLiters(e.target.value)}
          placeholder="5000"
        />
      </Field>

      <Field label="Invoice total" htmlFor="totalCost">
        <Input
          id="totalCost"
          name="totalCost"
          inputMode="decimal"
          value={totalCost}
          onChange={(e) => setTotalCost(e.target.value)}
          placeholder="475000"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Supplier" htmlFor="supplier">
          <Select
            id="supplier"
            value={supplierChoice}
            onChange={(e) => setSupplierChoice(e.target.value)}
          >
            <option value="" disabled>
              Choose a supplier…
            </option>
            {activeSuppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
            <option value={OTHER_SUPPLIER}>Other (not listed)…</option>
          </Select>
        </Field>
        <Field label="Invoice no. (optional)" htmlFor="invoiceNo">
          <Input id="invoiceNo" name="invoiceNo" placeholder="NOC-4821" />
        </Field>
      </div>

      {supplierChoice === OTHER_SUPPLIER && (
        <Field label="Supplier name" htmlFor="customSupplier">
          <Input
            id="customSupplier"
            value={customSupplier}
            onChange={(e) => setCustomSupplier(e.target.value)}
            placeholder="Not yet in your supplier directory"
            autoFocus
          />
        </Field>
      )}

      <input type="hidden" name="supplier" value={supplierName} />

      <p className="text-[11px] text-text-muted">
        Managing suppliers? <Link href="/purchases/suppliers" className="text-accent hover:underline">Open the supplier directory</Link>.
      </p>

      <div className="rounded-xl border border-border bg-bg px-4 py-3 text-[12px]">
        <div className="flex items-baseline justify-between">
          <span className="text-text-muted">Cost per litre</span>
          <span className="font-data text-[15px] font-semibold text-accent">
            {derived?.costPerL != null ? rs(derived.costPerL) : "—"}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-text-muted">Margin at Rs {rate.toFixed(2)}/L pump rate</span>
          <span
            className={clsx(
              "font-data font-semibold",
              derived?.margin == null ? "text-text-muted" : derived.margin < 0 ? "text-error" : "text-success"
            )}
          >
            {derived?.margin != null ? rs(derived.margin) + "/L" : "—"}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between border-t border-border pt-1.5">
          <span className="text-text-muted">Tank after delivery</span>
          <span className={clsx("font-data", overCapacity ? "text-error" : "text-text")}>
            {derived ? derived.levelAfter.toLocaleString("en-IN") : level.toLocaleString("en-IN")} L
          </span>
        </div>
      </div>

      {derived?.margin != null && derived.margin < 0 && !overCapacity && (
        <div className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          This fuel costs more than it sells for — the pump rate is below cost.
        </div>
      )}

      {overCapacity && (
        <div className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          Only {room.toLocaleString("en-IN")} L of room in this tank.
        </div>
      )}

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton
        type="submit"
        disabled={pending || !derived || overCapacity || supplierName.trim().length < 2}
        className="w-full py-2.5"
      >
        <TruckIcon size={15} />
        {pending ? "Recording…" : "Record Delivery"}
      </PrimaryButton>
    </form>
  );
}
