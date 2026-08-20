import { describe, it, expect } from "vitest";
import {
  toBS,
  fromBS,
  fmtBS,
  fmtBSLong,
  fmtBSDayMonth,
  fmtBSMonth,
  bsDaysInMonth,
  bsMonthRange,
  fiscalYearOf,
  fiscalYearRange,
  parseBSInput,
  BS_MONTHS,
  BS_MIN_YEAR,
  BS_MAX_YEAR,
} from "@/lib/bs-date";

/** Local-midnight Gregorian date, matching how the app builds ranges. */
const ad = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("known anchors", () => {
  it("maps the calendar epoch: 1943-04-14 AD = 2000-01-01 BS", () => {
    expect(toBS(ad(1943, 4, 14))).toEqual({ year: 2000, month: 1, day: 1 });
  });

  it("maps a date cross-checked against a live Nepali system", () => {
    // 2083-04-18 BS, taken from a production fuel-station app's price table.
    expect(fromBS({ year: 2083, month: 4, day: 18 })).toEqual(ad(2026, 8, 3));
  });

  it("maps the start of the Gregorian millennium", () => {
    expect(toBS(ad(2000, 1, 1))).toEqual({ year: 2056, month: 9, day: 17 });
  });

  it("keeps the familiar BS = AD + 56/57 relationship", () => {
    const bs = toBS(ad(2026, 8, 19));
    expect(bs).not.toBeNull();
    expect(bs!.year).toBe(2083);
  });
});

describe("round tripping", () => {
  it("returns to the same Gregorian date across a long span", () => {
    // Every 37 days for ~20 years, so the walk crosses every month length
    // and both calendars' year boundaries many times.
    let checked = 0;
    for (let t = ad(2010, 1, 1).getTime(); t < ad(2030, 1, 1).getTime(); t += 37 * 86_400_000) {
      const date = new Date(t);
      const bs = toBS(date);
      expect(bs, date.toDateString()).not.toBeNull();
      const back = fromBS(bs!);
      expect(back, date.toDateString()).not.toBeNull();
      expect(back!.getFullYear()).toBe(date.getFullYear());
      expect(back!.getMonth()).toBe(date.getMonth());
      expect(back!.getDate()).toBe(date.getDate());
      checked++;
    }
    expect(checked).toBeGreaterThan(190);
  });

  it("advances exactly one BS day for each Gregorian day", () => {
    let previous = toBS(ad(2026, 1, 1))!;
    for (let i = 1; i <= 400; i++) {
      const current = toBS(new Date(ad(2026, 1, 1).getTime() + i * 86_400_000))!;
      const rolledWithinMonth = current.day === previous.day + 1;
      const rolledToNewMonth = current.day === 1 && current.month !== previous.month;
      expect(rolledWithinMonth || rolledToNewMonth, `day ${i}: ${JSON.stringify(previous)} -> ${JSON.stringify(current)}`).toBe(true);
      previous = current;
    }
  });
});

describe("month lengths", () => {
  it("reports lengths only in the real BS range of 29 to 32 days", () => {
    for (let month = 1; month <= 12; month++) {
      const days = bsDaysInMonth(2083, month);
      expect(days, `month ${month}`).not.toBeNull();
      expect(days!).toBeGreaterThanOrEqual(29);
      expect(days!).toBeLessThanOrEqual(32);
    }
  });

  it("months sum to a real year length", () => {
    let total = 0;
    for (let month = 1; month <= 12; month++) total += bsDaysInMonth(2083, month)!;
    expect(total).toBeGreaterThanOrEqual(365);
    expect(total).toBeLessThanOrEqual(366);
  });

  it("rejects a day past the end of its month rather than rolling into the next", () => {
    const days = bsDaysInMonth(2083, 1)!;
    expect(fromBS({ year: 2083, month: 1, day: days })).not.toBeNull();
    // The library would happily roll this over; we must not.
    expect(fromBS({ year: 2083, month: 1, day: days + 1 })).toBeNull();
  });
});

describe("out of range never throws", () => {
  it("returns null below and above the supported years", () => {
    expect(fromBS({ year: BS_MIN_YEAR - 1, month: 1, day: 1 })).toBeNull();
    expect(fromBS({ year: BS_MAX_YEAR + 1, month: 1, day: 1 })).toBeNull();
    expect(toBS(ad(1900, 1, 1))).toBeNull();
    expect(toBS(ad(2200, 1, 1))).toBeNull();
  });

  it("returns null for impossible months and days", () => {
    expect(fromBS({ year: 2083, month: 0, day: 1 })).toBeNull();
    expect(fromBS({ year: 2083, month: 13, day: 1 })).toBeNull();
    expect(fromBS({ year: 2083, month: 1, day: 0 })).toBeNull();
  });

  it("returns null for an invalid Date rather than throwing", () => {
    expect(toBS(new Date("not a date"))).toBeNull();
  });

  it("formatters degrade to the Gregorian date instead of crashing a page", () => {
    const outOfRange = ad(1900, 1, 1);
    expect(() => fmtBS(outOfRange)).not.toThrow();
    expect(fmtBS(outOfRange)).toMatch(/^1899|^1900/);
    expect(() => fmtBSLong(outOfRange)).not.toThrow();
    expect(() => fmtBSMonth(outOfRange)).not.toThrow();
  });
});

describe("formatting", () => {
  const d = ad(2026, 8, 19); // 2083-05-03 BS

  it("formats the invoice form", () => {
    expect(fmtBS(d)).toBe("2083-05-03");
  });

  it("zero-pads month and day", () => {
    expect(fmtBS(fromBS({ year: 2083, month: 1, day: 1 })!)).toBe("2083-01-01");
  });

  it("formats the long form with the Nepali month name", () => {
    expect(fmtBSLong(d)).toBe("3 Bhadra 2083");
  });

  it("formats day and month for dense labels", () => {
    expect(fmtBSDayMonth(d)).toBe("3 Bhadra");
  });

  it("formats a month heading", () => {
    expect(fmtBSMonth(d)).toBe("Bhadra 2083");
  });

  it("names all twelve months in order, starting at Baishakh", () => {
    expect(BS_MONTHS).toHaveLength(12);
    expect(BS_MONTHS[0]).toBe("Baishakh");
    expect(BS_MONTHS[11]).toBe("Chaitra");
  });
});

describe("month ranges", () => {
  it("spans a whole BS month, midnight to the last millisecond", () => {
    const range = bsMonthRange(2083, 1)!;
    expect(toBS(range.from)).toEqual({ year: 2083, month: 1, day: 1 });
    expect(toBS(range.to)!.month).toBe(1);
    expect(range.to.getHours()).toBe(23);
    expect(range.to.getMinutes()).toBe(59);
  });

  it("ends on the real last day of the month", () => {
    const days = bsDaysInMonth(2083, 1)!;
    expect(toBS(bsMonthRange(2083, 1)!.to)!.day).toBe(days);
  });

  it("leaves no gap between consecutive months", () => {
    const first = bsMonthRange(2083, 1)!;
    const second = bsMonthRange(2083, 2)!;
    // The next month starts the very next millisecond.
    expect(second.from.getTime() - first.to.getTime()).toBe(1);
  });
});

describe("fiscal year", () => {
  it("opens on Shrawan 1", () => {
    // Shrawan is month 4.
    const shrawan1 = fromBS({ year: 2083, month: 4, day: 1 })!;
    expect(fiscalYearOf(shrawan1)).toBe("2083/84");
  });

  it("puts the day before Shrawan in the previous fiscal year", () => {
    const ashadhEnd = fromBS({ year: 2083, month: 3, day: bsDaysInMonth(2083, 3)! })!;
    expect(fiscalYearOf(ashadhEnd)).toBe("2082/83");
  });

  it("keeps months 1-3 in the fiscal year that opened the year before", () => {
    // This is the one everyone gets backwards; a quarter of the year's VAT
    // depends on it.
    for (const month of [1, 2, 3]) {
      expect(fiscalYearOf(fromBS({ year: 2083, month, day: 1 })!), `month ${month}`).toBe("2082/83");
    }
    for (const month of [4, 5, 12]) {
      expect(fiscalYearOf(fromBS({ year: 2083, month, day: 1 })!), `month ${month}`).toBe("2083/84");
    }
  });

  it("spans Shrawan 1 to the end of Ashadh", () => {
    const range = fiscalYearRange(2083)!;
    expect(toBS(range.from)).toEqual({ year: 2083, month: 4, day: 1 });
    const end = toBS(range.to)!;
    expect(end.year).toBe(2084);
    expect(end.month).toBe(3);
    expect(end.day).toBe(bsDaysInMonth(2084, 3));
  });

  it("covers a full year with no gap or overlap between consecutive fiscal years", () => {
    const a = fiscalYearRange(2082)!;
    const b = fiscalYearRange(2083)!;
    expect(b.from.getTime() - a.to.getTime()).toBe(1);
  });
});

describe("parsing form input", () => {
  it("accepts a real BS date", () => {
    expect(parseBSInput("2083-05-03")).toEqual({ year: 2083, month: 5, day: 3 });
  });

  it("accepts unpadded month and day", () => {
    expect(parseBSInput("2083-5-3")).toEqual({ year: 2083, month: 5, day: 3 });
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "2083/05/03", "03-05-2083", "not-a-date", undefined]) {
      expect(parseBSInput(bad as string | undefined), String(bad)).toBeNull();
    }
  });

  it("rejects a date that does not exist in the BS calendar", () => {
    expect(parseBSInput("2083-01-33")).toBeNull();
    expect(parseBSInput("2083-13-01")).toBeNull();
    expect(parseBSInput("1990-01-01")).toBeNull(); // before the table starts
  });
});
