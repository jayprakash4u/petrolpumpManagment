export interface IrdSalesEntry {
  id: string;
  dateBS: string; // e.g. "2083-05-08"
  dateAD: string;
  invoiceNo: string; // e.g. "INV-8305-0012"
  customerName: string;
  customerPan: string; // e.g. "601928374" or "N/A" for retail cash
  totalAmountNpr: number;
  nonTaxableAmountNpr: number;
  exportAmountNpr: number;
  taxableAmountNpr: number;
  vatAmountNpr: number; // 13% of taxableAmountNpr
  paymentMode: string;
}

export interface IrdSalesReturnEntry {
  id: string;
  dateBS: string;
  creditNoteNo: string; // e.g. "CN-8305-01"
  originalInvoiceNo: string;
  customerName: string;
  customerPan: string;
  reason: string;
  taxableAmountNpr: number;
  vatAmountNpr: number;
  totalAmountNpr: number;
}

export interface IrdPurchaseEntry {
  id: string;
  dateBS: string;
  dateAD: string;
  invoiceNo: string; // NOC or Supplier Invoice e.g. "NOC-AMLEKH-8910"
  supplierName: string; // e.g. "Nepal Oil Corporation Ltd"
  supplierPan: string; // e.g. "300059281"
  totalAmountNpr: number;
  nonTaxableAmountNpr: number;
  taxableAmountNpr: number;
  vatAmountNpr: number; // 13% Input VAT
  productType: "PETROL" | "DIESEL" | "CNG" | "LUBRICANTS" | "OTHER";
}

export interface IrdPurchaseReturnEntry {
  id: string;
  dateBS: string;
  debitNoteNo: string; // e.g. "DN-8305-01"
  originalInvoiceRef: string;
  supplierName: string;
  supplierPan: string;
  reason: string;
  taxableAmountNpr: number;
  vatAmountNpr: number;
  totalAmountNpr: number;
}

export interface IrdVatReturnSchedule10 {
  fiscalYear: string; // e.g. "2083/84"
  periodBS: string; // e.g. "Bhadra 2083"

  // Section A: Sales (बिक्री कारोबार)
  totalSalesNpr: number;
  taxableSalesNpr: number;
  exemptSalesNpr: number;
  exportSalesNpr: number;
  salesReturnTaxableNpr: number;
  netTaxableSalesNpr: number;
  outputVatCollectedNpr: number; // 13% of netTaxableSales

  // Section B: Purchases (खरिद कारोबार)
  totalPurchasesNpr: number;
  taxablePurchasesNpr: number;
  exemptPurchasesNpr: number;
  purchaseReturnTaxableNpr: number;
  netTaxablePurchasesNpr: number;
  inputVatPaidNpr: number; // 13% of netTaxablePurchases

  // Section C: Net VAT Calculation (कर मिलान तथा दाखिला)
  netVatPayableNpr: number; // Output VAT - Input VAT (if > 0, payable; if < 0, credit carry forward)
  isCreditCarryForward: boolean;
}

export interface IrdMonthlySalesRow {
  monthBS: string; // e.g. "Baisakh", "Jestha", ... "Bhadra"
  monthIndex: number;
  petrolLiters: number;
  dieselLiters: number;
  cngKg: number;
  lubesUnits: number;
  grossSalesNpr: number;
  taxableSalesNpr: number;
  vatAmountNpr: number;
}

export interface IrdQuantitativeStockRow {
  itemCode: string;
  itemName: string;
  unit: "Ltr" | "Kg" | "Can" | "Bottle";
  openingStock: number;
  purchaseInward: number;
  salesOutward: number;
  transitLoss: number; // Tanker decanting loss / calibration allowance
  closingStock: number; // (opening + inward - outward - transitLoss)
  ratePerUnitNpr: number;
  closingValuationNpr: number;
}

/**
 * Calculates statutory VAT Return (Schedule 10) from sales & purchase ledgers.
 */
export function calculateVatReturn({
  sales,
  purchases,
  salesReturns = [],
  purchaseReturns = [],
  fiscalYear = "2083/84",
  periodBS = "Bhadra 2083",
}: {
  sales: IrdSalesEntry[];
  purchases: IrdPurchaseEntry[];
  salesReturns?: IrdSalesReturnEntry[];
  purchaseReturns?: IrdPurchaseReturnEntry[];
  fiscalYear?: string;
  periodBS?: string;
}): IrdVatReturnSchedule10 {
  // Sales aggregates
  const totalSalesNpr = sales.reduce((sum, s) => sum + s.totalAmountNpr, 0);
  const rawTaxableSales = sales.reduce((sum, s) => sum + s.taxableAmountNpr, 0);
  const exemptSalesNpr = sales.reduce((sum, s) => sum + s.nonTaxableAmountNpr, 0);
  const exportSalesNpr = sales.reduce((sum, s) => sum + s.exportAmountNpr, 0);
  const salesReturnTaxableNpr = salesReturns.reduce((sum, r) => sum + r.taxableAmountNpr, 0);

  const netTaxableSalesNpr = Math.max(0, rawTaxableSales - salesReturnTaxableNpr);
  const outputVatCollectedNpr = Math.round(netTaxableSalesNpr * 0.13);

  // Purchase aggregates
  const totalPurchasesNpr = purchases.reduce((sum, p) => sum + p.totalAmountNpr, 0);
  const rawTaxablePurchases = purchases.reduce((sum, p) => sum + p.taxableAmountNpr, 0);
  const exemptPurchasesNpr = purchases.reduce((sum, p) => sum + p.nonTaxableAmountNpr, 0);
  const purchaseReturnTaxableNpr = purchaseReturns.reduce((sum, r) => sum + r.taxableAmountNpr, 0);

  const netTaxablePurchasesNpr = Math.max(0, rawTaxablePurchases - purchaseReturnTaxableNpr);
  const inputVatPaidNpr = Math.round(netTaxablePurchasesNpr * 0.13);

  // Net Tax
  const netDifference = outputVatCollectedNpr - inputVatPaidNpr;
  const isCreditCarryForward = netDifference < 0;
  const netVatPayableNpr = Math.abs(netDifference);

  return {
    fiscalYear,
    periodBS,
    totalSalesNpr,
    taxableSalesNpr: rawTaxableSales,
    exemptSalesNpr,
    exportSalesNpr,
    salesReturnTaxableNpr,
    netTaxableSalesNpr,
    outputVatCollectedNpr,
    totalPurchasesNpr,
    taxablePurchasesNpr: rawTaxablePurchases,
    exemptPurchasesNpr,
    purchaseReturnTaxableNpr,
    netTaxablePurchasesNpr,
    inputVatPaidNpr,
    netVatPayableNpr,
    isCreditCarryForward,
  };
}

/**
 * Validates and reconciles quantitative stock balances for petroleum dealers.
 */
export function calculateClosingStock(
  opening: number,
  inward: number,
  outward: number,
  transitLoss: number = 0
): number {
  return Math.round((opening + inward - outward - transitLoss) * 100) / 100;
}
