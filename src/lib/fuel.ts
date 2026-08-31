import type { FuelType } from "@/lib/permissions";

export type FuelId = FuelType;
export type FuelKey = FuelType;

export const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
};

export const FUEL_LABELS = FUEL_LABEL;

/** Industry short code (Nepal Oil Corporation terminology), shown alongside the full name — e.g. "Petrol (MS)". */
export const FUEL_SHORT_CODE: Record<string, string> = {
  PETROL: "MS",
  DIESEL: "HSD",
  CNG: "CNG",
};

export const FUEL_ORDER: FuelType[] = ["PETROL", "DIESEL", "CNG"];
