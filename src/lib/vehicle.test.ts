import { describe, it, expect } from "vitest";
import {
  normalizeVehicleNo,
  checkVehicleNo,
  formatVehicleNo,
  parseVehicleInput,
  MIN_VEHICLE_LENGTH,
  MAX_VEHICLE_LENGTH,
} from "@/lib/vehicle";

describe("normalizeVehicleNo", () => {
  it("uppercases and strips separators", () => {
    expect(normalizeVehicleNo("ba 2 kha 1234")).toBe("BA2KHA1234");
  });

  it("collapses every common spelling of one plate to a single key", () => {
    const spellings = ["BA 2 KHA 1234", "ba-2-kha-1234", "Ba2Kha1234", "  BA2 KHA1234  ", "ba.2.kha.1234"];
    const keys = new Set(spellings.map(normalizeVehicleNo));
    // This is the whole point: one lorry, one row in vehicle-wise billing.
    expect(keys.size).toBe(1);
    expect([...keys][0]).toBe("BA2KHA1234");
  });

  it("drops slashes and other punctuation", () => {
    expect(normalizeVehicleNo("BA/2/KHA/1234")).toBe("BA2KHA1234");
    expect(normalizeVehicleNo("BA#2*KHA!1234")).toBe("BA2KHA1234");
  });

  it("is idempotent", () => {
    const once = normalizeVehicleNo(" ba 2 kha 1234 ");
    expect(normalizeVehicleNo(once)).toBe(once);
  });

  it("returns empty when nothing usable remains", () => {
    expect(normalizeVehicleNo("   ")).toBe("");
    expect(normalizeVehicleNo("--/--")).toBe("");
  });
});

describe("checkVehicleNo", () => {
  it("accepts an ordinary Nepali plate", () => {
    expect(checkVehicleNo("BA2KHA1234")).toBeNull();
  });

  it("accepts a short but real plate", () => {
    expect(checkVehicleNo("A".repeat(MIN_VEHICLE_LENGTH - 1) + "1")).toBeNull();
  });

  it("rejects empty and over-short", () => {
    expect(checkVehicleNo("")).toBe("EMPTY");
    expect(checkVehicleNo("A1")).toBe("TOO_SHORT");
  });

  it("rejects over-long", () => {
    expect(checkVehicleNo("A1" + "B".repeat(MAX_VEHICLE_LENGTH))).toBe("TOO_LONG");
  });

  it("rejects input with no digit — the common mis-entry is a customer name", () => {
    expect(checkVehicleNo("RAMESHTHAPA")).toBe("NO_DIGIT");
    expect(checkVehicleNo("BAKHA")).toBe("NO_DIGIT");
  });
});

describe("formatVehicleNo", () => {
  it("regroups a canonical plate for reading", () => {
    expect(formatVehicleNo("BA2KHA1234")).toBe("BA 2 KHA 1234");
  });

  it("handles a plate that is all one run", () => {
    expect(formatVehicleNo("1234")).toBe("1234");
    expect(formatVehicleNo("ABCD")).toBe("ABCD");
  });

  it("returns empty for empty", () => {
    expect(formatVehicleNo("")).toBe("");
  });

  it("round-trips back to the same canonical key", () => {
    // Display form must never become a second identity for the vehicle.
    const canonical = "BA2KHA1234";
    expect(normalizeVehicleNo(formatVehicleNo(canonical))).toBe(canonical);
  });
});

describe("parseVehicleInput", () => {
  it("returns the canonical form", () => {
    expect(parseVehicleInput("ba 2 kha 1234")).toBe("BA2KHA1234");
  });

  it("treats blank as absent, because a vehicle number is optional", () => {
    expect(parseVehicleInput("")).toBeNull();
    expect(parseVehicleInput("   ")).toBeNull();
    expect(parseVehicleInput(null)).toBeNull();
  });
});
