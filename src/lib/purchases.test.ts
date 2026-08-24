import { describe, it, expect } from "vitest";
import { MOCK_INVENTORY_ITEMS, MOCK_PURCHASE_RETURNS, MOCK_STATION_EXPENSES } from "./mock/purchases";

describe("Purchase Module Data & Calculations", () => {
  it("calculates inventory stock value accurately", () => {
    const totalCostValue = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand * i.costPriceNpr, 0);
    const totalRetailValue = MOCK_INVENTORY_ITEMS.reduce((sum, i) => sum + i.stockInHand * i.sellingPriceNpr, 0);

    expect(totalCostValue).toBeGreaterThan(0);
    expect(totalRetailValue).toBeGreaterThan(totalCostValue);
  });

  it("identifies low stock items below reorder threshold", () => {
    const lowStock = MOCK_INVENTORY_ITEMS.filter((i) => i.stockInHand <= i.reorderLevel);
    expect(lowStock.length).toBeGreaterThan(0);
    expect(lowStock[0].name).toContain("Servo Kool");
  });

  it("sums purchase return debit notes correctly", () => {
    const totalReturns = MOCK_PURCHASE_RETURNS.reduce((sum, r) => sum + r.totalReturnAmountNpr, 0);
    expect(totalReturns).toBe(12720);
  });

  it("aggregates monthly operating expenses properly", () => {
    const totalExpenses = MOCK_STATION_EXPENSES.reduce((sum, e) => sum + e.amountNpr, 0);
    expect(totalExpenses).toBe(60250);
  });
});
