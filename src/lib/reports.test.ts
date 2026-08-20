import { describe, it, expect } from "vitest";
import {
  startOfDay,
  endOfDay,
  toDateInput,
  parseDateInput,
  presetRange,
  resolveRange,
  rangeDays,
  dayBuckets,
  describeRange,
  MAX_RANGE_DAYS,
} from "@/lib/reports";
import { toBS } from "@/lib/bs-date";

// A Wednesday, mid-afternoon.
const NOW = new Date(2026, 7, 19, 15, 42, 30);

describe("day boundaries", () => {
  it("starts a day at midnight", () => {
    const d = startOfDay(NOW);
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(d.getDate()).toBe(19);
  });

  it("ends a day at the last millisecond, so the final hours aren't silently excluded", () => {
    const d = endOfDay(NOW);
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([23, 59, 59, 999]);
    expect(d.getDate()).toBe(19);
  });

  it("does not mutate the date it was given", () => {
    const original = new Date(NOW);
    startOfDay(original);
    endOfDay(original);
    expect(original.getTime()).toBe(NOW.getTime());
  });
});

describe("toDateInput / parseDateInput", () => {
  it("formats a local date without shifting across the timezone boundary", () => {
    // 00:30 local on the 19th must still be the 19th, not the 18th via UTC.
    expect(toDateInput(new Date(2026, 7, 19, 0, 30))).toBe("2026-08-19");
    expect(toDateInput(new Date(2026, 7, 19, 23, 30))).toBe("2026-08-19");
  });

  it("round-trips", () => {
    const d = parseDateInput("2026-08-19");
    expect(d).not.toBeNull();
    expect(toDateInput(d!)).toBe("2026-08-19");
  });

  it("parses as local midnight", () => {
    const d = parseDateInput("2026-08-19")!;
    expect(d.getHours()).toBe(0);
    expect(d.getDate()).toBe(19);
    expect(d.getMonth()).toBe(7);
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "19-08-2026", "2026/08/19", "not-a-date", "2026-8-9", undefined]) {
      expect(parseDateInput(bad as string | undefined), String(bad)).toBeNull();
    }
  });

  it("rejects an impossible date instead of rolling it over", () => {
    // Date would turn 2026-02-31 into 3 March.
    expect(parseDateInput("2026-02-31")).toBeNull();
    expect(parseDateInput("2026-13-01")).toBeNull();
    expect(parseDateInput("2026-00-10")).toBeNull();
  });

  it("accepts a real leap day and rejects a fake one", () => {
    expect(parseDateInput("2024-02-29")).not.toBeNull();
    expect(parseDateInput("2026-02-29")).toBeNull();
  });
});

describe("presetRange", () => {
  it("today covers exactly one day", () => {
    const r = presetRange("today", NOW);
    expect(r.from.getDate()).toBe(19);
    expect(r.to.getDate()).toBe(19);
    expect(rangeDays(r)).toBe(1);
  });

  it("yesterday excludes today", () => {
    const r = presetRange("yesterday", NOW);
    expect(r.from.getDate()).toBe(18);
    expect(r.to.getDate()).toBe(18);
    expect(rangeDays(r)).toBe(1);
  });

  it("7 days covers 7 calendar days including today", () => {
    const r = presetRange("7d", NOW);
    expect(r.from.getDate()).toBe(13);
    expect(rangeDays(r)).toBe(7);
  });

  it("30 days covers 30 calendar days including today", () => {
    const r = presetRange("30d", NOW);
    expect(rangeDays(r)).toBe(30);
    expect(r.from.getMonth()).toBe(6); // July
    expect(r.from.getDate()).toBe(21);
  });

  it("this month means the BIKRAM SAMBAT month, not the Gregorian one", () => {
    // NOW is 2083-05-03 BS, so "this month" is Bhadra and opens on Bhadra 1
    // — which lands mid-August in Gregorian terms. A Gregorian 1st would
    // split a Nepali pump's books across two BS months.
    const r = presetRange("month", NOW);
    expect(toBS(r.from)).toEqual({ year: 2083, month: 5, day: 1 });
    expect(r.from.getDate()).not.toBe(1);
    expect(rangeDays(r)).toBe(3);
  });
});

describe("resolveRange", () => {
  it("falls back to today when nothing is supplied", () => {
    const r = resolveRange(undefined, undefined, undefined, NOW);
    expect(r.preset).toBe("today");
    expect(rangeDays(r)).toBe(1);
  });

  it("falls back to today for an unknown preset", () => {
    const r = resolveRange("last-decade", undefined, undefined, NOW);
    expect(r.preset).toBe("today");
  });

  it("honours a valid preset", () => {
    expect(resolveRange("30d", undefined, undefined, NOW).preset).toBe("30d");
  });

  it("uses an explicit custom range", () => {
    const r = resolveRange(undefined, "2026-08-01", "2026-08-15", NOW);
    expect(r.preset).toBe("custom");
    expect(r.from.getDate()).toBe(1);
    expect(r.to.getDate()).toBe(15);
    expect(rangeDays(r)).toBe(15);
  });

  it("includes the whole of the end day", () => {
    const r = resolveRange(undefined, "2026-08-01", "2026-08-15", NOW);
    expect(r.to.getHours()).toBe(23);
    expect(r.to.getMinutes()).toBe(59);
  });

  it("swaps a reversed range rather than returning nothing", () => {
    const r = resolveRange(undefined, "2026-08-15", "2026-08-01", NOW);
    expect(r.from.getDate()).toBe(1);
    expect(r.to.getDate()).toBe(15);
    expect(rangeDays(r)).toBe(15);
  });

  it("treats a single-day custom range as one full day", () => {
    const r = resolveRange(undefined, "2026-08-19", "2026-08-19", NOW);
    expect(rangeDays(r)).toBe(1);
    expect(r.from.getHours()).toBe(0);
    expect(r.to.getHours()).toBe(23);
  });

  it("trims an over-long span from the start, keeping the most recent data", () => {
    const r = resolveRange(undefined, "2000-01-01", "2026-08-19", NOW);
    expect(rangeDays(r)).toBe(MAX_RANGE_DAYS);
    expect(r.to.getFullYear()).toBe(2026);
    expect(r.to.getMonth()).toBe(7);
    expect(r.to.getDate()).toBe(19);
  });

  it("ignores a half-supplied custom range and uses the preset", () => {
    expect(resolveRange("7d", "2026-08-01", undefined, NOW).preset).toBe("7d");
    expect(resolveRange("7d", undefined, "2026-08-15", NOW).preset).toBe("7d");
  });

  it("ignores a malformed custom range", () => {
    const r = resolveRange(undefined, "garbage", "2026-08-15", NOW);
    expect(r.preset).toBe("today");
  });
});

describe("dayBuckets", () => {
  it("emits one bucket per day, inclusive of both ends", () => {
    const r = resolveRange(undefined, "2026-08-01", "2026-08-05", NOW);
    const days = dayBuckets(r);
    expect(days).toHaveLength(5);
    expect(days[0].getDate()).toBe(1);
    expect(days[4].getDate()).toBe(5);
  });

  it("emits a single bucket for a one-day range", () => {
    expect(dayBuckets(presetRange("today", NOW))).toHaveLength(1);
  });

  it("includes quiet days rather than leaving gaps in the trend", () => {
    const days = dayBuckets(presetRange("7d", NOW));
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.getDate())).toEqual([13, 14, 15, 16, 17, 18, 19]);
  });

  it("crosses a month boundary correctly", () => {
    const r = resolveRange(undefined, "2026-07-30", "2026-08-02", NOW);
    expect(dayBuckets(r).map((d) => d.getDate())).toEqual([30, 31, 1, 2]);
  });

  it("stays bounded for a maximal range", () => {
    const r = resolveRange(undefined, "2000-01-01", "2026-08-19", NOW);
    expect(dayBuckets(r).length).toBeLessThanOrEqual(MAX_RANGE_DAYS + 1);
  });
});

describe("describeRange", () => {
  it("names a preset", () => {
    expect(describeRange(presetRange("7d", NOW))).toBe("Last 7 days");
  });

  it("shows a single date for a one-day custom range", () => {
    const r = resolveRange(undefined, "2026-08-19", "2026-08-19", NOW);
    expect(describeRange(r)).not.toContain("–");
    // Rendered in BS, the calendar the reader actually files taxes in.
    expect(describeRange(r)).toBe("3 Bhadra 2083");
  });

  it("shows both ends for a multi-day custom range", () => {
    const r = resolveRange(undefined, "2026-08-01", "2026-08-15", NOW);
    expect(describeRange(r)).toContain("–");
  });
});
