import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  toVolumeDecimal,
  toCurrencyDecimal,
  fmtVolume,
  fmtCurrency,
  deriveVolumeFromRupees,
  deriveRupeesFromVolume,
} from "./precision";

describe("Enterprise Fixed-Point Precision Rules", () => {
  it("formats fuel volumes strictly to 3 decimal places (mL precision)", () => {
    expect(fmtVolume("12.5")).toBe("12.500");
    expect(fmtVolume("8412.3941")).toBe("8412.394");
  });

  it("formats currency strictly to 2 decimal places (NPR cents)", () => {
    expect(fmtCurrency("1500")).toBe("1500.00");
    expect(fmtCurrency("172.589")).toBe("172.59");
  });

  it("derives volume from rupees with rounding down to prevent fuel losses", () => {
    // Petrol @ Rs 172.00 / L, customer pays Rs 500
    // 500 / 172 = 2.9069767... -> should floor to 2.906 Liters
    const result = deriveVolumeFromRupees("500", "172.00");
    expect(fmtVolume(result.liters)).toBe("2.906");
    expect(fmtCurrency(result.exactAmount)).toBe("499.83");
  });

  it("derives total rupees from volume with exact rate multiplication", () => {
    // 25.500 Liters of Diesel @ Rs 158.00 / L -> 4029.00
    const result = deriveRupeesFromVolume("25.5", "158.00");
    expect(fmtVolume(result.liters)).toBe("25.500");
    expect(fmtCurrency(result.totalAmount)).toBe("4029.00");
  });
});
