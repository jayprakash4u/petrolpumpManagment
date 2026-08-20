import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  ullage,
  fillPercent,
  isLowStock,
  checkDelivery,
  checkRate,
  rateChangePercent,
  isLargeRateChange,
  costPerLiter,
  marginPerLiter,
  MAX_DELIVERY_LITERS,
  MAX_RATE,
} from "@/lib/stock-math";

const D = (v: string | number) => new Prisma.Decimal(v);

describe("ullage — room left in the tank", () => {
  it("is capacity minus level", () => {
    expect(ullage("12000", "8214").toString()).toBe("3786");
  });

  it("is zero for a full tank", () => {
    expect(ullage("12000", "12000").toString()).toBe("0");
  });

  it("clamps to zero rather than reporting negative room", () => {
    expect(ullage("12000", "12500").toString()).toBe("0");
  });
});

describe("fillPercent", () => {
  it("reports how full the tank is", () => {
    expect(fillPercent("12000", "6000").toString()).toBe("50");
  });

  it("survives a zero-capacity tank without dividing by zero", () => {
    expect(fillPercent("0", "0").toString()).toBe("0");
  });

  it("flags low stock strictly below the threshold, not at it", () => {
    // 20% of 12000 is 2400.
    expect(isLowStock("12000", "2399", "20")).toBe(true);
    expect(isLowStock("12000", "2400", "20")).toBe(false);
    expect(isLowStock("12000", "2401", "20")).toBe(false);
  });
});

describe("checkDelivery", () => {
  const capacity = "12000";
  const level = "8000"; // 4000 L of room

  it("accepts a delivery that fits", () => {
    expect(checkDelivery(D("4000"), capacity, level)).toBeNull();
  });

  it("accepts a delivery that fills the tank exactly", () => {
    expect(checkDelivery(D("4000"), capacity, level)).toBeNull();
  });

  it("refuses a delivery that would overfill the tank", () => {
    expect(checkDelivery(D("4001"), capacity, level)).toBe("EXCEEDS_CAPACITY");
  });

  it("refuses zero and negative deliveries", () => {
    expect(checkDelivery(D("0"), capacity, level)).toBe("TOO_SMALL");
    expect(checkDelivery(D("-500"), capacity, level)).toBe("TOO_SMALL");
  });

  it("refuses an implausible tanker", () => {
    expect(checkDelivery(MAX_DELIVERY_LITERS.add(1), "99999999", "0")).toBe("TOO_LARGE");
  });

  it("refuses any delivery into a tank that is already full", () => {
    expect(checkDelivery(D("1"), capacity, capacity)).toBe("EXCEEDS_CAPACITY");
  });
});

describe("checkRate", () => {
  it("accepts an ordinary repricing", () => {
    expect(checkRate(D("108.20"), "106.48")).toBeNull();
  });

  it("rejects a rate of zero or below", () => {
    expect(checkRate(D("0"), "106.48")).toBe("TOO_LOW");
    expect(checkRate(D("-5"), "106.48")).toBe("TOO_LOW");
  });

  it("rejects a slipped decimal point", () => {
    expect(checkRate(MAX_RATE.add(1), "106.48")).toBe("TOO_HIGH");
  });

  it("rejects a no-op change rather than writing an empty history row", () => {
    expect(checkRate(D("106.48"), "106.48")).toBe("UNCHANGED");
    expect(checkRate(D("106.480"), "106.48")).toBe("UNCHANGED");
  });
});

describe("rateChangePercent", () => {
  it("reports a rise as positive", () => {
    expect(rateChangePercent("100", "110").toString()).toBe("10");
  });

  it("reports a cut as negative", () => {
    expect(rateChangePercent("100", "90").toString()).toBe("-10");
  });

  it("flags a move big enough to be worth confirming", () => {
    expect(isLargeRateChange("100", "125")).toBe(true);
    expect(isLargeRateChange("100", "75")).toBe(true);
    expect(isLargeRateChange("100", "119")).toBe(false);
    expect(isLargeRateChange("106.48", "108.20")).toBe(false);
  });

  it("does not divide by a zero starting rate", () => {
    expect(rateChangePercent("0", "100").toString()).toBe("0");
  });
});

describe("costPerLiter / marginPerLiter", () => {
  it("derives the per-litre purchase cost", () => {
    expect(costPerLiter("475000", "5000")?.toString()).toBe("95");
  });

  it("returns null rather than dividing by zero litres", () => {
    expect(costPerLiter("475000", "0")).toBeNull();
    expect(marginPerLiter("106.48", "475000", "0")).toBeNull();
  });

  it("computes margin against the pump rate", () => {
    expect(marginPerLiter("106.48", "475000", "5000")?.toString()).toBe("11.48");
  });

  it("reports a negative margin when fuel is sold below cost", () => {
    const margin = marginPerLiter("90", "475000", "5000");
    expect(margin?.isNegative()).toBe(true);
    expect(margin?.toString()).toBe("-5");
  });
});
