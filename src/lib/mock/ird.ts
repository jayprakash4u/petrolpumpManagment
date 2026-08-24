import type {
  IrdSalesEntry,
  IrdSalesReturnEntry,
  IrdPurchaseEntry,
  IrdPurchaseReturnEntry,
  IrdMonthlySalesRow,
  IrdQuantitativeStockRow,
} from "@/lib/ird";

export const MOCK_IRD_SALES: IrdSalesEntry[] = [
  {
    id: "ird-s-01",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    invoiceNo: "INV-8305-0012",
    customerName: "Kathmandu Metropolitan City (Fleet Depot)",
    customerPan: "601928374",
    totalAmountNpr: 169500,
    nonTaxableAmountNpr: 0,
    exportAmountNpr: 0,
    taxableAmountNpr: 150000,
    vatAmountNpr: 19500,
    paymentMode: "BANK_RTGS",
  },
  {
    id: "ird-s-02",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    invoiceNo: "INV-8305-0013",
    customerName: "Sajha Yatayat Cooperative Ltd",
    customerPan: "300188921",
    totalAmountNpr: 282500,
    nonTaxableAmountNpr: 0,
    exportAmountNpr: 0,
    taxableAmountNpr: 250000,
    vatAmountNpr: 32500,
    paymentMode: "CREDIT_ACCOUNT",
  },
  {
    id: "ird-s-03",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    invoiceNo: "INV-8305-0014",
    customerName: "Retail Cash Customers (Dispenser Aggregated)",
    customerPan: "N/A",
    totalAmountNpr: 429400,
    nonTaxableAmountNpr: 0,
    exportAmountNpr: 0,
    taxableAmountNpr: 380000,
    vatAmountNpr: 49400,
    paymentMode: "CASH_COUNTER",
  },
  {
    id: "ird-s-04",
    dateBS: "2083-05-07",
    dateAD: "2026-08-23",
    invoiceNo: "INV-8305-0010",
    customerName: "Himalayan Construction & Equipment Pvt Ltd",
    customerPan: "609918231",
    totalAmountNpr: 135600,
    nonTaxableAmountNpr: 0,
    exportAmountNpr: 0,
    taxableAmountNpr: 120000,
    vatAmountNpr: 15600,
    paymentMode: "FONEPAY_QR",
  },
  {
    id: "ird-s-05",
    dateBS: "2083-05-07",
    dateAD: "2026-08-23",
    invoiceNo: "INV-8305-0011",
    customerName: "Retail Cash Customers (Dispenser Aggregated)",
    customerPan: "N/A",
    totalAmountNpr: 395500,
    nonTaxableAmountNpr: 0,
    exportAmountNpr: 0,
    taxableAmountNpr: 350000,
    vatAmountNpr: 45500,
    paymentMode: "CASH_COUNTER",
  },
];

export const MOCK_IRD_SALES_RETURNS: IrdSalesReturnEntry[] = [
  {
    id: "ird-sr-01",
    dateBS: "2083-05-05",
    creditNoteNo: "CN-8305-01",
    originalInvoiceNo: "INV-8305-0004",
    customerName: "Kathmandu Metropolitan City",
    customerPan: "601928374",
    reason: "Nozzle meter error correction on Diesel bill",
    taxableAmountNpr: 2800,
    vatAmountNpr: 364,
    totalAmountNpr: 3164,
  },
];

export const MOCK_IRD_PURCHASES: IrdPurchaseEntry[] = [
  {
    id: "ird-p-01",
    dateBS: "2083-05-06",
    dateAD: "2026-08-22",
    invoiceNo: "NOC-AMLEKH-8910",
    supplierName: "Nepal Oil Corporation Ltd (Amlekhgunj Depot)",
    supplierPan: "300059281",
    totalAmountNpr: 2260000,
    nonTaxableAmountNpr: 0,
    taxableAmountNpr: 2000000,
    vatAmountNpr: 260000,
    productType: "DIESEL",
  },
  {
    id: "ird-p-02",
    dateBS: "2083-05-04",
    dateAD: "2026-08-20",
    invoiceNo: "NOC-THANKOT-4412",
    supplierName: "Nepal Oil Corporation Ltd (Thankot Depot)",
    supplierPan: "300059281",
    totalAmountNpr: 1808000,
    nonTaxableAmountNpr: 0,
    taxableAmountNpr: 1600000,
    vatAmountNpr: 208000,
    productType: "PETROL",
  },
  {
    id: "ird-p-03",
    dateBS: "2083-05-02",
    dateAD: "2026-08-18",
    invoiceNo: "NL-INV-9901",
    supplierName: "Nepal Lubricants Pvt Ltd",
    supplierPan: "602881923",
    totalAmountNpr: 113000,
    nonTaxableAmountNpr: 0,
    taxableAmountNpr: 100000,
    vatAmountNpr: 13000,
    productType: "LUBRICANTS",
  },
];

export const MOCK_IRD_PURCHASE_RETURNS: IrdPurchaseReturnEntry[] = [
  {
    id: "ird-pr-01",
    dateBS: "2083-05-03",
    debitNoteNo: "DN-8305-01",
    originalInvoiceRef: "NL-INV-9901",
    supplierName: "Nepal Lubricants Pvt Ltd",
    supplierPan: "602881923",
    reason: "Damaged 20L Mobil Super drum return (transit leak)",
    taxableAmountNpr: 12832,
    vatAmountNpr: 1668,
    totalAmountNpr: 14500,
  },
];

export const MOCK_MONTHLY_SALES: IrdMonthlySalesRow[] = [
  {
    monthBS: "Baisakh 2083",
    monthIndex: 1,
    petrolLiters: 48500,
    dieselLiters: 78000,
    cngKg: 6200,
    lubesUnits: 340,
    grossSalesNpr: 12650000,
    taxableSalesNpr: 11194690,
    vatAmountNpr: 1455310,
  },
  {
    monthBS: "Jestha 2083",
    monthIndex: 2,
    petrolLiters: 52000,
    dieselLiters: 84500,
    cngKg: 6800,
    lubesUnits: 410,
    grossSalesNpr: 13800000,
    taxableSalesNpr: 12212389,
    vatAmountNpr: 1587611,
  },
  {
    monthBS: "Ashadh 2083",
    monthIndex: 3,
    petrolLiters: 49200,
    dieselLiters: 81000,
    cngKg: 6400,
    lubesUnits: 380,
    grossSalesNpr: 13100000,
    taxableSalesNpr: 11592920,
    vatAmountNpr: 1507080,
  },
  {
    monthBS: "Shrawan 2083",
    monthIndex: 4,
    petrolLiters: 51000,
    dieselLiters: 83200,
    cngKg: 6600,
    lubesUnits: 395,
    grossSalesNpr: 13450000,
    taxableSalesNpr: 11902655,
    vatAmountNpr: 1547345,
  },
  {
    monthBS: "Bhadra 2083 (Current)",
    monthIndex: 5,
    petrolLiters: 53500,
    dieselLiters: 87400,
    cngKg: 7100,
    lubesUnits: 440,
    grossSalesNpr: 14120000,
    taxableSalesNpr: 12495575,
    vatAmountNpr: 1624425,
  },
];

export const MOCK_QUANTITATIVE_STOCK: IrdQuantitativeStockRow[] = [
  {
    itemCode: "PET-MS",
    itemName: "Motor Spirit (MS Petrol 91 Octane)",
    unit: "Ltr",
    openingStock: 12500,
    purchaseInward: 40000,
    salesOutward: 38200,
    transitLoss: 65,
    closingStock: 14235,
    ratePerUnitNpr: 172.0,
    closingValuationNpr: 2448420,
  },
  {
    itemCode: "DSL-HSD",
    itemName: "High Speed Diesel (HSD Bharat IV)",
    unit: "Ltr",
    openingStock: 18400,
    purchaseInward: 60000,
    salesOutward: 57600,
    transitLoss: 90,
    closingStock: 20710,
    ratePerUnitNpr: 160.0,
    closingValuationNpr: 3313600,
  },
  {
    itemCode: "GAS-CNG",
    itemName: "Compressed Natural Gas (CNG Auto)",
    unit: "Kg",
    openingStock: 2100,
    purchaseInward: 8000,
    salesOutward: 7850,
    transitLoss: 15,
    closingStock: 2235,
    ratePerUnitNpr: 125.0,
    closingValuationNpr: 279375,
  },
  {
    itemCode: "LUB-20W50",
    itemName: "Servo 4T Super 20W-50 (1L Bottle)",
    unit: "Bottle",
    openingStock: 140,
    purchaseInward: 200,
    salesOutward: 165,
    transitLoss: 0,
    closingStock: 175,
    ratePerUnitNpr: 680.0,
    closingValuationNpr: 119000,
  },
  {
    itemCode: "LUB-80W90",
    itemName: "Servo Gear HP 80W-90 (5L Can)",
    unit: "Can",
    openingStock: 45,
    purchaseInward: 50,
    salesOutward: 38,
    transitLoss: 0,
    closingStock: 57,
    ratePerUnitNpr: 2450.0,
    closingValuationNpr: 139650,
  },
];

export function getIrdSales(): IrdSalesEntry[] {
  return [...MOCK_IRD_SALES];
}

export function getIrdSalesReturns(): IrdSalesReturnEntry[] {
  return [...MOCK_IRD_SALES_RETURNS];
}

export function getIrdPurchases(): IrdPurchaseEntry[] {
  return [...MOCK_IRD_PURCHASES];
}

export function getIrdPurchaseReturns(): IrdPurchaseReturnEntry[] {
  return [...MOCK_IRD_PURCHASE_RETURNS];
}

export function getIrdMonthlySales(): IrdMonthlySalesRow[] {
  return [...MOCK_MONTHLY_SALES];
}

export function getIrdQuantitativeStock(): IrdQuantitativeStockRow[] {
  return [...MOCK_QUANTITATIVE_STOCK];
}
