import { type FuelType } from "@prisma/client";

export type DenominationType = "VOLUME" | "AMOUNT";
export type CouponStatus = "ACTIVE" | "REDEEMED" | "CANCELLED";
export type BillingType = "PRE_PAID" | "CREDIT_BILLED";

export interface CouponBook {
  id: string;
  bookNumber: string; // e.g. "BK-8801"
  customerId: string;
  customerName: string;
  fuel: FuelType | "ANY";
  denominationType: DenominationType;
  denominationValue: number; // e.g. 10 (Litres) or 1000 (NPR)
  totalLeaves: number;
  activeLeaves: number;
  redeemedLeaves: number;
  cancelledLeaves: number;
  issuedDateBS: string;
  expiryDateBS: string;
  issuedByName: string;
  billingType: BillingType;
  totalBookValueNpr: number;
  status: "ACTIVE" | "EXHAUSTED" | "CANCELLED";
}

export interface SubCoupon {
  id: string;
  couponCode: string; // e.g. "BK-8801-01"
  bookId: string;
  bookNumber: string;
  leafNumber: number;
  customerId: string;
  customerName: string;
  fuel: FuelType | "ANY";
  denominationType: DenominationType;
  denominationValue: number;
  status: CouponStatus;
  issuedDateBS: string;
  expiryDateBS: string;
  redeemedAtBS?: string;
  redeemedTime?: string;
  redeemedReceiptNo?: number;
  redeemedVehicleNo?: string;
  redeemedByName?: string;
  cancellationReason?: string;
  cancelledAtBS?: string;
  cancelledByName?: string;
}

export interface CouponRedemptionRecord {
  id: string;
  couponCode: string;
  bookNumber: string;
  customerName: string;
  fuel: FuelType | "ANY";
  volumeLitres: number;
  amountNpr: number;
  receiptNo: number;
  vehicleNo?: string;
  attendantName: string;
  redeemedAtBS: string;
  time: string;
}

export interface CouponCancellationRecord {
  id: string;
  targetType: "BOOK" | "SUB_COUPON";
  code: string; // Book No or Sub-coupon No
  customerName: string;
  leafCount: number;
  valueImpactNpr: number;
  reason: "Lost by Customer" | "Damaged / Torn" | "Corporate Account Suspended" | "Printing Defect";
  cancelledByName: string;
  cancelledAtBS: string;
  notes?: string;
}

export interface CouponSummaryTotals {
  totalActiveBooksCount: number;
  totalSubCouponsIssuedCount: number;
  totalSubCouponsRedeemedCount: number;
  totalUnredeemedLiabilityNpr: number;
  totalRedeemedThisMonthNpr: number;
  totalCancelledCount: number;
}

/**
 * Generates sequential sub-coupon leaves for a new coupon book.
 */
export function generateSubCoupons(
  bookId: string,
  bookNumber: string,
  customerId: string,
  customerName: string,
  fuel: FuelType | "ANY",
  denominationType: DenominationType,
  denominationValue: number,
  totalLeaves: number,
  issuedDateBS: string,
  expiryDateBS: string
): SubCoupon[] {
  const leaves: SubCoupon[] = [];
  for (let i = 1; i <= totalLeaves; i++) {
    const leafNumStr = String(i).padStart(2, "0");
    leaves.push({
      id: `sc-${bookNumber}-${leafNumStr}`,
      couponCode: `${bookNumber}-${leafNumStr}`,
      bookId,
      bookNumber,
      leafNumber: i,
      customerId,
      customerName,
      fuel,
      denominationType,
      denominationValue,
      status: "ACTIVE",
      issuedDateBS,
      expiryDateBS,
    });
  }
  return leaves;
}
