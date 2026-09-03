import type { FuelType } from "@/lib/permissions";

export interface Supplier {
  id: string;
  name: string;
  category: "Fuel Refinery" | "Lubricants & Oils" | "Spares & Equipment" | "Utilities & Govt" | (string & {});
  panVatNo: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  paymentTerms: "Advance / Pre-paid" | "Net 15 Days" | "Net 30 Days" | "Immediate Cash" | (string & {});
  balanceDueNpr: number;
  totalPurchasedNpr: number;
  active: boolean;
}

export interface FuelPurchaseDelivery {
  id: string;
  dateBS: string;
  time: string;
  invoiceNo: string;
  challanNo: string;
  tankerNo: string; // Tanker truck plate no
  supplierId: string;
  supplierName: string;
  depotLocation: string; // e.g. "Amlekhgunj Depot"
  fuel: FuelType;
  tankId: string;
  tankName: string;
  litresOrdered: number;
  litresDelivered: number; // Volume received
  invoiceRatePerL: number;
  totalAmountNpr: number;
  vatAmountNpr: number;
  densityObserved: number; // kg/m3
  temperatureC: number;
  recordedByName: string;
  paymentStatus: "Paid" | "Pending" | "Partial";
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: "Engine Oil" | "Gear & Brake Oil" | "Coolant & Additive" | "Consumables & Spares" | (string & {});
  unit: "Litre" | "Can (1L)" | "Can (5L)" | "Drum (208L)" | "Pcs" | "Bottle" | (string & {});
  stockInHand: number;
  reorderLevel: number;
  costPriceNpr: number;
  sellingPriceNpr: number;
  supplierName: string;
  lastRestockedBS: string;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  debitNoteNo: string;
  originalInvoiceNo: string;
  dateBS: string;
  supplierId: string;
  supplierName: string;
  itemDescription: string;
  quantity: number;
  unitPriceNpr: number;
  totalReturnAmountNpr: number;
  reason: "Damaged Packaging / Seal" | "Off-Spec Density" | "Excess Shipment" | "Expired Batch" | (string & {});
  status: "Approved & Adjusted" | "Pending Vendor Credit";
  approvedByName: string;
}

/** One line of an expense bill — a bill can carry several (fuel filter cartridge + labour, say), each separately marked taxable or not. */
export interface ExpenseLineItem {
  name: string;
  ledger: string;
  quantity: string;
  detail: string;
  cost: number;
  taxable: boolean;
}

export interface StationExpense {
  id: string;
  voucherNo: string;
  dateBS: string;
  category: "Electricity & Utilities" | "Generator Diesel" | "Station Maintenance" | "Staff Meals & Tea" | "Municipal & Taxes" | "Stationery & Audit" | (string & {});
  description: string;
  amountNpr: number;
  paymentMode?: "Cash Till" | "Bank Transfer" | "Fonepay QR" | (string & {});
  recipientName: string;
  approvedByName?: string;
  receiptAttached?: boolean;

  // Bill-entry detail, captured when the expense was recorded through the
  // full Add Expense form rather than typed in as one lump sum.
  invoiceNo?: string;
  supplierPan?: string;
  items?: ExpenseLineItem[];
  taxableAmount?: number;
  nonTaxableAmount?: number;
  discountAmount?: number;
  vatAmount?: number;
  grandTotal?: number;
  /** Set when this expense has been reversed — kept on the record, not deleted, so the register still shows it happened. */
  returned?: boolean;
}

export interface FixedAsset {
  id: string;
  assetTag: string;
  name: string;
  category: "Dispensers & Pumps" | "Storage Tanks" | "Power & Generator" | "Security & POS IT" | "Canopy & Civil" | (string & {});
  brandModel: string;
  serialNo: string;
  purchaseDateBS: string;
  purchaseCostNpr: number;
  vendorName: string;
  currentCondition: "Optimal" | "Operational" | "Maintenance Due";
  warrantyExpiryBS: string;
  location: string;
}

export interface PurchaseSummaryTotals {
  totalFuelProcurementNpr: number;
  totalLubricantStockValueNpr: number;
  totalMonthlyExpensesNpr: number;
  totalSuppliersCount: number;
  pendingSupplierPayablesNpr: number;
}
