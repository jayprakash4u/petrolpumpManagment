import { Prisma } from "@prisma/client";
import { toDecimal, type Decimalish } from "@/lib/money";

/**
 * Pure credit-account arithmetic. `creditHeadroom` already lives in
 * sale-math.ts (it's part of deciding whether a sale may proceed) and is
 * re-exported here so credit code has one obvious import.
 */
export { creditHeadroom } from "@/lib/sale-math";

const D = Prisma.Decimal;
const ROUND = Prisma.Decimal.ROUND_HALF_UP;

/** A single payment larger than this is a typo, not a settlement. */
export const MAX_PAYMENT = new D(10_000_000);
export const MIN_PAYMENT = new D("0.01");

/** Upper bound on a credit line — same fat-finger guard, one order up. */
export const MAX_CREDIT_LIMIT = new D(100_000_000);

export type PaymentProblem = "NOT_A_NUMBER" | "TOO_SMALL" | "TOO_LARGE" | "EXCEEDS_DUE" | "NOTHING_OWED";

/**
 * Validates a payment against what the customer actually owes.
 *
 * Overpayment is **rejected**, not silently trimmed. The original prototype
 * accepted Rs 5,000 against a Rs 3,000 debt and quietly recorded Rs 3,000 —
 * the customer's receipt and the station's books then disagreed by Rs 2,000
 * with nothing to explain it. Refusing forces the operator to look at the
 * real balance and enter it, which is the only way the two stay reconciled.
 */
export function checkPayment(amount: Prisma.Decimal, dueAmount: Decimalish): PaymentProblem | null {
  const due = toDecimal(dueAmount);
  if (!amount.isFinite()) return "NOT_A_NUMBER";
  if (amount.lt(MIN_PAYMENT)) return "TOO_SMALL";
  if (amount.gt(MAX_PAYMENT)) return "TOO_LARGE";
  if (due.lte(0)) return "NOTHING_OWED";
  if (amount.gt(due)) return "EXCEEDS_DUE";
  return null;
}

/** What's left owing after a payment. Never negative — `checkPayment` has already refused overpayment. */
export function balanceAfter(dueAmount: Decimalish, payment: Decimalish): Prisma.Decimal {
  const rest = toDecimal(dueAmount).sub(toDecimal(payment));
  return rest.isNegative() ? new D(0) : rest;
}

export type LimitProblem = "NOT_A_NUMBER" | "NEGATIVE" | "TOO_LARGE" | "UNCHANGED";

export function checkCreditLimit(newLimit: Prisma.Decimal, currentLimit: Decimalish): LimitProblem | null {
  if (!newLimit.isFinite()) return "NOT_A_NUMBER";
  if (newLimit.isNegative()) return "NEGATIVE";
  if (newLimit.gt(MAX_CREDIT_LIMIT)) return "TOO_LARGE";
  if (newLimit.equals(toDecimal(currentLimit))) return "UNCHANGED";
  return null;
}

/**
 * How much of the credit line is used, 0–100+. Can exceed 100 when a limit
 * is cut below an existing balance, which is legitimate — the customer keeps
 * the debt, they just can't borrow more.
 */
export function utilizationPct(dueAmount: Decimalish, creditLimit: Decimalish): Prisma.Decimal {
  const limit = toDecimal(creditLimit);
  if (limit.lte(0)) return toDecimal(dueAmount).gt(0) ? new D(100) : new D(0);
  return toDecimal(dueAmount).div(limit).mul(100).toDecimalPlaces(1, ROUND);
}

/** Flags an account worth chasing: at or over its limit. */
export function isOverExtended(dueAmount: Decimalish, creditLimit: Decimalish): boolean {
  return toDecimal(dueAmount).gte(toDecimal(creditLimit)) && toDecimal(dueAmount).gt(0);
}
