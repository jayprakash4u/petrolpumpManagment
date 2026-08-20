import { Prisma } from "@prisma/client";

/**
 * All money and volume math happens with Prisma.Decimal (arbitrary-precision,
 * base-10) end to end — from form input through the database — so a sale
 * total can never drift by a paisa the way repeated float arithmetic would.
 * These helpers are the only place `number` is allowed back in, and only for
 * *display*.
 */

export type Decimalish = Prisma.Decimal | number | string;

export function toDecimal(value: Decimalish): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

/** Rs 1,23,456 — Indian digit grouping, no paisa (fuel totals round to the rupee for display). */
export function fmtRs(value: Decimalish): string {
  const n = toDecimal(value).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();
  return "Rs " + n.toLocaleString("en-IN");
}

/** 40.5 L */
export function fmtL(value: Decimalish): string {
  const n = toDecimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber();
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " L";
}

/** Rs 106.48 */
export function fmtRate(value: Decimalish): string {
  return "Rs " + toDecimal(value).toFixed(2);
}

export function toNum(value: Decimalish): number {
  return toDecimal(value).toNumber();
}

/** Parses a form field into a Decimal, returning null for blank/invalid input rather than throwing. */
export function parseDecimalInput(raw: FormDataEntryValue | null): Prisma.Decimal | null {
  if (raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  try {
    const d = new Prisma.Decimal(s);
    if (!d.isFinite()) return null;
    return d;
  } catch {
    return null;
  }
}
