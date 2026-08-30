export type AgeBucket = "0-30" | "31-60" | "61-90" | "90+";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface DebtorAgeingRow {
  customerId: string;
  customerName: string;
  panNumber: string;
  phone: string;
  creditLimitNpr: number;
  totalDueNpr: number;
  bucket0to30Npr: number;
  bucket31to60Npr: number;
  bucket61to90Npr: number;
  bucket90PlusNpr: number;
  oldestInvoiceDateBS: string;
  riskLevel: RiskLevel;
  lastPaymentDateBS?: string;
  lastPaymentAmountNpr?: number;
}

export interface CreditorAgeingRow {
  supplierId: string;
  supplierName: string;
  panNumber: string;
  category: "Fuel Refinery (NOC)" | "Lubricants & Oils" | "Spares & Maintenance" | "Utilities & Services";
  paymentTerms: string;
  totalPayableNpr: number;
  bucket0to30Npr: number;
  bucket31to60Npr: number;
  bucket61to90Npr: number;
  bucket90PlusNpr: number;
  oldestInvoiceRef: string;
  oldestInvoiceDateBS: string;
  isOverdue: boolean;
}

export type PartyType = "DEBTOR" | "CREDITOR";
export type ConfirmationStatus = "AGREED" | "PENDING_RESPONSE" | "DISPUTED" | "CONFIRMED_WITH_DIFF";

export interface BalanceConfirmationLetter {
  id: string;
  partyType: PartyType;
  partyId: string;
  partyName: string;
  panNumber: string;
  address: string;
  contactPerson: string;
  asOfDateBS: string;
  asOfDateAD: string;
  bookBalanceNpr: number;
  balanceType: "DR" | "CR";
  confirmedBalanceNpr?: number;
  differenceNpr?: number;
  status: ConfirmationStatus;
  disputeReason?: string;
  sentDateBS: string;
  responseDateBS?: string;
  auditorName: string;
  auditorFirm: string;
}

export type TransactionType = "SALES_INVOICE" | "FUEL_PURCHASE" | "BANK_DEPOSIT" | "CUSTOMER_SETTLEMENT" | "SUPPLIER_PAYMENT";

export interface LargeTransactionEntry {
  id: string;
  dateBS: string;
  dateAD: string;
  referenceNo: string;
  type: TransactionType;
  partyName: string;
  partyPan: string;
  amountNpr: number;
  paymentMode: string;
  description: string;
  isPanCompliant: boolean; // True if PAN provided for > 1 Lakh transactions
  flags?: string[];
}

export interface VatSplitRow {
  categoryName: string;
  code: string;
  direction: "SALES" | "PURCHASE";
  exemptAmountNpr: number;
  taxableAmountNpr: number;
  vatRatePct: number;
  vatAmountNpr: number;
  totalGrossNpr: number;
  statutoryReference: string; // e.g. "VAT Act 2052, Schedule 1"
}

export interface VatSplitSummary {
  salesTotalGrossNpr: number;
  salesTaxableNpr: number;
  salesExemptNpr: number;
  salesOutputVatNpr: number;

  purchaseTotalGrossNpr: number;
  purchaseTaxableNpr: number;
  purchaseExemptNpr: number;
  purchaseInputVatNpr: number;

  netVatLiabilityNpr: number;
}

export interface FiscalStockRow {
  fuelType: "PETROL" | "DIESEL" | "CNG" | "LUBRICANTS";
  productName: string;
  unit: "Ltr" | "Kg" | "Can";
  openingQty: number;
  openingRateNpr: number;
  openingValuationNpr: number;

  inwardPurchaseQty: number;
  inwardCostNpr: number;

  meteredSalesQty: number;
  meteredSalesRevenueNpr: number;

  transitLossAllowanceQty: number; // Decanting / evaporation loss within standard tolerance
  transitLossValueNpr: number;

  dipShortageQty: number; // Actual physical dip variance vs book

  closingPhysicalQty: number;
  closingValuationRateNpr: number;
  closingValuationNpr: number;

  costOfGoodsSoldNpr: number;
}

export interface BankReconciliationItem {
  id: string;
  dateBS: string;
  reference: string;
  particulars: string;
  amountNpr: number;
  type: "CHEQUE_ISSUED_NOT_PRESENTED" | "DEPOSIT_IN_TRANSIT" | "DIRECT_BANK_CREDIT" | "DIRECT_BANK_DEBIT_CHARGES";
  cleared: boolean;
  clearedDateBS?: string;
}

export interface BankReconciliationStatement {
  bankId: string;
  bankName: string;
  accountNumber: string;
  asOfDateBS: string;
  asOfDateAD: string;

  balanceAsPerCashBookNpr: number; // General Ledger balance

  // Additions
  unpresentedChequesTotalNpr: number;
  directBankCreditsTotalNpr: number;

  // Deductions
  uncreditedDepositsTotalNpr: number;
  bankChargesAndDirectDebitsTotalNpr: number;

  calculatedBalanceAsPerBankStatementNpr: number;
  actualBankStatementBalanceNpr: number;
  varianceNpr: number;

  items: BankReconciliationItem[];
}

/**
 * Calculates risk level based on age buckets and credit limit ratio.
 */
export function assessDebtorRisk(row: {
  totalDueNpr: number;
  creditLimitNpr: number;
  bucket61to90Npr: number;
  bucket90PlusNpr: number;
}): RiskLevel {
  if (row.bucket90PlusNpr > 0 || (row.creditLimitNpr > 0 && row.totalDueNpr > row.creditLimitNpr * 1.25)) {
    return "CRITICAL";
  }
  if (row.bucket61to90Npr > 0 || (row.creditLimitNpr > 0 && row.totalDueNpr > row.creditLimitNpr)) {
    return "HIGH";
  }
  if (row.totalDueNpr > 0 && row.creditLimitNpr > 0 && row.totalDueNpr > row.creditLimitNpr * 0.8) {
    return "MODERATE";
  }
  return "LOW";
}

/**
 * Reconciles bank balance according to standard auditing formula:
 * Balance as per Cash Book
 * + Cheques issued but not presented (unpresented cheques)
 * + Direct deposits / credits by bank not recorded in cash book
 * - Deposits in transit (uncredited bank deposits)
 * - Bank charges / direct debits not recorded in cash book
 * = Balance as per Bank Statement
 */
export function calculateReconciledBankBalance(
  cashBookBalance: number,
  unpresentedCheques: number,
  directBankCredits: number,
  uncreditedDeposits: number,
  bankCharges: number
): number {
  return cashBookBalance + unpresentedCheques + directBankCredits - uncreditedDeposits - bankCharges;
}

/**
 * Calculates stock cost of goods sold (COGS):
 * Opening Valuation + Purchases Inward - Closing Valuation
 */
export function calculateCOGS(
  openingValuation: number,
  purchasesCost: number,
  closingValuation: number
): number {
  return Math.max(0, openingValuation + purchasesCost - closingValuation);
}

/**
 * Filters and analyzes large transactions by threshold (default Rs 1,00,000).
 */
export function filterLargeTransactions(
  transactions: LargeTransactionEntry[],
  thresholdNpr: number = 100000,
  typeFilter: string = "ALL"
): LargeTransactionEntry[] {
  return transactions.filter((t) => {
    if (t.amountNpr < thresholdNpr) return false;
    if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
    return true;
  });
}
