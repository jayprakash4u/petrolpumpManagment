import { describe, it, expect } from "vitest";
import { amountInWords } from "./number-to-words";

describe("amountInWords", () => {
  it("spells out a plain two-digit amount", () => {
    expect(amountInWords(44)).toBe("Forty Four Rupees Only");
  });

  it("handles zero", () => {
    expect(amountInWords(0)).toBe("Zero Rupees Only");
  });

  it("handles hundreds", () => {
    expect(amountInWords(106)).toBe("One Hundred Six Rupees Only");
  });

  it("uses the Indian numbering system (thousand, lakh, crore)", () => {
    expect(amountInWords(1000)).toBe("One Thousand Rupees Only");
    expect(amountInWords(100000)).toBe("One Lakh Rupees Only");
    expect(amountInWords(10000000)).toBe("One Crore Rupees Only");
  });

  it("combines groups correctly", () => {
    expect(amountInWords(123456)).toBe("One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees Only");
  });

  it("rounds a fractional (paisa) amount to the whole rupee", () => {
    expect(amountInWords(6000.49)).toBe("Six Thousand Rupees Only");
  });

  it("ignores sign — always spells a positive amount", () => {
    expect(amountInWords(-44)).toBe("Forty Four Rupees Only");
  });
});
