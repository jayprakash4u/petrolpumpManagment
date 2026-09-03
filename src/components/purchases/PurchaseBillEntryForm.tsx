"use client";

import { useActionState, useMemo, useState } from "react";
import { Fuel, ShieldCheck, Truck as TruckIcon, CheckCircle2, Upload, Lock } from "lucide-react";
import { recordPurchaseBillAction, type PurchaseBillState } from "@/lib/actions/purchase-bill";
import type { FuelPurchasesPageData } from "@/lib/queries/fuel-purchases";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { Field, Input, Select } from "@/components/ui/Field";
import { BSDateField } from "@/components/ui/BSDateField";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

type TankOption = FuelPurchasesPageData["tankOptions"][number];

const initialState: PurchaseBillState = {};
const VAT_RATE = 0.13;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Every NOC fuel bill this station receives is from the same registered
// supplier — fixed rather than picked, so it can never be left blank or
// mistyped on a bill.
const FIXED_SUPPLIER_NAME = "Nepal Oil Co-operations Ltd";
const FIXED_SUPPLIER_PAN = "300047060";

const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fieldBase =
  "w-full rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm text-text placeholder:text-text-muted/60";

const fileInputClass =
  "block w-full text-[12.5px] text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-accent hover:file:bg-accent/25";

export function PurchaseBillEntryForm({ tanks }: { tanks: TankOption[] }) {
  const [state, action, pending] = useActionState(recordPurchaseBillAction, initialState);

  return (
    <>
      <PurchaseBillFields key={state.message ?? "entering"} tanks={tanks} action={action} pending={pending} error={state.error} />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function useDataUrlUpload(maxBytes: number, onError: (msg: string | null) => void) {
  const [dataUrl, setDataUrl] = useState("");
  const [fileName, setFileName] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxBytes) {
      onError(`File must be under ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`);
      e.target.value = "";
      return;
    }
    onError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDataUrl((ev.target?.result as string) || "");
    reader.readAsDataURL(file);
  };

  return { dataUrl, fileName, handleChange };
}

function PurchaseBillFields({
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
  const [purchaseDateBS, setPurchaseDateBS] = useState("");
  const [tankAId, setTankAId] = useState(tanks[0]?.id ?? "");
  const [tankerNo, setTankerNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [density, setDensity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ratePerL, setRatePerL] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [insuranceBillNo, setInsuranceBillNo] = useState("");
  const [insuranceCost, setInsuranceCost] = useState("");
  // Nepal's fixed stamp duty on an insurance bill — pre-filled so the common
  // case needs no typing; still editable if a bill genuinely carries more.
  const [insuranceStamp, setInsuranceStamp] = useState("20");

  const [transporterName, setTransporterName] = useState("");
  const [transportBillNo, setTransportBillNo] = useState("");
  const [transportCost, setTransportCost] = useState("");

  const [remarks, setRemarks] = useState("");

  const invoiceImage = useDataUrlUpload(MAX_IMAGE_BYTES, setUploadError);
  const scannedBill = useDataUrlUpload(MAX_IMAGE_BYTES, setUploadError);

  const calc = useMemo(() => {
    const q = Number(quantity);
    const r = Number(ratePerL);
    if (!quantity.trim() || !ratePerL.trim() || !Number.isFinite(q) || !Number.isFinite(r) || q <= 0 || r <= 0) return null;
    const subTotal = Math.round(q * r * 100) / 100;
    const vat = Math.round(subTotal * VAT_RATE * 100) / 100;
    return { subTotal, vat, grandTotal: subTotal + vat };
  }, [quantity, ratePerL]);

  const tankA = tanks.find((t) => t.id === tankAId);
  const currentLevel = Number(tankA?.levelL ?? 0);
  const capacity = Number(tankA?.capacityL ?? 0);
  const qtyNum = Number(quantity);
  const levelAfter = Number.isFinite(qtyNum) && qtyNum > 0 ? currentLevel + qtyNum : null;
  const overCapacity = levelAfter !== null && levelAfter > capacity;

  // The stamp field carries a default value, so its presence alone doesn't
  // mean there's an insurance bill — only a bill number or a cost does.
  const hasInsurance = !!insuranceBillNo.trim() || !!insuranceCost.trim();
  // VAT applies to the insurance premium itself, not the government stamp duty.
  const insuranceVat = hasInsurance ? Math.round(Number(insuranceCost || 0) * VAT_RATE * 100) / 100 : null;
  const insuranceTotal = hasInsurance
    ? (Number(insuranceCost || 0) + (insuranceVat ?? 0) + Number(insuranceStamp || 0)).toFixed(2)
    : null;

  const hasTransport = !!transporterName.trim() || !!transportBillNo.trim() || !!transportCost.trim();
  const transportVat = hasTransport ? Math.round(Number(transportCost || 0) * VAT_RATE * 100) / 100 : null;
  const transportTotalDisplay = hasTransport ? Number(transportCost || 0) + (transportVat ?? 0) : null;

  const isValid =
    !!purchaseDateBS.trim() &&
    !!tankAId &&
    !!tankerNo.trim() &&
    !!invoiceNo.trim() &&
    calc !== null &&
    !overCapacity;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="purchaseDateBS" value={purchaseDateBS} />
      <input type="hidden" name="tankAId" value={tankAId} />
      <input type="hidden" name="tankerNo" value={tankerNo} />
      <input type="hidden" name="invoiceNo" value={invoiceNo} />
      <input type="hidden" name="supplier" value={FIXED_SUPPLIER_NAME} />
      <input type="hidden" name="supplierPan" value={FIXED_SUPPLIER_PAN} />
      <input type="hidden" name="density" value={density} />
      <input type="hidden" name="temperature" value={temperature} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="ratePerL" value={ratePerL} />
      <input type="hidden" name="invoiceImage" value={invoiceImage.dataUrl} />
      <input type="hidden" name="scannedBill" value={scannedBill.dataUrl} />
      <input type="hidden" name="insuranceBillNo" value={insuranceBillNo} />
      <input type="hidden" name="insuranceCost" value={insuranceCost} />
      <input type="hidden" name="insuranceStamp" value={insuranceStamp} />
      <input type="hidden" name="transporterName" value={transporterName} />
      <input type="hidden" name="transportBillNo" value={transportBillNo} />
      <input type="hidden" name="transportCost" value={transportCost} />
      <input type="hidden" name="remarks" value={remarks} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Purchase Date (in Nepali, BS)" htmlFor="pbDate">
          <BSDateField id="pbDate" value={purchaseDateBS} onChange={setPurchaseDateBS} className="font-mono" />
        </Field>
        <Field label="Invoice / Bill Number" htmlFor="pbInvoiceNo">
          <Input id="pbInvoiceNo" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        </Field>
      </div>

      {/* --- NOC Fuel Purchase --- */}
      <section className="rounded-xl border border-border bg-bg/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-text">
          <Fuel size={16} className="text-accent" />
          <h3 className="font-display text-[13.5px] font-bold uppercase tracking-wide">NOC Fuel Purchase</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tank / Fuel" htmlFor="pbTankA">
            <Select id="pbTankA" value={tankAId} onChange={(e) => setTankAId(e.target.value)}>
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {FUEL_LABEL[t.fuel as FuelId] ?? t.fuel} — {Number(t.levelL).toLocaleString("en-IN")} /{" "}
                  {Number(t.capacityL).toLocaleString("en-IN")} L in stock
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tanker No." htmlFor="pbTankerNo">
            <Input id="pbTankerNo" value={tankerNo} onChange={(e) => setTankerNo(e.target.value.toUpperCase())} className="font-mono uppercase" />
          </Field>

          <div>
            <span className="mb-1 flex items-center gap-1 text-[12.5px] font-medium text-text-muted">
              <Lock size={11} /> Supplier
            </span>
            <div className={fieldBase + " flex items-center justify-between text-text"}>
              <span className="font-semibold">{FIXED_SUPPLIER_NAME}</span>
              <span className="text-[11px] text-text-muted">PAN {FIXED_SUPPLIER_PAN}</span>
            </div>
          </div>

          <Field label="Density" htmlFor="pbDensity">
            <Input id="pbDensity" inputMode="decimal" value={density} onChange={(e) => setDensity(e.target.value)} />
          </Field>

          <Field label="Temperature °C" htmlFor="pbTemp">
            <Input id="pbTemp" inputMode="decimal" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
          </Field>

          <Field label="Quantity Purchased (L)" htmlFor="pbQty">
            <Input id="pbQty" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono" />
          </Field>

          <Field label="Rate — without VAT (Rs/L)" htmlFor="pbRate">
            <Input id="pbRate" inputMode="decimal" value={ratePerL} onChange={(e) => setRatePerL(e.target.value)} className="font-mono" />
          </Field>
        </div>

        {tankA && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[12.5px]">
            <span className="text-text-muted">Tank stock: current → after this purchase</span>
            <span className="font-mono font-bold">
              <span className="text-text">{currentLevel.toLocaleString("en-IN")} L</span>
              <span className="mx-1.5 text-text-muted">→</span>
              <span className={overCapacity ? "text-error" : "text-success"}>
                {levelAfter !== null ? levelAfter.toLocaleString("en-IN") : currentLevel.toLocaleString("en-IN")} L
              </span>
              <span className="ml-1 text-text-muted">/ {capacity.toLocaleString("en-IN")} L</span>
            </span>
          </div>
        )}

        {overCapacity && (
          <div className="mt-2 rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
            That is more than the tank can hold — only {(capacity - currentLevel).toLocaleString("en-IN")} L of room left.
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">Upload Invoice Image</span>
            <input type="file" accept="image/*" onChange={invoiceImage.handleChange} className={fileInputClass} />
          </div>
          <div>
            <span className="mb-1 block text-[12.5px] font-medium text-text-muted">Upload Scanned Purchase Bill</span>
            <input type="file" accept="image/*" onChange={scannedBill.handleChange} className={fileInputClass} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2.5 rounded-lg border border-accent/30 bg-accent/5 p-3 sm:grid-cols-3">
          <div className="flex items-baseline justify-between sm:flex-col sm:items-start sm:gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Sub Total</span>
            <span className="font-mono text-sm font-bold text-text">{calc ? rs(calc.subTotal) : "—"}</span>
          </div>
          <div className="flex items-baseline justify-between sm:flex-col sm:items-start sm:gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">VAT (13%)</span>
            <span className="font-mono text-sm font-bold text-text">{calc ? rs(calc.vat) : "—"}</span>
          </div>
          <div className="flex items-baseline justify-between sm:flex-col sm:items-start sm:gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Grand Total</span>
            <span className="font-mono text-base font-black text-accent">{calc ? rs(calc.grandTotal) : "—"}</span>
          </div>
        </div>
      </section>

      {/* --- Insurance Bill --- */}
      <section className="rounded-xl border border-border bg-bg/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-text">
          <ShieldCheck size={16} className="text-accent" />
          <h3 className="font-display text-[13.5px] font-bold uppercase tracking-wide">Insurance Bill</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Bill Number" htmlFor="pbInsBill">
            <Input id="pbInsBill" value={insuranceBillNo} onChange={(e) => setInsuranceBillNo(e.target.value)} />
          </Field>
          <Field label="Cost (without VAT)" htmlFor="pbInsCost">
            <Input id="pbInsCost" inputMode="decimal" value={insuranceCost} onChange={(e) => setInsuranceCost(e.target.value)} className="font-mono" />
          </Field>
          <div className="flex flex-col justify-end">
            <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">VAT (13%)</span>
            <span className="font-mono text-sm font-bold text-text">{insuranceVat !== null ? rs(insuranceVat) : "—"}</span>
          </div>
          <Field label="Stamp Duty" htmlFor="pbInsStamp">
            <Input id="pbInsStamp" inputMode="decimal" value={insuranceStamp} onChange={(e) => setInsuranceStamp(e.target.value)} className="font-mono" />
          </Field>
          <div className="flex flex-col justify-end">
            <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-accent">Total</span>
            <span className="font-mono text-sm font-bold text-accent">{insuranceTotal ? rs(Number(insuranceTotal)) : "—"}</span>
          </div>
        </div>
      </section>

      {/* --- Transportation Detail --- */}
      <section className="rounded-xl border border-border bg-bg/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-text">
          <TruckIcon size={16} className="text-accent" />
          <h3 className="font-display text-[13.5px] font-bold uppercase tracking-wide">Transportation Detail</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Transporter" htmlFor="pbTransporter">
            <Input id="pbTransporter" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} />
          </Field>
          <Field label="Bill No." htmlFor="pbTransBill">
            <Input id="pbTransBill" value={transportBillNo} onChange={(e) => setTransportBillNo(e.target.value)} />
          </Field>
          <Field label="Cost (without VAT)" htmlFor="pbTransCost">
            <Input id="pbTransCost" inputMode="decimal" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} className="font-mono" />
          </Field>
          <div className="flex flex-col justify-end">
            <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">VAT (13%)</span>
            <span className="font-mono text-sm font-bold text-text">{transportVat !== null ? rs(transportVat) : "—"}</span>
          </div>
          <div className="flex flex-col justify-end">
            <span className="mb-1 text-[11px] font-bold uppercase tracking-wider text-accent">Total</span>
            <span className="font-mono text-sm font-bold text-accent">{transportTotalDisplay !== null ? rs(transportTotalDisplay) : "—"}</span>
          </div>
        </div>
      </section>

      <Field label="Remarks" htmlFor="pbRemarks">
        <textarea
          id="pbRemarks"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className={fieldBase}
        />
      </Field>

      {uploadError && (
        <div role="alert" className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {uploadError}
        </div>
      )}
      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <GhostButton type="button" onClick={() => window.location.reload()} className="px-5 py-2.5 text-xs font-bold">
          Cancel
        </GhostButton>
        <PrimaryButton type="submit" disabled={pending || !isValid} className="px-7 py-2.5 text-xs font-bold">
          <Upload size={14} />
          {pending ? "Saving…" : "Save Purchase Bill"}
        </PrimaryButton>
      </div>
    </form>
  );
}
