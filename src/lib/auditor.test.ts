import { describe, it, expect } from "vitest";
import {
  assessDebtorRisk,
  calculateReconciledBankBalance,
  calculateCOGS,
  filterLargeTransactions,
  type LargeTransactionEntry,
} from "./auditor";
import { getVatSplitSummary, MOCK_FISCAL_STOCK } from "./mock/auditor";

describe("auditor calculation helpers", () => {
  it("correctly assesses debtor risk based on age buckets and credit limits", () => {
    // Normal 0-30 day with credit under limit
    expect(
      assessDebtorRisk({
        totalDueNpr: 100000,
        creditLimitNpr: 200000,
        bucket61to90Npr: 0,
        bucket90PlusNpr: 0,
      })
    ).toBe("LOW");

    // Moderate: due amount > 80% of limit
    expect(
      assessDebtorRisk({
        totalDueNpr: 180000,
        creditLimitNpr: 200000,
        bucket61to90Npr: 0,
        bucket90PlusNpr: 0,
      })
    ).toBe("MODERATE");

    // High: bucket 61-90 > 0 or exceeding credit limit
    expect(
      assessDebtorRisk({
        totalDueNpr: 210000,
        creditLimitNpr: 200000,
        bucket61to90Npr: 40000,
        bucket90PlusNpr: 0,
      })
    ).toBe("HIGH");

    // Critical: bucket 90+ > 0 or exceeding 125% credit limit
    expect(
      assessDebtorRisk({
        totalDueNpr: 280000,
        creditLimitNpr: 200000,
        bucket61to90Npr: 40000,
        bucket90PlusNpr: 50000,
      })
    ).toBe("CRITICAL");
  });

  it("calculates reconciled bank balance accurately", () => {
    // Cash book 100, unpresented cheques 30, direct credits 10, uncredited deposits 20, bank charges 2
    // Expected: 100 + 30 + 10 - 20 - 2 = 118
    const reconciled = calculateReconciledBankBalance(100, 30, 10, 20, 2);
    expect(reconciled).toBe(118);
  });

  it("calculates stock COGS correctly", () => {
    // Opening 2,000,000 + Purchases 20,000,000 - Closing 3,000,000 = 19,000,000
    const cogs = calculateCOGS(2000000, 20000000, 3000000);
    expect(cogs).toBe(19000000);
  });

  it("filters large transactions above threshold and by type", () => {
    const items: LargeTransactionEntry[] = [
      {
        id: "1",
        dateBS: "2083-05-01",
        dateAD: "2026-08-17",
        referenceNo: "INV-01",
        type: "SALES_INVOICE",
        partyName: "Customer A",
        partyPan: "123",
        amountNpr: 150000,
        paymentMode: "CASH",
        description: "Test 1",
        isPanCompliant: true,
      },
      {
        id: "2",
        dateBS: "2083-05-02",
        dateAD: "2026-08-18",
        referenceNo: "INV-02",
        type: "SALES_INVOICE",
        partyName: "Customer B",
        partyPan: "456",
        amountNpr: 50000,
        paymentMode: "CASH",
        description: "Test 2",
        isPanCompliant: true,
      },
      {
        id: "3",
        dateBS: "2083-05-03",
        dateAD: "2026-08-19",
        referenceNo: "PUR-01",
        type: "FUEL_PURCHASE",
        partyName: "NOC",
        partyPan: "789",
        amountNpr: 500000,
        paymentMode: "RTGS",
        description: "Test 3",
        isPanCompliant: true,
      },
    ];

    const over1Lakh = filterLargeTransactions(items, 100000, "ALL");
    expect(over1Lakh.length).toBe(2);
    expect(over1Lakh.map((i) => i.id)).toEqual(["1", "3"]);

    const salesOnlyOver1Lakh = filterLargeTransactions(items, 100000, "SALES_INVOICE");
    expect(salesOnlyOver1Lakh.length).toBe(1);
    expect(salesOnlyOver1Lakh[0].id).toBe("1");
  });

  it("calculates VAT split summary correctly", () => {
    const summary = getVatSplitSummary();
    expect(summary.salesTotalGrossNpr).toBeGreaterThan(0);
    expect(summary.purchaseTotalGrossNpr).toBeGreaterThan(0);
    expect(summary.salesOutputVatNpr).toBe(
      Math.round(summary.salesTaxableNpr * 0.13)
    );
  });
});
