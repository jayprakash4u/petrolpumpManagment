import { Prisma } from "@prisma/client";
import { toDecimal, type Decimalish } from "@/lib/money";

/**
 * Pure sale arithmetic — no database, no session, no framework. Kept
 * separate from the Server Action so the money rules that actually decide
 * what a customer pays can be unit-tested directly (see sale-math.test.ts).
 */

const D = Prisma.Decimal;
const ROUND = Prisma.Decimal.ROUND_HALF_UP;

/** Attendants key in either a volume ("40 litres") or a rupee amount ("Rs 500 of petrol") — both are normal at a pump. */
export type SaleMode = "LITERS" | "AMOUNT";

/** Fat-finger guard: no single sale plausibly exceeds this. Rejected before it can drain a tank. */
export const MAX_LITERS_PER_SALE = new D(20000);
export const MIN_LITERS_PER_SALE = new D("0.01");

export interface DerivedSale {
  liters: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
}

/**
 * Turns whichever number the operator typed into the (liters, total) pair
 * that gets stored.
 *
 * Litres are always the source of truth and `totalAmount` is always exactly
 * `liters x ratePerL` rounded to 2dp — never the raw figure typed in. That
 * invariant is what lets reports re-derive revenue from volume (and vice
 * versa) without the two ever disagreeing by a paisa.
 *
 * In AMOUNT mode the litres are rounded *down*, so a customer paying Rs 500
 * never receives more fuel than their money covers; the resulting total is
 * therefore <= the amount entered, and the difference is returned as change.
 */
export function deriveSale(mode: SaleMode, rawInput: Decimalish, ratePerL: Decimalish): DerivedSale {
  const rate = toDecimal(ratePerL);
  const input = toDecimal(rawInput);

  if (rate.lte(0)) {
    throw new Error("Fuel rate must be greater than zero");
  }

  const liters =
    mode === "LITERS"
      ? input.toDecimalPlaces(2, ROUND)
      : input.div(rate).toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);

  return {
    liters,
    totalAmount: liters.mul(rate).toDecimalPlaces(2, ROUND),
  };
}

export type QuantityProblem = "NOT_A_NUMBER" | "TOO_SMALL" | "TOO_LARGE";

/** Validates the derived volume itself, independent of whether the tank happens to hold it. */
export function checkLiters(liters: Prisma.Decimal): QuantityProblem | null {
  if (!liters.isFinite()) return "NOT_A_NUMBER";
  if (liters.lt(MIN_LITERS_PER_SALE)) return "TOO_SMALL";
  if (liters.gt(MAX_LITERS_PER_SALE)) return "TOO_LARGE";
  return null;
}

/** How much more a credit customer may borrow right now. Never negative, even if an old balance already exceeds the limit. */
export function creditHeadroom(creditLimit: Decimalish, dueAmount: Decimalish): Prisma.Decimal {
  const headroom = toDecimal(creditLimit).sub(toDecimal(dueAmount));
  return headroom.isNegative() ? new D(0) : headroom;
}

/** Cash tendered minus the bill. Negative means the customer still owes — the caller decides whether that's an error. */
export function changeDue(tendered: Decimalish, totalAmount: Decimalish): Prisma.Decimal {
  return toDecimal(tendered).sub(toDecimal(totalAmount));
}
