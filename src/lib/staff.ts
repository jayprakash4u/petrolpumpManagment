import { Prisma } from "@prisma/client";
import { toDecimal, type Decimalish } from "@/lib/money";

/**
 * Pure staff / shift helpers — no database, no session. Shift duration and
 * per-head averages are the sort of thing that quietly goes wrong at
 * midnight or on a divide-by-zero, so they live here where they can be
 * tested directly.
 */

const D = Prisma.Decimal;

/** Reporting windows offered on the Employees page. */
export type RangeKey = "today" | "7d" | "30d";

export const RANGE_LABEL: Record<RangeKey, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export function isRangeKey(value: unknown): value is RangeKey {
  return value === "today" || value === "7d" || value === "30d";
}

/** Start of the reporting window, in server-local time. `today` means midnight, not "24 hours ago". */
export function rangeStart(range: RangeKey, now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (range === "7d") start.setDate(start.getDate() - 6); // today plus the 6 before it
  if (range === "30d") start.setDate(start.getDate() - 29);
  return start;
}

/**
 * Whole minutes between two instants, floored at zero. A shift that somehow
 * records an end before its start reads as 0m rather than a negative
 * duration that would poison any total built on it.
 */
export function shiftMinutes(startedAt: Date, endedAt: Date | null, now: Date = new Date()): number {
  const end = endedAt ?? now;
  const ms = end.getTime() - startedAt.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / 60000);
}

/** 7h 25m — compact enough for a table cell. */
export function fmtDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Average sale value. Null rather than a divide-by-zero when someone has made no sales. */
export function averageSale(totalRevenue: Decimalish, saleCount: number): Prisma.Decimal | null {
  if (saleCount <= 0) return null;
  return toDecimal(totalRevenue).div(saleCount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Each person's share of the station's takings, 0–100. Zero when the station sold nothing. */
export function revenueSharePct(staffRevenue: Decimalish, stationRevenue: Decimalish): Prisma.Decimal {
  const total = toDecimal(stationRevenue);
  if (total.lte(0)) return new D(0);
  return toDecimal(staffRevenue).div(total).mul(100).toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP);
}

/** PS for "Prakash Shrestha" — avatar fallback with no image hosting involved. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
