import { describe, it, expect } from "vitest";
import { calculateVatReturn, calculateClosingStock } from "./ird";
import {
  getIrdSales,
  getIrdSalesReturns,
  getIrdPurchases,
  getIrdPurchaseReturns,
  getIrdMonthlySales,
  getIrdQuantitativeStock,
} from "./mock/ird";

describe("IRD Statutory Reports Unit Tests", () => {
  describe("calculateVatReturn (Schedule 10)", () => {
    it("calculates Output VAT, Input VAT, and Net Payable/Refundable correctly", () => {
      const sales = getIrdSales();
      const purchases = getIrdPurchases();
      const salesReturns = getIrdSalesReturns();
      const purchaseReturns = getIrdPurchaseReturns();

      const vatReturn = calculateVatReturn({
        sales,
        purchases,
        salesReturns,
        purchaseReturns,
        fiscalYear: "2083/84",
        periodBS: "Bhadra 2083",
      });

      expect(vatReturn.totalSalesNpr).toBeGreaterThan(0);
      expect(vatReturn.taxableSalesNpr).toBeGreaterThan(0);
      expect(vatReturn.outputVatCollectedNpr).toBe(
        Math.round(vatReturn.netTaxableSalesNpr * 0.13)
      );

      expect(vatReturn.totalPurchasesNpr).toBeGreaterThan(0);
      expect(vatReturn.inputVatPaidNpr).toBe(
        Math.round(vatReturn.netTaxablePurchasesNpr * 0.13)
      );

      expect(typeof vatReturn.netVatPayableNpr).toBe("number");
      expect(typeof vatReturn.isCreditCarryForward).toBe("boolean");
    });
  });

  describe("calculateClosingStock", () => {
    it("computes physical closing stock with decanting transit loss reconciliation", () => {
      const closing = calculateClosingStock(12500, 40000, 38200, 65);
      expect(closing).toBe(14235);
    });

    it("handles zero loss correctly", () => {
      const closing = calculateClosingStock(100, 200, 150, 0);
      expect(closing).toBe(150);
    });
  });

  describe("Mock Registers Consistency", () => {
    it("verifies Sales Register conforms to Schedule 5 columns", () => {
      const sales = getIrdSales();
      expect(sales.length).toBeGreaterThan(0);
      for (const s of sales) {
        expect(s.invoiceNo).toBeDefined();
        expect(s.dateBS).toBeDefined();
        expect(s.totalAmountNpr).toBe(s.taxableAmountNpr + s.vatAmountNpr + s.nonTaxableAmountNpr);
      }
    });

    it("verifies Purchase Register conforms to Schedule 4 columns", () => {
      const purchases = getIrdPurchases();
      expect(purchases.length).toBeGreaterThan(0);
      for (const p of purchases) {
        expect(p.supplierPan).toBeDefined();
        expect(p.vatAmountNpr).toBe(Math.round(p.taxableAmountNpr * 0.13));
      }
    });

    it("verifies Monthly Sales Register contains 5 BS recorded months", () => {
      const monthly = getIrdMonthlySales();
      expect(monthly.length).toBe(5);
      expect(monthly[0].monthBS).toContain("Baisakh");
    });

    it("verifies Quantitative Stock matches item balances", () => {
      const stock = getIrdQuantitativeStock();
      expect(stock.length).toBeGreaterThan(0);
      for (const item of stock) {
        const expected = calculateClosingStock(
          item.openingStock,
          item.purchaseInward,
          item.salesOutward,
          item.transitLoss
        );
        expect(item.closingStock).toBe(expected);
      }
    });
  });
});
