"use client";

import { useState } from "react";
import { TicketCheck, Search, CheckCircle2, AlertTriangle, XCircle, Fuel, Car, Receipt, Check } from "lucide-react";
import { MOCK_SUB_COUPONS } from "@/lib/mock/coupons";
import type { SubCoupon } from "@/lib/coupons";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtRs, fmtL } from "@/lib/money";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function RedeemCouponCard() {
  const [queryCode, setQueryCode] = useState("BK-8801-04");
  const [searchedCoupon, setSearchedCoupon] = useState<SubCoupon | null>(
    MOCK_SUB_COUPONS.find((c) => c.couponCode === "BK-8801-04") || null
  );
  const [vehicleNo, setVehicleNo] = useState("Ba 1 Gha 2891");
  const [redeemedSuccess, setRedeemedSuccess] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemedSuccess(false);
    const found = MOCK_SUB_COUPONS.find(
      (c) => c.couponCode.toLowerCase() === queryCode.trim().toLowerCase()
    );
    setSearchedCoupon(found || null);
  };

  const handleRedeem = () => {
    if (!searchedCoupon || searchedCoupon.status !== "ACTIVE") return;
    const newReceiptNo = 10460 + Math.floor(Math.random() * 100);
    setGeneratedReceipt(newReceiptNo);
    searchedCoupon.status = "REDEEMED";
    searchedCoupon.redeemedReceiptNo = newReceiptNo;
    searchedCoupon.redeemedVehicleNo = vehicleNo;
    searchedCoupon.redeemedAtBS = "2083-05-03";
    searchedCoupon.redeemedByName = "Ramesh Thapa (Attendant)";
    setRedeemedSuccess(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Lookup Card */}
      <div className="rounded-xl border border-border bg-bg p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <TicketCheck size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-text">Pump Redemption Terminal</h3>
            <p className="text-xs text-text-muted">Validate and redeem tear-off coupon vouchers at the dispenser</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Type or scan sub-coupon code (e.g. BK-8801-04)"
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              className="font-data text-sm font-bold text-accent uppercase"
              required
            />
          </div>
          <PrimaryButton type="submit" className="gap-1.5 text-xs">
            <Search size={14} />
            Validate Code
          </PrimaryButton>
        </form>

        {/* Validation Result Box */}
        {searchedCoupon ? (
          <div className="rounded-xl border border-border bg-surface p-4.5">
            {/* Status Header */}
            <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-data text-base font-bold text-accent">{searchedCoupon.couponCode}</span>
                <span className="font-data text-xs text-text-muted">(Book: {searchedCoupon.bookNumber})</span>
              </div>
              <div>
                {searchedCoupon.status === "ACTIVE" ? (
                  <Badge tone="success">
                    <CheckCircle2 size={11} />
                    VALID & ACTIVE
                  </Badge>
                ) : searchedCoupon.status === "REDEEMED" ? (
                  <Badge tone="error">
                    <XCircle size={11} />
                    ALREADY REDEEMED
                  </Badge>
                ) : (
                  <Badge tone="error">
                    <AlertTriangle size={11} />
                    CANCELLED / VOID
                  </Badge>
                )}
              </div>
            </div>

            {/* Voucher Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
              <div>
                <div>Customer / Account</div>
                <div className="font-semibold text-text">{searchedCoupon.customerName}</div>
              </div>
              <div>
                <div>Authorized Fuel Product</div>
                <div className="font-semibold text-text">
                  {searchedCoupon.fuel === "ANY" ? "All Fuels" : FUEL_LABEL[searchedCoupon.fuel]}
                </div>
              </div>
              <div>
                <div>Voucher Face Value</div>
                <div className="font-data text-sm font-bold text-accent">
                  {searchedCoupon.denominationType === "VOLUME"
                    ? fmtL(searchedCoupon.denominationValue)
                    : fmtRs(searchedCoupon.denominationValue)}
                </div>
              </div>
              <div>
                <div>Validity Window</div>
                <div className="font-data text-text">{searchedCoupon.expiryDateBS} (BS)</div>
              </div>
            </div>

            {/* If Already Redeemed Warning */}
            {searchedCoupon.status === "REDEEMED" && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                <div className="flex items-center gap-1.5 font-bold">
                  <XCircle size={14} />
                  Duplicate Redemption Prohibited
                </div>
                <div className="mt-1 text-text-muted">
                  This coupon was already redeemed on <strong>{searchedCoupon.redeemedAtBS}</strong> (Receipt #
                  {searchedCoupon.redeemedReceiptNo}) against vehicle{" "}
                  <strong>{searchedCoupon.redeemedVehicleNo || "N/A"}</strong> by {searchedCoupon.redeemedByName}.
                </div>
              </div>
            )}

            {/* If Valid: Action Form */}
            {searchedCoupon.status === "ACTIVE" && !redeemedSuccess && (
              <div className="mt-4 border-t border-border/60 pt-3">
                <Field label="Vehicle Registration Plate (Optional for walk-in)">
                  <Input
                    placeholder="e.g. Ba 1 Gha 2891"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    className="font-data uppercase font-semibold"
                  />
                </Field>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <PrimaryButton onClick={handleRedeem} className="w-full gap-2 py-3 text-sm">
                    <Fuel size={16} />
                    Confirm Redemption & Dispense Fuel
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* Redemption Success Banner */}
            {redeemedSuccess && (
              <div className="mt-4 rounded-xl border border-success/40 bg-success/10 p-4 text-center animate-fade-in">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={20} />
                </div>
                <h4 className="font-display text-base font-bold text-success">Redemption Complete</h4>
                <p className="mt-1 text-xs text-text">
                  Dispensed {searchedCoupon.denominationType === "VOLUME" ? fmtL(searchedCoupon.denominationValue) : fmtRs(searchedCoupon.denominationValue)} of {searchedCoupon.fuel} to vehicle <span className="font-data font-bold text-accent">{vehicleNo}</span>.
                </p>
                <div className="mt-2 font-data text-xs text-text-muted">
                  Sale Receipt <strong className="text-text">#{generatedReceipt}</strong> minted.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-text-muted">
            No coupon found with code &quot;{queryCode}&quot;. Please check the serial number on the printed leaf.
          </div>
        )}
      </div>
    </div>
  );
}
