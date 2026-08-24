import type {
  LedgerHead,
  VoucherEntry,
  CashConfirmationRecord,
  CreditDebitNote,
  VoucherType,
} from "@/lib/accounts";

export const MOCK_LEDGERS: LedgerHead[] = [
  // ASSETS (1000s)
  {
    id: "led-1010",
    code: "1010",
    name: "Cash in Safe (Station Vault)",
    category: "ASSET",
    openingBalanceNpr: 450000,
    currentBalanceNpr: 580000,
    balanceType: "DEBIT",
    description: "Physical cash held in the station master safe.",
    isSystem: true,
  },
  {
    id: "led-1020",
    code: "1020",
    name: "Cash in Counter Till",
    category: "ASSET",
    openingBalanceNpr: 50000,
    currentBalanceNpr: 68500,
    balanceType: "DEBIT",
    description: "Petty cash and daily sales float at cashier counter.",
    isSystem: true,
  },
  {
    id: "led-1030",
    code: "1030",
    name: "Nabil Bank Current A/C (Operating)",
    category: "ASSET",
    openingBalanceNpr: 1850000,
    currentBalanceNpr: 2450000,
    balanceType: "DEBIT",
    description: "Primary operational bank account for daily deposits and NOC RTGS.",
    isSystem: true,
  },
  {
    id: "led-1040",
    code: "1040",
    name: "Global IME Bank (Collection)",
    category: "ASSET",
    openingBalanceNpr: 950000,
    currentBalanceNpr: 1200000,
    balanceType: "DEBIT",
    description: "Corporate customer fleet payment collection account.",
    isSystem: false,
  },
  {
    id: "led-1050",
    code: "1050",
    name: "Fuel Inventory (Underground Tanks)",
    category: "ASSET",
    openingBalanceNpr: 3800000,
    currentBalanceNpr: 4200000,
    balanceType: "DEBIT",
    description: "Physical stock value of Petrol, Diesel, and CNG in tanks.",
    isSystem: true,
  },
  {
    id: "led-1060",
    code: "1060",
    name: "Customer Receivables (Credit Ledger)",
    category: "ASSET",
    openingBalanceNpr: 1450000,
    currentBalanceNpr: 1680000,
    balanceType: "DEBIT",
    description: "Total outstanding credit balance owed by corporate & credit accounts.",
    isSystem: true,
  },

  // LIABILITIES (2000s)
  {
    id: "led-2010",
    code: "2010",
    name: "Nepal Oil Corporation (NOC) Payable",
    category: "LIABILITY",
    openingBalanceNpr: 2100000,
    currentBalanceNpr: 1950000,
    balanceType: "CREDIT",
    description: "Accounts payable for bulk tanker procurement from Amlekhgunj / Thankot.",
    isSystem: true,
  },
  {
    id: "led-2020",
    code: "2020",
    name: "Customer Security Deposits",
    category: "LIABILITY",
    openingBalanceNpr: 800000,
    currentBalanceNpr: 850000,
    balanceType: "CREDIT",
    description: "Refundable security deposits held from corporate fleet accounts.",
    isSystem: false,
  },
  {
    id: "led-2030",
    code: "2030",
    name: "Staff Salaries & PF Payable",
    category: "LIABILITY",
    openingBalanceNpr: 160000,
    currentBalanceNpr: 182000,
    balanceType: "CREDIT",
    description: "Accrued monthly staff salaries and provident fund dues.",
    isSystem: true,
  },

  // EQUITY (3000s)
  {
    id: "led-3010",
    code: "3010",
    name: "Proprietor Capital Account",
    category: "EQUITY",
    openingBalanceNpr: 5000000,
    currentBalanceNpr: 5000000,
    balanceType: "CREDIT",
    description: "Owner's initial equity capital invested in the station.",
    isSystem: true,
  },
  {
    id: "led-3020",
    code: "3020",
    name: "Retained Earnings & Reserves",
    category: "EQUITY",
    openingBalanceNpr: 1490000,
    currentBalanceNpr: 2196500,
    balanceType: "CREDIT",
    description: "Cumulative net profits retained in the business.",
    isSystem: true,
  },

  // REVENUE (4000s)
  {
    id: "led-4010",
    code: "4010",
    name: "Fuel Sales (Petrol MS)",
    category: "INCOME",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "CREDIT",
    description: "Revenue from retail Petrol dispenser sales.",
    isSystem: true,
  },
  {
    id: "led-4020",
    code: "4020",
    name: "Fuel Sales (Diesel HSD)",
    category: "INCOME",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "CREDIT",
    description: "Revenue from retail Diesel dispenser sales.",
    isSystem: true,
  },
  {
    id: "led-4030",
    code: "4030",
    name: "Lubricants & Engine Oil Sales",
    category: "INCOME",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "CREDIT",
    description: "Revenue from engine oil, grease, and brake fluid retail sales.",
    isSystem: true,
  },

  // EXPENSES (5000s)
  {
    id: "led-5010",
    code: "5010",
    name: "Electricity & NEA Utility Expenses",
    category: "EXPENSE",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "DEBIT",
    description: "Monthly Nepal Electricity Authority station power bills.",
    isSystem: true,
  },
  {
    id: "led-5020",
    code: "5020",
    name: "Generator Fuel & Overhaul",
    category: "EXPENSE",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "DEBIT",
    description: "Diesel and servicing for 30kVA backup generator.",
    isSystem: false,
  },
  {
    id: "led-5030",
    code: "5030",
    name: "Pump Calibration & Maintenance",
    category: "EXPENSE",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "DEBIT",
    description: "Nepal Bureau of Standards dispenser nozzle calibration and repairs.",
    isSystem: false,
  },
  {
    id: "led-5040",
    code: "5040",
    name: "Staff Canteen & Refreshment",
    category: "EXPENSE",
    openingBalanceNpr: 0,
    currentBalanceNpr: 0,
    balanceType: "DEBIT",
    description: "Daily staff tea, snacks, and drinking water jars.",
    isSystem: false,
  },
];

export const MOCK_VOUCHERS: VoucherEntry[] = [
  {
    id: "vouch-01",
    voucherNo: "RV-8305-01",
    voucherType: "RECEIPT",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    debitLedgerId: "led-1030",
    debitLedgerName: "Nabil Bank Current A/C (Operating)",
    creditLedgerId: "led-1060",
    creditLedgerName: "Customer Receivables (Credit Ledger)",
    amountNpr: 150000,
    narration: "Received corporate monthly credit settlement from Kathmandu Metropolitan City via RTGS.",
    paymentChannel: "BANK_TRANSFER",
    referenceNo: "RTGS-KMC-99120",
    preparedByName: "Anita Shrestha (Manager)",
  },
  {
    id: "vouch-02",
    voucherNo: "PV-8305-01",
    voucherType: "PAYMENT",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    debitLedgerId: "led-5020",
    debitLedgerName: "Generator Fuel & Overhaul",
    creditLedgerId: "led-1020",
    creditLedgerName: "Cash in Counter Till",
    amountNpr: 18500,
    narration: "Emergency technician payout for 30kVA generator filter replacement & engine lube.",
    paymentChannel: "CASH",
    referenceNo: "NPE-INV-4412",
    preparedByName: "Binod Tamang (Cashier)",
  },
  {
    id: "vouch-03",
    voucherNo: "CV-8305-01",
    voucherType: "CONTRA",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    debitLedgerId: "led-1030",
    debitLedgerName: "Nabil Bank Current A/C (Operating)",
    creditLedgerId: "led-1010",
    creditLedgerName: "Cash in Safe (Station Vault)",
    amountNpr: 350000,
    narration: "Day-end cash collection deposit into Nabil Bank branch by armored van.",
    paymentChannel: "BANK_TRANSFER",
    referenceNo: "NABIL-DEP-40112",
    preparedByName: "Anita Shrestha (Manager)",
  },
  {
    id: "vouch-04",
    voucherNo: "JV-8305-01",
    voucherType: "JOURNAL",
    dateBS: "2083-05-08",
    dateAD: "2026-08-24",
    debitLedgerId: "led-5030",
    debitLedgerName: "Pump Calibration & Maintenance",
    creditLedgerId: "led-2030",
    creditLedgerName: "Staff Salaries & PF Payable",
    amountNpr: 4500,
    narration: "Internal adjustment: Overtime allowance credit for technician night shift work.",
    referenceNo: "INT-ADJ-8812",
    preparedByName: "Prakash Yadav (Owner)",
  },
  {
    id: "vouch-05",
    voucherNo: "PV-8305-02",
    voucherType: "PAYMENT",
    dateBS: "2083-05-07",
    dateAD: "2026-08-23",
    debitLedgerId: "led-2010",
    debitLedgerName: "Nepal Oil Corporation (NOC) Payable",
    creditLedgerId: "led-1030",
    creditLedgerName: "Nabil Bank Current A/C (Operating)",
    amountNpr: 1200000,
    narration: "Advance RTGS clearance to Nepal Oil Corporation for 20kL Diesel Tanker delivery.",
    paymentChannel: "BANK_TRANSFER",
    referenceNo: "NOC-RTGS-839912",
    preparedByName: "Anita Shrestha (Manager)",
  },
];

export const MOCK_CASH_CONFIRMATIONS: CashConfirmationRecord[] = [
  {
    id: "cash-conf-01",
    dateBS: "2083-05-07",
    expectedCashNpr: 348500,
    physicalCashCountedNpr: 348500,
    varianceNpr: 0,
    bankDepositedNpr: 300000,
    depositedBankName: "Nabil Bank Ltd",
    depositSlipRef: "NABIL-SLIP-89110",
    confirmedByName: "Anita Shrestha (Manager)",
    status: "SETTLED",
    notes: "Perfect cash reconciliation; Rs 48,500 retained in safe for morning float.",
  },
  {
    id: "cash-conf-02",
    dateBS: "2083-05-06",
    expectedCashNpr: 412000,
    physicalCashCountedNpr: 411500,
    varianceNpr: -500,
    bankDepositedNpr: 380000,
    depositedBankName: "Nabil Bank Ltd",
    depositSlipRef: "NABIL-SLIP-89045",
    confirmedByName: "Anita Shrestha (Manager)",
    status: "FLAGGED_VARIANCE",
    notes: "Minor cashier till shortage of Rs 500 settled against cashier allowance.",
  },
];

export const MOCK_NOTES: CreditDebitNote[] = [
  {
    id: "note-01",
    noteNo: "DN-8305-01",
    type: "DEBIT_NOTE",
    dateBS: "2083-05-05",
    partyName: "Nepal Lubricants Pvt Ltd",
    partyLedgerId: "led-1050",
    reason: "Damaged 20L Mobil Super drum return (seal broken during transit).",
    amountNpr: 14500,
    invoiceRef: "NL-INV-9901",
    issuedByName: "Anita Shrestha (Manager)",
  },
  {
    id: "note-02",
    noteNo: "CN-8305-01",
    type: "CREDIT_NOTE",
    dateBS: "2083-05-03",
    partyName: "Kathmandu Metropolitan City",
    partyLedgerId: "led-1060",
    reason: "Correction credit for erroneous meter nozzle reading on Bill #00918.",
    amountNpr: 2800,
    invoiceRef: "BILL-00918",
    issuedByName: "Prakash Yadav (Owner)",
  },
];

// In-Memory state store
let ledgersStore: LedgerHead[] = [...MOCK_LEDGERS];
let vouchersStore: VoucherEntry[] = [...MOCK_VOUCHERS];
let cashConfirmationsStore: CashConfirmationRecord[] = [...MOCK_CASH_CONFIRMATIONS];
let notesStore: CreditDebitNote[] = [...MOCK_NOTES];

export function getLedgerHeads(): LedgerHead[] {
  return [...ledgersStore];
}

export function getVoucherEntries(type?: VoucherType): VoucherEntry[] {
  if (type) {
    return vouchersStore.filter((v) => v.voucherType === type);
  }
  return [...vouchersStore];
}

export function getCashConfirmations(): CashConfirmationRecord[] {
  return [...cashConfirmationsStore];
}

export function getCreditDebitNotes(): CreditDebitNote[] {
  return [...notesStore];
}

export function createVoucher(
  data: Omit<VoucherEntry, "id" | "voucherNo">
): VoucherEntry {
  const count = vouchersStore.filter((v) => v.voucherType === data.voucherType).length + 1;
  const prefixMap: Record<VoucherType, string> = {
    RECEIPT: "RV",
    PAYMENT: "PV",
    JOURNAL: "JV",
    CONTRA: "CV",
    DEBIT_NOTE: "DN",
    CREDIT_NOTE: "CN",
  };
  const prefix = prefixMap[data.voucherType] || "VOUCH";
  const voucherNo = `${prefix}-8305-${count < 10 ? "0" + count : count}`;
  const newId = `vouch-${Date.now()}`;

  const newVoucher: VoucherEntry = {
    ...data,
    id: newId,
    voucherNo,
  };

  vouchersStore.unshift(newVoucher);

  // Update ledger balances accordingly
  const debitIdx = ledgersStore.findIndex((l) => l.id === data.debitLedgerId);
  const creditIdx = ledgersStore.findIndex((l) => l.id === data.creditLedgerId);

  if (debitIdx >= 0) {
    const l = ledgersStore[debitIdx];
    const newBal = l.balanceType === "DEBIT" ? l.currentBalanceNpr + data.amountNpr : l.currentBalanceNpr - data.amountNpr;
    ledgersStore[debitIdx] = { ...l, currentBalanceNpr: newBal };
  }

  if (creditIdx >= 0) {
    const l = ledgersStore[creditIdx];
    const newBal = l.balanceType === "CREDIT" ? l.currentBalanceNpr + data.amountNpr : l.currentBalanceNpr - data.amountNpr;
    ledgersStore[creditIdx] = { ...l, currentBalanceNpr: newBal };
  }

  return newVoucher;
}

export function createLedgerHead(
  data: Omit<LedgerHead, "id" | "currentBalanceNpr" | "isSystem">
): LedgerHead {
  const newId = `led-${Date.now()}`;
  const newLedger: LedgerHead = {
    ...data,
    id: newId,
    currentBalanceNpr: data.openingBalanceNpr,
    isSystem: false,
  };

  ledgersStore.push(newLedger);
  return newLedger;
}

export function confirmDayCash(
  data: Omit<CashConfirmationRecord, "id">
): CashConfirmationRecord {
  const newId = `cash-conf-${Date.now()}`;
  const newRecord: CashConfirmationRecord = { ...data, id: newId };
  cashConfirmationsStore.unshift(newRecord);
  return newRecord;
}

export function updateOpeningBalance(
  ledgerId: string,
  newOpeningNpr: number
): { success: boolean; message: string; ledger?: LedgerHead } {
  const idx = ledgersStore.findIndex((l) => l.id === ledgerId);
  if (idx === -1) return { success: false, message: "Ledger not found." };

  const current = ledgersStore[idx];
  const diff = newOpeningNpr - current.openingBalanceNpr;
  const updated: LedgerHead = {
    ...current,
    openingBalanceNpr: newOpeningNpr,
    currentBalanceNpr: current.currentBalanceNpr + diff,
  };

  ledgersStore[idx] = updated;
  return {
    success: true,
    message: `Updated opening balance for ${updated.name} to Rs. ${newOpeningNpr.toLocaleString()}.`,
    ledger: updated,
  };
}

export function createCreditDebitNote(
  data: Omit<CreditDebitNote, "id" | "noteNo">
): CreditDebitNote {
  const prefix = data.type === "DEBIT_NOTE" ? "DN" : "CN";
  const count = notesStore.filter((n) => n.type === data.type).length + 1;
  const noteNo = `${prefix}-8305-${count < 10 ? "0" + count : count}`;
  const newId = `note-${Date.now()}`;

  const newNote: CreditDebitNote = {
    ...data,
    id: newId,
    noteNo,
  };

  notesStore.unshift(newNote);
  return newNote;
}

export function resetMockAccounts(): void {
  ledgersStore = [...MOCK_LEDGERS];
  vouchersStore = [...MOCK_VOUCHERS];
  cashConfirmationsStore = [...MOCK_CASH_CONFIRMATIONS];
  notesStore = [...MOCK_NOTES];
}
