import { describe, it, expect } from "vitest";
import {
  calculateIrdSyncStats,
  evaluateDecantingLoss,
  type IrdCbmsEntry,
} from "./compliance";

describe("compliance calculation and verification helpers", () => {
  it("calculates IRD CBMS sync statistics correctly", () => {
    const entries: IrdCbmsEntry[] = [
      {
        id: "1",
        invoiceNo: "INV-01",
        dateBS: "2083-05-01",
        dateAD: "2026-08-17",
        customerName: "A",
        customerPan: "123",
        taxableAmountNpr: 100000,
        vatAmountNpr: 13000,
        totalAmountNpr: 113000,
        syncStatus: "SYNCED",
        retryCount: 0,
      },
      {
        id: "2",
        invoiceNo: "INV-02",
        dateBS: "2083-05-02",
        dateAD: "2026-08-18",
        customerName: "B",
        customerPan: "456",
        taxableAmountNpr: 200000,
        vatAmountNpr: 26000,
        totalAmountNpr: 226000,
        syncStatus: "PENDING",
        retryCount: 0,
      },
      {
        id: "3",
        invoiceNo: "INV-03",
        dateBS: "2083-05-03",
        dateAD: "2026-08-19",
        customerName: "C",
        customerPan: "789",
        taxableAmountNpr: 300000,
        vatAmountNpr: 39000,
        totalAmountNpr: 339000,
        syncStatus: "FAILED",
        retryCount: 2,
      },
    ];

    const stats = calculateIrdSyncStats(entries);
    expect(stats.total).toBe(3);
    expect(stats.synced).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.syncRatePct).toBe(33);
  });

  it("evaluates tanker decanting loss against 0.20% tolerance", () => {
    // 20,000 Liters ordered. 0.20% tolerance = 40 Liters.
    // Case 1: Decanted 19,970 L (Loss = 30 L <= 40 L). Not claimable.
    const withinTolerance = evaluateDecantingLoss(20000, 19970);
    expect(withinTolerance.lossLiters).toBe(30);
    expect(withinTolerance.isClaimableLoss).toBe(false);
    expect(withinTolerance.claimableLiters).toBe(0);

    // Case 2: Decanted 19,900 L (Loss = 100 L > 40 L). Claimable = 60 L.
    const abnormalLoss = evaluateDecantingLoss(20000, 19900);
    expect(abnormalLoss.lossLiters).toBe(100);
    expect(abnormalLoss.isClaimableLoss).toBe(true);
    expect(abnormalLoss.claimableLiters).toBe(60);
  });
});
