"use client";

import { useState } from "react";
import { BookMarked, Printer, Check, Ticket, Fuel, Calendar, Building, Sparkles } from "lucide-react";
import type { CouponBook, DenominationType, BillingType } from "@/lib/coupons";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

const CUSTOMERS = [
  { id: "cust-ktm-muni", name: "Kathmandu Metropolitan City (Dept. of Environment)" },
  { id: "cust-ntc", name: "Nepal Telecom (NTC) Central Fleet" },
  { id: "cust-apf", name: "Armed Police Force (APF) Logistics HQ" },
  { id: "cust-siddhartha", name: "Siddhartha Cargo & Logistics" },
  { id: "cust-police", name: "Nepal Police Traffic Control Division" },
];

export function IssueCouponForm({ onBookIssued }: { onBookIssued?: (book: CouponBook) => void }) {
  const [customerId, setCustomerId] = useState(CUSTOMERS[0].id);
  const [bookNumber, setBookNumber] = useState("BK-8805");
  const [fuel, setFuel] = useState<"PETROL" | "DIESEL" | "ANY">("DIESEL");
  const [denomType, setDenomType] = useState<DenominationType>("VOLUME");
  const [denomValue, setDenomValue] = useState("20");
  const [leavesCount, setLeavesCount] = useState("25");
  const [billingType, setBillingType] = useState<BillingType>("CREDIT_BILLED");
  const [expiryBS, setExpiryBS] = useState("2083-11-15");
  const [submitted, setSubmitted] = useState(false);

  const selectedCustomer = CUSTOMERS.find((c) => c.id === customerId)!;
  const leavesNum = parseInt(leavesCount, 10) || 20;
  const denomNum = parseFloat(denomValue) || 10;

  // Approx rate for volume
  const rateEstimate = fuel === "PETROL" ? 172.5 : fuel === "DIESEL" ? 160 : 165;
  const totalValEstimate =
    denomType === "VOLUME" ? leavesNum * denomNum * rateEstimate : leavesNum * denomNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setBookNumber(`BK-${parseInt(bookNumber.replace("BK-", ""), 10) + 1}`);
    }, 1800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* Form Card */}
      <div className="rounded-xl border border-border bg-bg p-5">
        <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <BookMarked size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-text">Issue Numbered Coupon Book</h3>
            <p className="text-xs text-text-muted">Issue traceable tear-off fuel coupon sheets to corporate fleets</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
              <Check size={24} />
            </div>
            <h4 className="font-display text-base font-semibold text-text">Coupon Book Issued Successfully</h4>
            <p className="mt-1 text-xs text-text-muted">
              Book <strong className="font-data text-accent">{bookNumber}</strong> ({leavesNum} sub-coupons: {bookNumber}-01 to {bookNumber}-{String(leavesNum).padStart(2, "0")}) assigned to {selectedCustomer.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Assign Corporate / Customer Account">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Coupon Book Serial Number">
                <Input
                  value={bookNumber}
                  onChange={(e) => setBookNumber(e.target.value)}
                  className="font-bold text-accent"
                  required
                />
              </Field>
              <Field label="Allowed Fuel Type">
                <Select value={fuel} onChange={(e) => setFuel(e.target.value as "PETROL" | "DIESEL" | "ANY")}>
                  <option value="DIESEL">High-Speed Diesel (HSD)</option>
                  <option value="PETROL">Motor Spirit (Petrol)</option>
                  <option value="ANY">Any Fuel (Petrol / Diesel / CNG)</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Denomination Type">
                <Select
                  value={denomType}
                  onChange={(e) => {
                    const t = e.target.value as DenominationType;
                    setDenomType(t);
                    setDenomValue(t === "VOLUME" ? "20" : "1000");
                  }}
                >
                  <option value="VOLUME">Fixed Volume (Litres)</option>
                  <option value="AMOUNT">Fixed Currency Value (NPR)</option>
                </Select>
              </Field>
              <Field label={denomType === "VOLUME" ? "Litres per Sub-Coupon" : "Value per Sub-Coupon (NPR)"}>
                <Input
                  type="number"
                  value={denomValue}
                  onChange={(e) => setDenomValue(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Number of Leaves (Sub-Coupons)">
                <Select value={leavesCount} onChange={(e) => setLeavesCount(e.target.value)}>
                  <option value="10">10 Leaves / Sub-Coupons</option>
                  <option value="20">20 Leaves / Sub-Coupons</option>
                  <option value="25">25 Leaves / Sub-Coupons</option>
                  <option value="50">50 Leaves / Sub-Coupons</option>
                  <option value="100">100 Leaves / Sub-Coupons</option>
                </Select>
              </Field>
              <Field label="Billing Settlement Model">
                <Select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as BillingType)}
                >
                  <option value="CREDIT_BILLED">Credit (Billed on Redemption)</option>
                  <option value="PRE_PAID">Pre-paid (Invoiced Upfront)</option>
                </Select>
              </Field>
            </div>

            <Field label="Valid Until Date (Bikram Sambat)">
              <Input value={expiryBS} onChange={(e) => setExpiryBS(e.target.value)} required />
            </Field>

            {/* Valuation estimate banner */}
            <div className="rounded-xl border border-accent/30 bg-accent/8 p-3.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Total Book Fuel Value:</span>
                <span className="font-data text-base font-bold text-accent">{fmtRs(totalValEstimate)}</span>
              </div>
              <div className="mt-1 text-[11px] text-text-muted">
                Generates sub-coupons <span className="font-data text-text font-semibold">{bookNumber}-01</span> to <span className="font-data text-text font-semibold">{bookNumber}-{String(leavesNum).padStart(2, "0")}</span>.
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2.5">
              <GhostButton type="button" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer size={14} />
                Print Voucher Sheet
              </GhostButton>
              <PrimaryButton type="submit">Issue Book & Mint Leaves</PrimaryButton>
            </div>
          </form>
        )}
      </div>

      {/* Live Visual Tear-off Leaf Preview */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-bg p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-xs font-bold tracking-wider text-text-muted">
              TEAR-OFF SUB-COUPON LEAF PREVIEW
            </span>
            <span className="font-data rounded-md bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
              LEAF #01 OF {leavesNum}
            </span>
          </div>

          {/* Realistic Nepal Petrol Station Coupon Design */}
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-accent/60 bg-surface p-4.5 shadow-lg">
            <div className="flex items-start justify-between border-b border-border/80 pb-3">
              <div>
                <div className="font-display text-[15px] font-extrabold text-text">SHREE PETROLEUM</div>
                <div className="font-data text-[10px] text-text-muted">STATION CODE: shreepump</div>
              </div>
              <div className="text-right">
                <div className="font-data text-[13px] font-bold text-accent">{bookNumber}-01</div>
                <div className="font-data text-[10px] text-text-muted">BOOK: {bookNumber}</div>
              </div>
            </div>

            <div className="my-4 flex items-center justify-between rounded-lg bg-surface-hi/80 p-3">
              <div>
                <div className="text-[10px] text-text-muted">AUTHORIZED FUEL</div>
                <div className="font-display text-sm font-bold text-text">
                  {fuel === "ANY" ? "ALL FUELS" : FUEL_LABEL[fuel]}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-muted">DENOMINATION</div>
                <div className="font-data text-base font-extrabold text-accent">
                  {denomType === "VOLUME" ? fmtL(denomNum) : fmtRs(denomNum)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-text-muted">
              <div>
                <strong className="text-text">Account:</strong> {selectedCustomer.name}
              </div>
              <div>
                <strong className="text-text">Valid Until:</strong> {expiryBS} (BS)
              </div>
              <div className="mt-1 text-[9.5px] italic text-text-muted/60">
                * Single-use tear-off voucher. Void if seal broken or duplicate presented at pump.
              </div>
            </div>

            {/* Barcode visual stub */}
            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2 font-data text-[10px] text-text-muted">
              <span>||| | | |||| ||| || ||| |</span>
              <span>AUTH SIG: _____________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
