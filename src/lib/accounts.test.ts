import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateTrialBalance,
  calculateProfitAndLoss,
  formatDayBookItems,
} from "./accounts";
import {
  getLedgerHeads,
  getVoucherEntries,
  getCashConfirmations,
  getCreditDebitNotes,
  createVoucher,
  createLedgerHead,
  confirmDayCash,
  updateOpeningBalance,
  createCreditDebitNote,
  resetMockAccounts,
} from "./mock/accounts";

describe("Finance & Account Unit Tests", () => {
  beforeEach(() => {
    resetMockAccounts();
  });

  describe("calculateTrialBalance", () => {
    it("ensures total debits equals total credits (Parity Check)", () => {
      const ledgers = getLedgerHeads();
      const tb = calculateTrialBalance(ledgers);

      expect(tb.items.length).toBe(ledgers.length);
      expect(tb.totalDebitNpr).toBeGreaterThan(0);
      expect(tb.totalCreditNpr).toBeGreaterThan(0);
      expect(tb.isBalanced).toBe(true);
    });
  });

  describe("calculateProfitAndLoss", () => {
    it("computes gross profit, operating expenses and net margin correctly", () => {
      const pnl = calculateProfitAndLoss({
        petrolSalesNpr: 5000000,
        dieselSalesNpr: 6000000,
        fuelPurchasesNpr: 9500000,
        staffSalariesNpr: 180000,
        electricityUtilitiesNpr: 20000,
      });

      expect(pnl.totalRevenueNpr).toBeGreaterThan(11000000);
      expect(pnl.grossProfitNpr).toBe(pnl.totalRevenueNpr - pnl.totalCogsNpr);
      expect(pnl.netProfitNpr).toBe(pnl.grossProfitNpr - pnl.totalOperatingExpensesNpr);
      expect(pnl.profitMarginPct).toBeGreaterThan(0);
    });
  });

  describe("formatDayBookItems", () => {
    it("formats vouchers into day book items for a given BS date", () => {
      const vouchers = getVoucherEntries();
      const dayBook = formatDayBookItems(vouchers, "2083-05-08");

      expect(dayBook.length).toBeGreaterThan(0);
      expect(dayBook.every((d) => d.debitAmountNpr > 0)).toBe(true);
    });
  });

  describe("Mock Account Mutations & Double-Entry", () => {
    it("creates a payment voucher and updates debit/credit ledger balances", () => {
      const ledgersBefore = getLedgerHeads();
      const expenseBefore = ledgersBefore.find((l) => l.id === "led-5040")?.currentBalanceNpr || 0;
      const tillBefore = ledgersBefore.find((l) => l.id === "led-1020")?.currentBalanceNpr || 0;

      const voucher = createVoucher({
        voucherType: "PAYMENT",
        dateBS: "2083-05-08",
        dateAD: "2026-08-24",
        debitLedgerId: "led-5040",
        debitLedgerName: "Staff Canteen & Refreshment",
        creditLedgerId: "led-1020",
        creditLedgerName: "Cash in Counter Till",
        amountNpr: 1500,
        narration: "Afternoon staff tea and snack purchase.",
        preparedByName: "Binod Tamang (Cashier)",
      });

      expect(voucher.id).toBeDefined();
      expect(voucher.voucherNo).toContain("PV-8305-");

      const ledgersAfter = getLedgerHeads();
      const expenseAfter = ledgersAfter.find((l) => l.id === "led-5040")?.currentBalanceNpr || 0;
      const tillAfter = ledgersAfter.find((l) => l.id === "led-1020")?.currentBalanceNpr || 0;

      expect(expenseAfter).toBe(expenseBefore + 1500);
      expect(tillAfter).toBe(tillBefore - 1500);
    });

    it("creates a new custom ledger head", () => {
      const ledger = createLedgerHead({
        code: "5090",
        name: "Security Guard Agency Fees",
        category: "EXPENSE",
        openingBalanceNpr: 0,
        balanceType: "DEBIT",
        description: "Monthly payment to private security firm.",
      });

      expect(ledger.id).toBeDefined();
      expect(ledger.isSystem).toBe(false);

      const all = getLedgerHeads();
      expect(all.some((l) => l.id === ledger.id)).toBe(true);
    });

    it("records a day-end cash confirmation", () => {
      const conf = confirmDayCash({
        dateBS: "2083-05-08",
        expectedCashNpr: 520000,
        physicalCashCountedNpr: 520000,
        varianceNpr: 0,
        bankDepositedNpr: 450000,
        depositedBankName: "Nabil Bank Ltd",
        depositSlipRef: "NABIL-SLIP-99012",
        confirmedByName: "Anita Shrestha (Manager)",
        status: "SETTLED",
      });

      expect(conf.id).toBeDefined();
      expect(conf.status).toBe("SETTLED");

      const all = getCashConfirmations();
      expect(all.some((c) => c.id === conf.id)).toBe(true);
    });

    it("creates a credit/debit note", () => {
      const note = createCreditDebitNote({
        type: "DEBIT_NOTE",
        dateBS: "2083-05-08",
        partyName: "NOC Depot",
        partyLedgerId: "led-2010",
        reason: "Tanker shortage claim deduction.",
        amountNpr: 8500,
        invoiceRef: "NOC-INV-8911",
        issuedByName: "Prakash Yadav (Owner)",
      });

      expect(note.id).toBeDefined();
      expect(note.noteNo).toContain("DN-8305-");

      const all = getCreditDebitNotes();
      expect(all.some((n) => n.id === note.id)).toBe(true);
    });

    it("updates opening balance and adjusts current balance", () => {
      const res = updateOpeningBalance("led-1010", 500000);
      expect(res.success).toBe(true);
      expect(res.ledger?.openingBalanceNpr).toBe(500000);
    });
  });
});
