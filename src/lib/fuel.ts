import type { FuelType } from "@/lib/permissions";

export type FuelId = FuelType;
export type FuelKey = FuelType;

export const FUEL_LABEL: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
};

export const FUEL_LABELS = FUEL_LABEL;

export const FUEL_ORDER: FuelType[] = ["PETROL", "DIESEL", "CNG"];
