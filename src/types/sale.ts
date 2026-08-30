import type { PaymentMethod, FuelType } from "@prisma/client";

export type SaleMode = "LITERS" | "RUPEES";

export interface SaleReceipt {
  receiptNo: number;
  stationName: string;
  fuel: FuelType;
  liters: string;
  ratePerL: string;
  total: string;
  paymentMethod: PaymentMethod;
  customerName?: string | null;
  soldBy: string;
  at: string;
}
