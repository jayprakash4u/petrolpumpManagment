"use client";

import { useActionState, useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { recordPurchaseBillAction, type PurchaseBillState } from "@/lib/actions/purchase-bill";
import type { FuelPurchasesPageData } from "@/lib/queries/fuel-purchases";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { MOCK_SUPPLIERS } from "@/lib/mock/purchases";

type TankOption = FuelPurchasesPageData["tankOptions"][number];

const initialState: PurchaseBillState = {};
const VAT_RATE = 0.13;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const FIXED_SUPPLIER_NAME = "Nepal Oil Co-operations Ltd";
const FIXED_SUPPLIER_PAN = "300047060";

const inputClass =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-xs font-medium text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-hidden transition-colors";

const readonlyInputClass =
  "h-9 w-full rounded-md border border-border/80 bg-surface-hi/40 px-3 font-data text-xs font-semibold text-text focus:outline-hidden";

const fileInputClass =
  "block w-full text-[11.5px] text-text-muted file:mr-2.5 file:rounded file:border file:border-border file:bg-surface-hi file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-text hover:file:bg-surface";

export function PurchaseBillEntryForm({ tanks = [] }: { tanks?: TankOption[] }) {
  const [state, action, pending] = useActionState(recordPurchaseBillAction, initialState);

  return (
    <div className="w-full">
      <PurchaseBillFields
        key={state.message ?? "entering"}
        tanks={tanks}
        action={action}
        pending={pending}
        error={state.error}
      />
      {state.message && (
        <div className="animate-fade-in mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs font-semibold text-success shadow-2xs">
          <CheckCircle2 size={16} className="shrink-0" />
          {state.message}
        </div>
      )}
    </div>
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
  tanks = [],
  action,
  pending,
  error,
}: {
  tanks: TankOption[];
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  // General fields
  const [purchaseDateBS, setPurchaseDateBS] = useState("2083-05-18");

  // NOC Purchase section
  const [invoiceNo, setInvoiceNo] = useState("");
  const [tankerNo, setTankerNo] = useState("");
  const [density, setDensity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [chosenFuel, setChosenFuel] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [rateWithoutVat, setRateWithoutVat] = useState("");

  // Tank allocations
  const [tankAQty, setTankAQty] = useState("0");
  const [tankBQty, setTankBQty] = useState("0");

  // Insurance section
  const [insuranceBillNo, setInsuranceBillNo] = useState("0");
  const [insuranceCost, setInsuranceCost] = useState("0");
  const [insuranceStamp, setInsuranceStamp] = useState("20");

  // Transportation section
  const [transporter, setTransporter] = useState("");
  const [transportBillNo, setTransportBillNo] = useState("0");
  const [transportCost, setTransportCost] = useState("0");

  // Remarks
  const [remarks, setRemarks] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const invoiceImage = useDataUrlUpload(MAX_IMAGE_BYTES, setUploadError);
  const scannedBill = useDataUrlUpload(MAX_IMAGE_BYTES, setUploadError);
  const insuranceImage = useDataUrlUpload(MAX_IMAGE_BYTES, setUploadError);

  // Available fuel types from tanks
  const fuelOptions = useMemo(() => {
    const map = new Map<string, string>();
    tanks.forEach((t) => {
      const label = FUEL_LABEL[t.fuel as FuelId] ?? t.fuel;
      map.set(t.fuel, label);
    });
    if (!map.has("PETROL")) map.set("PETROL", "MS Petrol (PETROL)");
    if (!map.has("DIESEL")) map.set("DIESEL", "HSD Diesel (DIESEL)");
    return Array.from(map.entries()).map(([fuel, label]) => ({ fuel, label }));
  }, [tanks]);

  // Tanks filtered by chosen fuel
  const filteredTanks = useMemo(() => {
    if (!chosenFuel) return tanks;
    return tanks.filter((t) => t.fuel === chosenFuel);
  }, [tanks, chosenFuel]);

  const tankA = filteredTanks[0] || tanks[0];
  const tankB = filteredTanks[1] || null;

  // Sync Quantity to Tank A by default
  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    if (!val || Number.isNaN(Number(val))) {
      setTankAQty("0");
      setTankBQty("0");
    } else {
      const num = Number(val);
      const b = Number(tankBQty) || 0;
      setTankAQty(String(Math.max(0, num - b)));
    }
  };

  const handleTankAQtyChange = (val: string) => {
    setTankAQty(val);
  };

  const handleTankBQtyChange = (val: string) => {
    setTankBQty(val);
    const total = Number(quantity) || 0;
    const b = Number(val) || 0;
    setTankAQty(String(Math.max(0, total - b)));
  };

  // Calculations: NOC Purchase
  const nocCalc = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rateWithoutVat) || 0;
    const subTotal = Number((q * r).toFixed(2));
    const vat = Number((subTotal * VAT_RATE).toFixed(2));
    const grandTotal = Number((subTotal + vat).toFixed(2));
    return {
      subTotal: q > 0 && r > 0 ? subTotal : 0,
      vat: q > 0 && r > 0 ? vat : 0,
      grandTotal: q > 0 && r > 0 ? grandTotal : 0,
    };
  }, [quantity, rateWithoutVat]);

  // Calculations: Insurance Bill
  const insuranceTotal = useMemo(() => {
    const cost = parseFloat(insuranceCost) || 0;
    const stamp = parseFloat(insuranceStamp) || 0;
    return (cost + stamp).toFixed(2);
  }, [insuranceCost, insuranceStamp]);

  // Calculations: Transportation
  const transportTotal = useMemo(() => {
    const cost = parseFloat(transportCost) || 0;
    return cost.toFixed(2);
  }, [transportCost]);

  // Keyboard shortcut Ctrl + D to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Transporter suppliers list
  const transporterOptions = useMemo(() => {
    return MOCK_SUPPLIERS.filter(
      (s) =>
        s.category === "Transport / Dhuwani" ||
        s.name.toLowerCase().includes("dhuwani") ||
        s.name.toLowerCase().includes("transport")
    );
  }, []);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6">
      {/* Hidden bindings */}
      <input type="hidden" name="purchaseDateBS" value={purchaseDateBS} />
      <input type="hidden" name="tankAId" value={tankA?.id ?? (tanks[0]?.id || "tank-1")} />
      {tankB && Number(tankBQty) > 0 && (
        <>
          <input type="hidden" name="tankBId" value={tankB.id} />
          <input type="hidden" name="tankBQuantity" value={tankBQty} />
        </>
      )}
      <input type="hidden" name="tankerNo" value={tankerNo} />
      <input type="hidden" name="invoiceNo" value={invoiceNo} />
      <input type="hidden" name="supplier" value={FIXED_SUPPLIER_NAME} />
      <input type="hidden" name="supplierPan" value={FIXED_SUPPLIER_PAN} />
      <input type="hidden" name="density" value={density} />
      <input type="hidden" name="temperature" value={temperature} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="ratePerL" value={rateWithoutVat} />
      <input type="hidden" name="invoiceImage" value={invoiceImage.dataUrl} />
      <input type="hidden" name="scannedBill" value={scannedBill.dataUrl} />
      <input type="hidden" name="insuranceBillNo" value={insuranceBillNo} />
      <input type="hidden" name="insuranceCost" value={insuranceCost} />
      <input type="hidden" name="insuranceStamp" value={insuranceStamp} />
      <input type="hidden" name="transporterName" value={transporter} />
      <input type="hidden" name="transportBillNo" value={transportBillNo} />
      <input type="hidden" name="transportCost" value={transportCost} />
      <input type="hidden" name="remarks" value={remarks} />

      {/* Top Bar / Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          Add purchase
        </h1>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text shadow-2xs transition-colors hover:bg-surface-hi hover:border-accent/40"
        >
          <ArrowLeft size={14} />
          « Back
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6">
        {/* 1. Purchase Date */}
        <div className="mb-6 max-w-md">
          <label className="mb-1 block text-xs font-semibold text-text">
            Purchase Date (in Nepali)
          </label>
          <input
            type="text"
            value={purchaseDateBS}
            onChange={(e) => setPurchaseDateBS(e.target.value)}
            placeholder="e.g. 2083-05-18"
            className={inputClass}
          />
        </div>

        {/* 2. NOC PURCHASE Section */}
        <fieldset className="mb-6 rounded-lg border border-border p-4 sm:p-5">
          <legend className="px-2 font-display text-xs font-bold uppercase tracking-wider text-text">
            NOC PURCHASE
          </legend>

          {/* Upload Invoice Image */}
          <div className="mb-4 max-w-md">
            <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
              Upload Invoice Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={invoiceImage.handleChange}
              className={fileInputClass}
            />
          </div>

          {/* Grid Row 1: Invoice, Tanker, Density, Temp */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Invoice/Bill Number
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Bill number"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Tanker No
              </label>
              <input
                type="text"
                value={tankerNo}
                onChange={(e) => setTankerNo(e.target.value.toUpperCase())}
                placeholder="e.g. 3711NA7KHA"
                className={inputClass + " uppercase font-mono"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Density
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                placeholder="e.g. 735"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Temperature
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 27.5"
                className={inputClass}
              />
            </div>
          </div>

          {/* Grid Row 2: Choose Item, Quantity, Rate, Scanned bill */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Choose Item
              </label>
              <select
                value={chosenFuel}
                onChange={(e) => setChosenFuel(e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                {fuelOptions.map((opt) => (
                  <option key={opt.fuel} value={opt.fuel}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Quantity purchase
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="e.g. 12000"
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Rate ( Without Vat )
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={rateWithoutVat}
                onChange={(e) => setRateWithoutVat(e.target.value)}
                placeholder="e.g. 170.50256"
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Upload scanned purchase bill:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={scannedBill.handleChange}
                className={fileInputClass}
              />
            </div>
          </div>

          {/* Grid Row 3: Tank A / Tank B allocation */}
          <div className="mb-4 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-text-muted">
                TANK A
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={tankAQty}
                onChange={(e) => handleTankAQtyChange(e.target.value)}
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-text-muted">
                TANK B
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={tankBQty}
                onChange={(e) => handleTankBQtyChange(e.target.value)}
                className={inputClass + " font-data"}
              />
            </div>
          </div>

          {/* Grid Row 4: Sub Total, Vat Amount, Grand Total */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Sub Total:
              </label>
              <input
                type="text"
                readOnly
                value={
                  nocCalc.subTotal > 0
                    ? nocCalc.subTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
                className={readonlyInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Vat Amount:
              </label>
              <input
                type="text"
                readOnly
                value={
                  nocCalc.vat > 0
                    ? nocCalc.vat.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
                className={readonlyInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-semibold text-accent">
                Grand total
              </label>
              <input
                type="text"
                readOnly
                value={
                  nocCalc.grandTotal > 0
                    ? nocCalc.grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : ""
                }
                className={readonlyInputClass + " text-accent font-bold"}
              />
            </div>
          </div>
        </fieldset>

        {/* 3. UNITED AJOD INSURANCE BILL Section */}
        <fieldset className="mb-6 rounded-lg border border-border p-4 sm:p-5">
          <legend className="px-2 font-display text-xs font-bold uppercase tracking-wider text-text">
            UNITED AJOD INSURANCE BILL
          </legend>

          <div className="mb-4 max-w-md">
            <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
              Upload Invoice Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={insuranceImage.handleChange}
              className={fileInputClass}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Bill Number
              </label>
              <input
                type="text"
                value={insuranceBillNo}
                onChange={(e) => setInsuranceBillNo(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Cost( without vat )
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={insuranceCost}
                onChange={(e) => setInsuranceCost(e.target.value)}
                placeholder="0"
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Stamp
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={insuranceStamp}
                onChange={(e) => setInsuranceStamp(e.target.value)}
                placeholder="20"
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Total
              </label>
              <input
                type="text"
                readOnly
                value={insuranceTotal}
                className={readonlyInputClass}
              />
            </div>
          </div>
        </fieldset>

        {/* 4. Transportation Detail Section */}
        <fieldset className="mb-6 rounded-lg border border-border p-4 sm:p-5">
          <legend className="px-2 font-display text-xs font-bold uppercase tracking-wider text-text">
            Transportation Detail
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Transporter
              </label>
              <select
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className={inputClass}
              >
                <option value="">--Select Transporter--</option>
                {transporterOptions.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Bill No
              </label>
              <input
                type="text"
                value={transportBillNo}
                onChange={(e) => setTransportBillNo(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Cost( without vat )
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={transportCost}
                onChange={(e) => setTransportCost(e.target.value)}
                placeholder="0"
                className={inputClass + " font-data"}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-text-muted">
                Total
              </label>
              <input
                type="text"
                readOnly
                value={transportTotal}
                className={readonlyInputClass}
              />
            </div>
          </div>
        </fieldset>

        {/* 5. Remarks */}
        <div className="mb-8">
          <label className="mb-1 block text-xs font-semibold text-text">
            Remarks:
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Purchase remarks here"
            className="w-full rounded-md border border-border bg-bg p-3 text-xs text-text placeholder:text-text-muted/50 focus:border-accent focus:outline-hidden"
          />
        </div>

        {uploadError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
          >
            <AlertCircle size={14} className="shrink-0" />
            {uploadError}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="animate-fade-in mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs text-error"
          >
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* 6. Centered Submit Button */}
        <div className="flex flex-col items-center justify-center pt-2">
          <PrimaryButton
            type="submit"
            disabled={pending}
            className="px-8 py-2.5 text-xs font-bold shadow-sm"
          >
            {pending ? "Saving…" : "Save Purchase"}
          </PrimaryButton>
          <span className="mt-1.5 text-[11px] font-medium text-text-muted">
            Press Ctrl + D
          </span>
        </div>
      </div>
    </form>
  );
}
