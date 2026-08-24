export type LedgerCategory = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
export type BalanceType = "DEBIT" | "CREDIT";

export type VoucherType =
  | "RECEIPT"
  | "PAYMENT"
  | "JOURNAL"
  | "CONTRA"
  | "DEBIT_NOTE"
  | "CREDIT_NOTE";

export type PaymentChannel = "CASH" | "BANK_TRANSFER" | "FONEPAY_QR" | "CHEQUE";

export interface LedgerHead {
  id: string;
  code: string; // e.g. "1010"
  name: string;
  category: LedgerCategory;
  openingBalanceNpr: number;
  currentBalanceNpr: number;
  balanceType: BalanceType;
  description: string;
  isSystem: boolean; // Cannot delete standard station heads
}

export interface VoucherEntry {
  id: string;
  voucherNo: string; // e.g. "RV-8305-01", "PV-8305-02", "CV-8305-01"
  voucherType: VoucherType;
  dateBS: string; // e.g. "2083-05-08"
  dateAD: string;
  debitLedgerId: string;
  debitLedgerName: string;
  creditLedgerId: string;
  creditLedgerName: string;
  amountNpr: number;
  narration: string;
  paymentChannel?: PaymentChannel;
  referenceNo?: string;
  preparedByName: string;
  voided?: boolean;
}

export interface DayBookItem {
  id: string;
  time: string;
  voucherNo: string;
  voucherType: VoucherType;
  particulars: string;
  debitLedgerName: string;
  creditLedgerName: string;
  debitAmountNpr: number;
  creditAmountNpr: number;
  preparedBy: string;
}

export interface CashConfirmationRecord {
  id: string;
  dateBS: string;
  expectedCashNpr: number;
  physicalCashCountedNpr: number;
  varianceNpr: number; // positive = excess, negative = shortage
  bankDepositedNpr: number;
  depositedBankName?: string;
  depositSlipRef?: string;
  confirmedByName: string;
  status: "SETTLED" | "FLAGGED_VARIANCE";
  notes?: string;
}

export interface TrialBalanceItem {
  ledgerId: string;
  code: string;
  name: string;
  category: LedgerCategory;
  debitNpr: number;
  creditNpr: number;
}

export interface ProfitLossStatement {
  periodBS: string;
  // Revenue
  petrolSalesNpr: number;
  dieselSalesNpr: number;
  cngSalesNpr: number;
  lubricantsSalesNpr: number;
  otherIncomeNpr: number;
  totalRevenueNpr: number;

  // Cost of Goods Sold (COGS)
  fuelPurchasesNpr: number;
  lubricantsPurchasesNpr: number;
  totalCogsNpr: number;
  grossProfitNpr: number;

  // Operating Expenses
  staffSalariesNpr: number;
  generatorFuelNpr: number;
  electricityUtilitiesNpr: number;
  maintenanceRepairsNpr: number;
  bankChargesNpr: number;
  miscellaneousExpensesNpr: number;
  totalOperatingExpensesNpr: number;

  // Net
  netProfitNpr: number;
  profitMarginPct: number;
}

export interface CreditDebitNote {
  id: string;
  noteNo: string; // e.g. "DN-8305-01" or "CN-8305-01"
  type: "DEBIT_NOTE" | "CREDIT_NOTE";
  dateBS: string;
  partyName: string;
  partyLedgerId: string;
  reason: string;
  amountNpr: number;
  invoiceRef: string;
  issuedByName: string;
}

/**
 * Calculates Trial Balance across all ledger heads based on current balances.
 */
export function calculateTrialBalance(ledgers: LedgerHead[]): {
  items: TrialBalanceItem[];
  totalDebitNpr: number;
  totalCreditNpr: number;
  isBalanced: boolean;
} {
  let totalDebitNpr = 0;
  let totalCreditNpr = 0;

  const items: TrialBalanceItem[] = ledgers.map((l) => {
    let debitNpr = 0;
    let creditNpr = 0;

    if (l.balanceType === "DEBIT") {
      debitNpr = l.currentBalanceNpr;
      totalDebitNpr += debitNpr;
    } else {
      creditNpr = l.currentBalanceNpr;
      totalCreditNpr += creditNpr;
    }

    return {
      ledgerId: l.id,
      code: l.code,
      name: l.name,
      category: l.category,
      debitNpr,
      creditNpr,
    };
  });

  return {
    items,
    totalDebitNpr,
    totalCreditNpr,
    isBalanced: Math.abs(totalDebitNpr - totalCreditNpr) < 1,
  };
}

/**
 * Calculates Profit & Loss Statement figures.
 */
export function calculateProfitAndLoss({
  petrolSalesNpr = 4850000,
  dieselSalesNpr = 6200000,
  cngSalesNpr = 450000,
  lubricantsSalesNpr = 280000,
  otherIncomeNpr = 35000,
  fuelPurchasesNpr = 9850000,
  lubricantsPurchasesNpr = 210000,
  staffSalariesNpr = 182000,
  generatorFuelNpr = 38500,
  electricityUtilitiesNpr = 24000,
  maintenanceRepairsNpr = 18500,
  bankChargesNpr = 6200,
  miscellaneousExpensesNpr = 14500,
  periodBS = "Bhadra 2083",
}: Partial<ProfitLossStatement>): ProfitLossStatement {
  const totalRevenueNpr = petrolSalesNpr + dieselSalesNpr + cngSalesNpr + lubricantsSalesNpr + otherIncomeNpr;
  const totalCogsNpr = fuelPurchasesNpr + lubricantsPurchasesNpr;
  const grossProfitNpr = totalRevenueNpr - totalCogsNpr;

  const totalOperatingExpensesNpr =
    staffSalariesNpr +
    generatorFuelNpr +
    electricityUtilitiesNpr +
    maintenanceRepairsNpr +
    bankChargesNpr +
    miscellaneousExpensesNpr;

  const netProfitNpr = grossProfitNpr - totalOperatingExpensesNpr;
  const profitMarginPct = totalRevenueNpr > 0 ? (netProfitNpr / totalRevenueNpr) * 100 : 0;

  return {
    periodBS,
    petrolSalesNpr,
    dieselSalesNpr,
    cngSalesNpr,
    lubricantsSalesNpr,
    otherIncomeNpr,
    totalRevenueNpr,
    fuelPurchasesNpr,
    lubricantsPurchasesNpr,
    totalCogsNpr,
    grossProfitNpr,
    staffSalariesNpr,
    generatorFuelNpr,
    electricityUtilitiesNpr,
    maintenanceRepairsNpr,
    bankChargesNpr,
    miscellaneousExpensesNpr,
    totalOperatingExpensesNpr,
    netProfitNpr,
    profitMarginPct: Math.round(profitMarginPct * 10) / 10,
  };
}

/**
 * Formats voucher entries into Day Book chronological journal lines.
 */
export function formatDayBookItems(vouchers: VoucherEntry[], targetDateBS?: string): DayBookItem[] {
  const filtered = targetDateBS
    ? vouchers.filter((v) => v.dateBS === targetDateBS && !v.voided)
    : vouchers.filter((v) => !v.voided);

  return filtered.map((v, i) => ({
    id: `db-${v.id}`,
    time: `10:${i < 10 ? "0" + i : i} AM`,
    voucherNo: v.voucherNo,
    voucherType: v.voucherType,
    particulars: v.narration,
    debitLedgerName: v.debitLedgerName,
    creditLedgerName: v.creditLedgerName,
    debitAmountNpr: v.amountNpr,
    creditAmountNpr: v.amountNpr,
    preparedBy: v.preparedByName,
  }));
}
