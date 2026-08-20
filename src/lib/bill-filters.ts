import type { FuelType, PaymentMethod } from "@prisma/client";
import { normalizeVehicleNo } from "@/lib/vehicle";
import { resolveRange, type DateRange } from "@/lib/reports";

/**
 * The one filter model every billing screen shares.
 *
 * List Bills, Sales Returns, Vehicle-wise Billing and Bill Export are the
 * same register seen through different filters — that is precisely why a
 * competitor's menu grew to thirteen billing items. Keeping the filter
 * parsing here means the four screens cannot drift apart, and an export can
 * never disagree with the list it was exported from.
 */

/** Which slice of the register to show. Returns are voided sales — the credit notes. */
export type BillStatus = "all" | "active" | "voided";

export interface BillFilters {
  range: DateRange;
  status: BillStatus;
  fuel: FuelType | null;
  payment: PaymentMethod | null;
  vehicleNo: string | null;
  /** Free text: matches a receipt number or a customer name. */
  search: string;
}

const FUELS: FuelType[] = ["PETROL", "DIESEL", "CNG"];
const PAYMENTS: PaymentMethod[] = ["CASH", "CREDIT"];

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export type RawParams = Record<string, string | string[] | undefined>;

/**
 * Parses URL params into filters. Every unknown or malformed value falls back
 * to a safe default rather than erroring — a hand-edited URL should show a
 * sensible register, not a stack trace.
 */
export function parseBillFilters(params: RawParams, forcedStatus?: BillStatus): BillFilters {
  const rawStatus = first(params.status);
  const status: BillStatus =
    forcedStatus ?? (rawStatus === "active" || rawStatus === "voided" || rawStatus === "all" ? rawStatus : "all");

  const rawFuel = first(params.fuel)?.toUpperCase();
  const rawPayment = first(params.payment)?.toUpperCase();
  const rawVehicle = first(params.vehicle);

  return {
    range: resolveRange(first(params.preset), first(params.from), first(params.to)),
    status,
    fuel: FUELS.find((f) => f === rawFuel) ?? null,
    payment: PAYMENTS.find((p) => p === rawPayment) ?? null,
    vehicleNo: rawVehicle ? normalizeVehicleNo(rawVehicle) || null : null,
    search: (first(params.q) ?? "").trim().slice(0, 60),
  };
}

/** Rebuilds the query string, preserving filters while changing one of them. */
export function billQueryString(f: BillFilters, override: Partial<Record<string, string | null>> = {}): string {
  const params = new URLSearchParams();

  if (f.range.preset !== "custom") params.set("preset", f.range.preset);
  else {
    params.set("from", isoDay(f.range.from));
    params.set("to", isoDay(f.range.to));
  }
  if (f.status !== "all") params.set("status", f.status);
  if (f.fuel) params.set("fuel", f.fuel);
  if (f.payment) params.set("payment", f.payment);
  if (f.vehicleNo) params.set("vehicle", f.vehicleNo);
  if (f.search) params.set("q", f.search);

  for (const [key, value] of Object.entries(override)) {
    if (value === null || value === undefined) params.delete(key);
    else params.set(key, value);
  }

  const s = params.toString();
  return s ? `?${s}` : "";
}

/** yyyy-mm-dd in local time — `toISOString` would shift the day either side of UTC. */
function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** True when anything narrows the register, so the UI can offer a "clear" affordance. */
export function hasActiveFilter(f: BillFilters): boolean {
  return f.status !== "all" || f.fuel !== null || f.payment !== null || f.vehicleNo !== null || f.search !== "";
}
