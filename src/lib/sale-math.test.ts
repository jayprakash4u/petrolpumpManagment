import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { deriveSale, checkLiters, creditHeadroom, changeDue, MAX_LITERS_PER_SALE } from "@/lib/sale-math";

const D = (v: string | number) => new Prisma.Decimal(v);

describe("deriveSale — LITERS mode", () => {
  it("bills volume x rate", () => {
    const { liters, totalAmount } = deriveSale("LITERS", "40", "106.48");
    expect(liters.toString()).toBe("40");
    expect(totalAmount.toString()).toBe("4259.2");
  });

  it("rounds the bill to 2dp", () => {
    const { totalAmount } = deriveSale("LITERS", "13.33", "92.34");
    // 13.33 x 92.34 = 1230.8922 -> 1230.89
    expect(totalAmount.toString()).toBe("1230.89");
  });

  it("does not drift the way repeated float math would", () => {
    // 0.1 + 0.2 style drift: 3 x 33.33 L at 78.10 must land exactly.
    const { totalAmount } = deriveSale("LITERS", "99.99", "78.10");
    expect(totalAmount.toString()).toBe("7809.22");
    expect(totalAmount.equals(D("7809.219").toDecimalPlaces(2))).toBe(true);
  });
});

describe("deriveSale — AMOUNT mode", () => {
  it("never dispenses more fuel than the money covers", () => {
    const { liters, totalAmount } = deriveSale("AMOUNT", "500", "106.48");
    // 500 / 106.48 = 4.6957... -> rounded DOWN to 4.69
    expect(liters.toString()).toBe("4.69");
    expect(totalAmount.lte(D("500"))).toBe(true);
  });

  it("keeps total === liters x rate, not the amount typed in", () => {
    const rate = D("92.34");
    const { liters, totalAmount } = deriveSale("AMOUNT", "1000", rate);
    expect(totalAmount.equals(liters.mul(rate).toDecimalPlaces(2))).toBe(true);
  });

  it("handles an amount that divides exactly", () => {
    const { liters, totalAmount } = deriveSale("AMOUNT", "200", "100");
    expect(liters.toString()).toBe("2");
    expect(totalAmount.toString()).toBe("200");
  });

  it("rejects a zero or negative rate rather than dividing by it", () => {
    expect(() => deriveSale("AMOUNT", "500", "0")).toThrow();
    expect(() => deriveSale("LITERS", "10", "-1")).toThrow();
  });
});

describe("checkLiters", () => {
  it("accepts an ordinary fill", () => {
    expect(checkLiters(D("40"))).toBeNull();
  });

  it("rejects zero and sub-minimum volumes", () => {
    expect(checkLiters(D("0"))).toBe("TOO_SMALL");
    expect(checkLiters(D("0.001"))).toBe("TOO_SMALL");
  });

  it("rejects a negative volume, which would otherwise *add* stock and money", () => {
    expect(checkLiters(D("-40"))).toBe("TOO_SMALL");
  });

  it("rejects an implausible volume", () => {
    expect(checkLiters(MAX_LITERS_PER_SALE.add(1))).toBe("TOO_LARGE");
    expect(checkLiters(MAX_LITERS_PER_SALE)).toBeNull();
  });
});

describe("creditHeadroom", () => {
  it("is limit minus what is already owed", () => {
    expect(creditHeadroom("50000", "24500").toString()).toBe("25500");
  });

  it("clamps to zero when a customer is already over their limit", () => {
    expect(creditHeadroom("10000", "12000").toString()).toBe("0");
  });

  it("is zero for a customer with no credit line", () => {
    expect(creditHeadroom("0", "0").toString()).toBe("0");
  });
});

describe("changeDue", () => {
  it("returns change owed to the customer", () => {
    expect(changeDue("500", "426.50").toString()).toBe("73.5");
  });

  it("goes negative when the customer underpays", () => {
    expect(changeDue("400", "426.50").isNegative()).toBe(true);
  });
});
