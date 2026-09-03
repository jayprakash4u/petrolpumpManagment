import "@prisma/client";

declare module "@prisma/client" {
  // Kept in sync with @/lib/permissions — one role, "Pump Admin", full access.
  export type Role = "OWNER";
  export const Role: {
    readonly OWNER: "OWNER";
  };

  export type FuelType = "PETROL" | "DIESEL" | "CNG";
  export const FuelType: {
    readonly PETROL: "PETROL";
    readonly DIESEL: "DIESEL";
    readonly CNG: "CNG";
  };

  export type PaymentMethod = "CASH" | "CREDIT";
  export const PaymentMethod: {
    readonly CASH: "CASH";
    readonly CREDIT: "CREDIT";
  };
}
