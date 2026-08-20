import { describe, it, expect } from "vitest";
import {
  rangeStart,
  shiftMinutes,
  fmtDuration,
  averageSale,
  revenueSharePct,
  initials,
  isRangeKey,
} from "@/lib/staff";

const at = (iso: string) => new Date(iso);

describe("rangeStart", () => {
  const now = at("2026-08-19T15:42:00");

  it("starts today at midnight, not 24 hours ago", () => {
    const start = rangeStart("today", now);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getDate()).toBe(19);
  });

  it("covers 7 calendar days including today", () => {
    const start = rangeStart("7d", now);
    expect(start.getDate()).toBe(13);
    expect(start.getHours()).toBe(0);
  });

  it("covers 30 calendar days including today", () => {
    const start = rangeStart("30d", now);
    expect(start.getMonth()).toBe(6); // July
    expect(start.getDate()).toBe(21);
  });

  it("does not mutate the date it was given", () => {
    const original = at("2026-08-19T15:42:00");
    rangeStart("30d", original);
    expect(original.toISOString()).toBe(at("2026-08-19T15:42:00").toISOString());
  });

  it("recognises only the three valid range keys", () => {
    expect(isRangeKey("today")).toBe(true);
    expect(isRangeKey("7d")).toBe(true);
    expect(isRangeKey("30d")).toBe(true);
    expect(isRangeKey("all")).toBe(false);
    expect(isRangeKey(undefined)).toBe(false);
  });
});

describe("shiftMinutes", () => {
  it("measures a completed shift", () => {
    expect(shiftMinutes(at("2026-08-19T08:00:00"), at("2026-08-19T15:25:00"))).toBe(445);
  });

  it("measures an open shift against now", () => {
    const started = at("2026-08-19T08:00:00");
    const now = at("2026-08-19T11:30:00");
    expect(shiftMinutes(started, null, now)).toBe(210);
  });

  it("floors at zero rather than reporting a negative shift", () => {
    expect(shiftMinutes(at("2026-08-19T15:00:00"), at("2026-08-19T08:00:00"))).toBe(0);
  });

  it("handles a shift crossing midnight", () => {
    expect(shiftMinutes(at("2026-08-19T22:00:00"), at("2026-08-20T06:00:00"))).toBe(480);
  });
});

describe("fmtDuration", () => {
  it("formats hours and minutes", () => {
    expect(fmtDuration(445)).toBe("7h 25m");
  });

  it("drops the minutes on a whole hour", () => {
    expect(fmtDuration(120)).toBe("2h");
  });

  it("shows minutes only under an hour", () => {
    expect(fmtDuration(45)).toBe("45m");
  });

  it("shows 0m for nothing", () => {
    expect(fmtDuration(0)).toBe("0m");
    expect(fmtDuration(-10)).toBe("0m");
  });
});

describe("averageSale", () => {
  it("divides revenue by the number of sales", () => {
    expect(averageSale("10000", 4)?.toString()).toBe("2500");
  });

  it("returns null rather than dividing by zero sales", () => {
    expect(averageSale("0", 0)).toBeNull();
  });

  it("rounds to paisa", () => {
    expect(averageSale("1000", 3)?.toString()).toBe("333.33");
  });
});

describe("revenueSharePct", () => {
  it("reports a share of the station total", () => {
    expect(revenueSharePct("2500", "10000").toString()).toBe("25");
  });

  it("is zero when the station sold nothing", () => {
    expect(revenueSharePct("0", "0").toString()).toBe("0");
  });

  it("rounds to one decimal", () => {
    expect(revenueSharePct("1", "3").toString()).toBe("33.3");
  });
});

describe("initials", () => {
  it("uses first and last name", () => {
    expect(initials("Prakash Shrestha")).toBe("PS");
  });

  it("uses the first two letters of a single name", () => {
    expect(initials("Ramesh")).toBe("RA");
  });

  it("skips middle names", () => {
    expect(initials("Anita Kumari K.C.")).toBe("AK");
  });

  it("survives blank input", () => {
    expect(initials("   ")).toBe("?");
  });
});
