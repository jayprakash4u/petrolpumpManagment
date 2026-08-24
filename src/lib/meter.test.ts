import { describe, it, expect } from "vitest";
import { dipToVolumeLitres, getVarianceStatus } from "./meter";

describe("dipToVolumeLitres", () => {
  it("returns 0 for 0 or negative dip height", () => {
    expect(dipToVolumeLitres(0, 20000)).toBe(0);
    expect(dipToVolumeLitres(-10, 20000)).toBe(0);
  });

  it("returns max capacity when dip equals or exceeds max diameter", () => {
    expect(dipToVolumeLitres(240, 20000)).toBe(20000);
    expect(dipToVolumeLitres(250, 20000)).toBe(20000);
    expect(dipToVolumeLitres(270, 30000)).toBe(30000);
  });

  it("calculates accurate cylindrical volume at half dip height (50% level)", () => {
    // At half height of a symmetric cylinder, volume should be exactly 50%
    const halfVol20k = dipToVolumeLitres(120, 20000);
    expect(halfVol20k).toBe(10000);

    const halfVol30k = dipToVolumeLitres(135, 30000);
    expect(halfVol30k).toBe(15000);
  });

  it("calculates realistic progressive volumes across intermediate heights", () => {
    const volLow = dipToVolumeLitres(50, 20000);
    const volMid = dipToVolumeLitres(120, 20000);
    const volHigh = dipToVolumeLitres(190, 20000);

    expect(volLow).toBeGreaterThan(0);
    expect(volMid).toBeGreaterThan(volLow);
    expect(volHigh).toBeGreaterThan(volMid);
    expect(volHigh).toBeLessThan(20000);
  });
});

describe("getVarianceStatus", () => {
  it("returns normal when variance is within 0.15%", () => {
    expect(getVarianceStatus(10, 10000)).toBe("normal");
    expect(getVarianceStatus(-14, 10000)).toBe("normal");
  });

  it("returns tolerable when variance is between 0.15% and 0.35%", () => {
    expect(getVarianceStatus(-25, 10000)).toBe("tolerable");
    expect(getVarianceStatus(30, 10000)).toBe("tolerable");
  });

  it("returns investigate when variance exceeds 0.35%", () => {
    expect(getVarianceStatus(-50, 10000)).toBe("investigate");
    expect(getVarianceStatus(60, 10000)).toBe("investigate");
  });
});
