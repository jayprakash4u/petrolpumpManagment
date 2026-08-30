import type { FuelType, PaymentMethod } from "@/lib/permissions";

/**
 * Static sample data for the Billing screens.
 *
 * These pages are UI-first on purpose: the layout, filters and empty states
 * get settled before any query is written, so the eventual data layer is
 * shaped by what the screen actually needs rather than the other way round.
 *
 * Everything here is plain, already-formatted strings. No Decimal, no Date,
 * no Prisma — swapping this module for real queries later should not require
 * touching the components, only the values they are handed.
 */

export interface MockBill {
  id: string;
  receiptNo: number;
  fuel: FuelType;
  liters: string;
  rate: string;
  amount: string;
  payment: PaymentMethod;
  customer: string | null;
  vehicleNo: string | null;
  /** Canonical BS date, as it will be printed on the invoice. */
  dateBS: string;
  time: string;
  soldBy: string;
  voided: boolean;
  voidReason?: string;
}

/**
 * A realistic day at a Kathmandu pump: a mix of fuels, cash and credit, some
 * vehicles recorded and some not, and two credit notes. Deliberately includes
 * the awkward cases — a walk-in with no plate, a voided credit sale — because
 * those are the rows that break a layout.
 */
export const MOCK_BILLS: MockBill[] = [
  {
    id: "b12",
    receiptNo: 112,
    fuel: "DIESEL",
    liters: "120 L",
    rate: "Rs 92.34",
    amount: "Rs 11,081",
    payment: "CREDIT",
    customer: "Everest Logistics",
    vehicleNo: "BA2KHA1234",
    dateBS: "2083-05-03",
    time: "4:42 pm",
    soldBy: "Sita Gurung",
    voided: false,
  },
  {
    id: "b11",
    receiptNo: 111,
    fuel: "PETROL",
    liters: "35 L",
    rate: "Rs 106.48",
    amount: "Rs 3,727",
    payment: "CASH",
    customer: null,
    vehicleNo: "BA12PA4455",
    dateBS: "2083-05-03",
    time: "3:15 pm",
    soldBy: "Ramesh Thapa",
    voided: false,
  },
  {
    id: "b10",
    receiptNo: 110,
    fuel: "PETROL",
    liters: "20 L",
    rate: "Rs 106.48",
    amount: "Rs 2,130",
    payment: "CASH",
    customer: null,
    // A walk-in with a jerry can — no plate, and the table must not pretend
    // otherwise.
    vehicleNo: null,
    dateBS: "2083-05-03",
    time: "2:04 pm",
    soldBy: "Ramesh Thapa",
    voided: false,
  },
  {
    id: "b09",
    receiptNo: 109,
    fuel: "CNG",
    liters: "15 L",
    rate: "Rs 78.10",
    amount: "Rs 1,172",
    payment: "CASH",
    customer: null,
    vehicleNo: "BA5CHA7788",
    dateBS: "2083-05-03",
    time: "1:20 pm",
    soldBy: "Sita Gurung",
    voided: false,
  },
  {
    id: "b08",
    receiptNo: 108,
    fuel: "PETROL",
    liters: "40 L",
    rate: "Rs 106.48",
    amount: "Rs 4,259",
    payment: "CREDIT",
    customer: "Kathmandu Cabs Pvt. Ltd.",
    vehicleNo: "BA2KHA1234",
    dateBS: "2083-05-02",
    time: "11:48 am",
    soldBy: "Ramesh Thapa",
    voided: true,
    voidReason: "Billed to the wrong account",
  },
  {
    id: "b07",
    receiptNo: 107,
    fuel: "DIESEL",
    liters: "200 L",
    rate: "Rs 92.34",
    amount: "Rs 18,468",
    payment: "CREDIT",
    customer: "Everest Logistics",
    vehicleNo: "NA3KHA9012",
    dateBS: "2083-05-02",
    time: "10:05 am",
    soldBy: "Sita Gurung",
    voided: false,
  },
  {
    id: "b06",
    receiptNo: 106,
    fuel: "PETROL",
    liters: "25 L",
    rate: "Rs 106.48",
    amount: "Rs 2,662",
    payment: "CASH",
    customer: null,
    vehicleNo: "BA12PA4455",
    dateBS: "2083-05-01",
    time: "5:30 pm",
    soldBy: "Bikash Rai",
    voided: false,
  },
  {
    id: "b05",
    receiptNo: 105,
    fuel: "DIESEL",
    liters: "60 L",
    rate: "Rs 92.34",
    amount: "Rs 5,540",
    payment: "CASH",
    customer: null,
    vehicleNo: null,
    dateBS: "2083-05-01",
    time: "9:12 am",
    soldBy: "Bikash Rai",
    voided: true,
    voidReason: "Meter misread at the pump",
  },
];

export const MOCK_LIVE_BILLS = MOCK_BILLS.filter((b) => !b.voided);
export const MOCK_VOIDED_BILLS = MOCK_BILLS.filter((b) => b.voided);

/** Totals for the sample set, precomputed so a static page stays a static page. */
export const MOCK_TOTALS = {
  netAmount: "Rs 42,269",
  netLiters: "455 L",
  liveCount: MOCK_LIVE_BILLS.length,
  voidedAmount: "Rs 9,799",
  voidedCount: MOCK_VOIDED_BILLS.length,
};

export interface MockVehicleRow {
  vehicleNo: string;
  saleCount: number;
  liters: string;
  amount: string;
  lastSeenBS: string;
  topCustomer: string | null;
}

/**
 * The same sales grouped by vehicle. Ordered by spend, because the question
 * behind this screen is almost always "which vehicles are costing us most".
 */
export const MOCK_VEHICLE_ROWS: MockVehicleRow[] = [
  {
    vehicleNo: "NA3KHA9012",
    saleCount: 1,
    liters: "200 L",
    amount: "Rs 18,468",
    lastSeenBS: "2083-05-02",
    topCustomer: "Everest Logistics",
  },
  {
    vehicleNo: "BA2KHA1234",
    saleCount: 1,
    liters: "120 L",
    amount: "Rs 11,081",
    lastSeenBS: "2083-05-03",
    topCustomer: "Everest Logistics",
  },
  {
    vehicleNo: "BA12PA4455",
    saleCount: 2,
    liters: "60 L",
    amount: "Rs 6,389",
    lastSeenBS: "2083-05-03",
    topCustomer: null,
  },
  {
    vehicleNo: "BA5CHA7788",
    saleCount: 1,
    liters: "15 L",
    amount: "Rs 1,172",
    lastSeenBS: "2083-05-03",
    topCustomer: null,
  },
];

export const MOCK_VEHICLE_TOTALS = {
  vehicleCount: MOCK_VEHICLE_ROWS.length,
  totalLiters: "395 L",
  totalAmount: "Rs 37,110",
  /** Sales with no plate recorded. Surfaced rather than hidden — it is a data-quality signal. */
  unattributed: 2,
};

/** Fuel options for the sample forms, matching the seeded station's rates. */
export const MOCK_FUEL_OPTIONS = [
  { fuel: "PETROL" as FuelType, label: "Petrol", rate: "106.48", stock: "8,214" },
  { fuel: "DIESEL" as FuelType, label: "Diesel", rate: "92.34", stock: "9,460" },
  { fuel: "CNG" as FuelType, label: "CNG", rate: "78.10", stock: "1,175" },
];
