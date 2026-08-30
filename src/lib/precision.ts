import { Prisma } from "@prisma/client";

/**
 * Enterprise Fixed-Point Arithmetic & Precision Rules for Petroleum SaaS.
 *
 * 1. Currency (NPR): Fixed-Point Decimal(12, 2)
 *    - All money amounts (Gross Sales, VAT, Discounts, Outstanding Due, Ledger Balances)
 *    - Formatted strictly to 2 decimal places.
 *
 * 2. Fuel Volume (Liters): Fixed-Point Decimal(12, 3)
 *    - All volumes (Dispenser Meter Delivery, Tank Capacity, Dipstick Volume, Decanting Variance)
 *    - Precision of 1 milliliter (0.001 Liters).
 *
 * 3. Unit Tariff (Rs/Liter): Fixed-Point Decimal(8, 2)
 *    - Official NOC Retail & Wholesale fuel tariff per liter.
 */

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

/**
 * Normalizes fuel volume to Decimal with max 3 decimal places (0.001 L / mL precision).
 */
export function toVolumeDecimal(val: Prisma.Decimal.Value): Prisma.Decimal {
  const d = D(val);
  return new Prisma.Decimal(d.toFixed(3));
}

/**
 * String formatter with fixed 3 decimal places for Volume (e.g. "12.500 L").
 */
export function fmtVolume(val: Prisma.Decimal.Value): string {
  const d = D(val);
  return d.toFixed(3);
}

/**
 * Normalizes currency amount to Decimal with max 2 decimal places (Rs 0.01 precision).
 */
export function toCurrencyDecimal(val: Prisma.Decimal.Value): Prisma.Decimal {
  const d = D(val);
  return new Prisma.Decimal(d.toFixed(2));
}

/**
 * String formatter with fixed 2 decimal places for Currency (e.g. "1500.00").
 */
export function fmtCurrency(val: Prisma.Decimal.Value): string {
  const d = D(val);
  return d.toFixed(2);
}

/**
 * Computes exact fuel sale volume from cash tendered with 3-decimal precision.
 * Rounds volume DOWN so the station never delivers more fuel than paid for.
 */
export function deriveVolumeFromRupees(
  rupees: Prisma.Decimal.Value,
  ratePerL: Prisma.Decimal.Value
): {
  liters: Prisma.Decimal;
  exactAmount: Prisma.Decimal;
} {
  const r = D(rupees);
  const rate = D(ratePerL);
  if (rate.lte(0)) throw new Error("Invalid fuel rate");

  // Division with 3-decimal rounding down (FLOOR) to 0.001 L
  const rawLiters = r.div(rate);
  const truncatedLiters = new Prisma.Decimal(
    Math.floor(rawLiters.toNumber() * 1000) / 1000
  );
  const exactAmount = truncatedLiters.mul(rate);

  return {
    liters: toVolumeDecimal(truncatedLiters),
    exactAmount: toCurrencyDecimal(exactAmount),
  };
}

/**
 * Computes exact fuel sale amount from volume delivered with 2-decimal precision.
 */
export function deriveRupeesFromVolume(
  liters: Prisma.Decimal.Value,
  ratePerL: Prisma.Decimal.Value
): {
  liters: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
} {
  const l = toVolumeDecimal(liters);
  const rate = D(ratePerL);
  const total = l.mul(rate);

  return {
    liters: l,
    totalAmount: toCurrencyDecimal(total),
  };
}
