import type { FuelType } from "@prisma/client";

/** Re-exported as a plain string-literal alias so non-Prisma-aware modules (pure UI) don't need to import the Prisma enum type directly. */
export type FuelId = FuelType;

export const FUEL_LABEL: Record<FuelId, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
};

export const FUEL_ORDER: FuelId[] = ["PETROL", "DIESEL", "CNG"];
