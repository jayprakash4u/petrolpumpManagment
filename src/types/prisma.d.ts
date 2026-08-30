import "@prisma/client";

declare module "@prisma/client" {
  export type Role = "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT" | "ATTENDANT" | "OTHER";
  export const Role: {
    readonly OWNER: "OWNER";
    readonly MANAGER: "MANAGER";
    readonly CASHIER: "CASHIER";
    readonly ACCOUNTANT: "ACCOUNTANT";
    readonly ATTENDANT: "ATTENDANT";
    readonly OTHER: "OTHER";
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
