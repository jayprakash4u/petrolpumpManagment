import { describe, it, expect } from "vitest";
import { parseBillFilters, billQueryString, hasActiveFilter } from "@/lib/bill-filters";


describe("parseBillFilters — defaults and bad input", () => {
  it("defaults to today, all statuses, no narrowing", () => {
    const f = parseBillFilters({});
    expect(f.status).toBe("all");
    expect(f.fuel).toBeNull();
    expect(f.payment).toBeNull();
    expect(f.vehicleNo).toBeNull();
    expect(f.search).toBe("");
    expect(hasActiveFilter(f)).toBe(false);
  });

  it("ignores unknown values rather than erroring on a hand-edited URL", () => {
    const f = parseBillFilters({ status: "banana", fuel: "URANIUM", payment: "BARTER" });
    expect(f.status).toBe("all");
    expect(f.fuel).toBeNull();
    expect(f.payment).toBeNull();
  });

  it("accepts fuel and payment in any casing", () => {
    const f = parseBillFilters({ fuel: "diesel", payment: "credit" });
    expect(f.fuel).toBe("DIESEL");
    expect(f.payment).toBe("CREDIT");
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseBillFilters({ fuel: ["PETROL", "DIESEL"] }).fuel).toBe("PETROL");
  });

  it("normalises a vehicle number so any spelling finds the same rows", () => {
    expect(parseBillFilters({ vehicle: "ba 2 kha 1234" }).vehicleNo).toBe("BA2KHA1234");
    expect(parseBillFilters({ vehicle: "BA-2-KHA-1234" }).vehicleNo).toBe("BA2KHA1234");
  });

  it("treats an unusable vehicle string as no filter", () => {
    expect(parseBillFilters({ vehicle: "///" }).vehicleNo).toBeNull();
    expect(parseBillFilters({ vehicle: "" }).vehicleNo).toBeNull();
  });

  it("caps search length so a huge query string cannot be pushed into the database", () => {
    expect(parseBillFilters({ q: "x".repeat(500) }).search).toHaveLength(60);
  });

  it("lets a page force its own status, ignoring the URL", () => {
    // The Sales Returns page is only ever the voided slice.
    const f = parseBillFilters({ status: "active" }, "voided");
    expect(f.status).toBe("voided");
  });
});

describe("billQueryString", () => {
  it("is empty when nothing is set beyond the default preset", () => {
    const qs = billQueryString(parseBillFilters({ preset: "today" }));
    expect(qs).toBe("?preset=today");
  });

  it("round-trips filters back into the same values", () => {
    const original = parseBillFilters({ preset: "7d", status: "voided", fuel: "DIESEL", vehicle: "ba2kha1234", q: "Acme" });
    const reparsed = parseBillFilters(Object.fromEntries(new URLSearchParams(billQueryString(original).slice(1))));

    expect(reparsed.status).toBe(original.status);
    expect(reparsed.fuel).toBe(original.fuel);
    expect(reparsed.vehicleNo).toBe(original.vehicleNo);
    expect(reparsed.search).toBe(original.search);
    expect(reparsed.range.preset).toBe(original.range.preset);
  });

  it("keeps a custom range as explicit dates", () => {
    const f = parseBillFilters({ from: "2026-08-01", to: "2026-08-19" });
    const qs = billQueryString(f);
    expect(qs).toContain("from=2026-08-01");
    expect(qs).toContain("to=2026-08-19");
  });

  it("changes one filter while preserving the rest", () => {
    const f = parseBillFilters({ preset: "7d", fuel: "PETROL", q: "Acme" });
    const qs = billQueryString(f, { fuel: "DIESEL" });
    expect(qs).toContain("fuel=DIESEL");
    expect(qs).toContain("q=Acme");
    expect(qs).toContain("preset=7d");
  });

  it("removes a filter when overridden with null", () => {
    const f = parseBillFilters({ fuel: "PETROL", q: "Acme" });
    expect(billQueryString(f, { fuel: null })).not.toContain("fuel=");
  });
});

describe("hasActiveFilter", () => {
  it("is false for an untouched register", () => {
    expect(hasActiveFilter(parseBillFilters({ preset: "30d" }))).toBe(false);
  });

  it("is true for each narrowing filter", () => {
    for (const params of [{ status: "voided" }, { fuel: "CNG" }, { payment: "CASH" }, { vehicle: "ba2kha1234" }, { q: "x" }]) {
      expect(hasActiveFilter(parseBillFilters(params)), JSON.stringify(params)).toBe(true);
    }
  });
});
