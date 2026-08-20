import { Prisma } from "@prisma/client";
import { toDecimal, type Decimalish } from "@/lib/money";

/**
 * Pure tank and delivery arithmetic — no database, no session, no framework.
 * Companion to sale-math.ts: sales take fuel out, these rules govern putting
 * it back in and repricing what's there.
 */

const D = Prisma.Decimal;
const ROUND = Prisma.Decimal.ROUND_HALF_UP;

/** A delivery bigger than this is a typo, not a tanker. */
export const MAX_DELIVERY_LITERS = new D(50000);
export const MIN_DELIVERY_LITERS = new D("0.01");

/** Sanity rails on a pump rate. Not a business rule — a guard against a slipped decimal point turning Rs 106.48 into Rs 10648. */
export const MIN_RATE = new D("0.01");
export const MAX_RATE = new D(10000);

/** A rate move larger than this is allowed, but the UI asks the operator to confirm it first. */
export const LARGE_RATE_CHANGE_PCT = new D(20);

/** Room left in the tank. Never negative, even if a tank is somehow over-filled already. */
export function ullage(capacityL: Decimalish, levelL: Decimalish): Prisma.Decimal {
  const room = toDecimal(capacityL).sub(toDecimal(levelL));
  return room.isNegative() ? new D(0) : room;
}

/** How full the tank is, 0–100, for gauges and the low-stock threshold. */
export function fillPercent(capacityL: Decimalish, levelL: Decimalish): Prisma.Decimal {
  const capacity = toDecimal(capacityL);
  if (capacity.lte(0)) return new D(0);
  return toDecimal(levelL).div(capacity).mul(100);
}

export function isLowStock(capacityL: Decimalish, levelL: Decimalish, lowStockPct: Decimalish): boolean {
  return fillPercent(capacityL, levelL).lt(toDecimal(lowStockPct));
}

export type DeliveryProblem = "NOT_A_NUMBER" | "TOO_SMALL" | "TOO_LARGE" | "EXCEEDS_CAPACITY";

/**
 * Validates a delivery against the tank it's going into. Overfilling is the
 * one that matters physically — you cannot put 5000 L into a tank with 800 L
 * of room, and silently accepting it would make `levelL` a number that
 * doesn't describe anything real.
 */
export function checkDelivery(liters: Prisma.Decimal, capacityL: Decimalish, levelL: Decimalish): DeliveryProblem | null {
  if (!liters.isFinite()) return "NOT_A_NUMBER";
  if (liters.lt(MIN_DELIVERY_LITERS)) return "TOO_SMALL";
  if (liters.gt(MAX_DELIVERY_LITERS)) return "TOO_LARGE";
  if (liters.gt(ullage(capacityL, levelL))) return "EXCEEDS_CAPACITY";
  return null;
}

export type RateProblem = "NOT_A_NUMBER" | "TOO_LOW" | "TOO_HIGH" | "UNCHANGED";

export function checkRate(newRate: Prisma.Decimal, currentRate: Decimalish): RateProblem | null {
  if (!newRate.isFinite()) return "NOT_A_NUMBER";
  if (newRate.lt(MIN_RATE)) return "TOO_LOW";
  if (newRate.gt(MAX_RATE)) return "TOO_HIGH";
  if (newRate.equals(toDecimal(currentRate))) return "UNCHANGED";
  return null;
}

/** Signed percentage move from old to new, for the audit trail and the confirm prompt. */
export function rateChangePercent(oldRate: Decimalish, newRate: Decimalish): Prisma.Decimal {
  const from = toDecimal(oldRate);
  if (from.lte(0)) return new D(0);
  return toDecimal(newRate).sub(from).div(from).mul(100).toDecimalPlaces(2, ROUND);
}

export function isLargeRateChange(oldRate: Decimalish, newRate: Decimalish): boolean {
  return rateChangePercent(oldRate, newRate).abs().gte(LARGE_RATE_CHANGE_PCT);
}

/**
 * What the station paid per litre on a delivery. Purely informational — it's
 * the *margin* against the pump rate that a manager actually wants to see,
 * and it's derived rather than stored so it can never disagree with the
 * invoice total.
 */
export function costPerLiter(totalCost: Decimalish, liters: Decimalish): Prisma.Decimal | null {
  const l = toDecimal(liters);
  if (l.lte(0)) return null;
  return toDecimal(totalCost).div(l).toDecimalPlaces(2, ROUND);
}

/** Margin per litre at the current pump rate. Negative means the station is selling at a loss. */
export function marginPerLiter(ratePerL: Decimalish, totalCost: Decimalish, liters: Decimalish): Prisma.Decimal | null {
  const cost = costPerLiter(totalCost, liters);
  return cost === null ? null : toDecimal(ratePerL).sub(cost);
}
