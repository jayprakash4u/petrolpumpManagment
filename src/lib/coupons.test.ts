import { describe, it, expect } from "vitest";
import { generateSubCoupons } from "./coupons";
import { MOCK_COUPON_BOOKS, MOCK_SUB_COUPONS } from "./mock/coupons";

describe("Coupon Management Module", () => {
  it("generates sequential sub-coupons for a coupon book", () => {
    const leaves = generateSubCoupons(
      "bk-9999",
      "BK-9999",
      "cust-test",
      "Test Fleet",
      "PETROL",
      "VOLUME",
      10,
      25,
      "2083-05-01",
      "2083-11-01"
    );

    expect(leaves.length).toBe(25);
    expect(leaves[0].couponCode).toBe("BK-9999-01");
    expect(leaves[24].couponCode).toBe("BK-9999-25");
    expect(leaves[0].status).toBe("ACTIVE");
  });

  it("accurately calculates active vs redeemed leaves across books", () => {
    const totalActive = MOCK_COUPON_BOOKS.reduce((sum, b) => sum + b.activeLeaves, 0);
    const totalRedeemed = MOCK_COUPON_BOOKS.reduce((sum, b) => sum + b.redeemedLeaves, 0);

    expect(totalActive).toBe(53);
    expect(totalRedeemed).toBe(71);
  });

  it("maintains unique coupon codes across all mock sub-coupons", () => {
    const codes = MOCK_SUB_COUPONS.map((s) => s.couponCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});
