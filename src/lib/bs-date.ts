import NepaliDateLib from "nepali-date-converter";

/**
 * Bikram Sambat dates.
 *
 * Nepal runs on BS, not Gregorian: VAT periods, IRD filings, price
 * notifications and every pump's own books are all dated in BS. Showing an
 * owner "19 Aug 2026" instead of "2083-05-03" makes the software read as
 * foreign and unusable, so BS is the *display and reporting* calendar
 * throughout the app.
 *
 * What is NOT changing: every timestamp is still stored in the database as a
 * real UTC instant. BS is a presentation and range-selection concern only.
 * Storing a BS string would make sorting, comparison and arithmetic wrong,
 * and would be impossible to migrate off.
 *
 * This module is deliberately the *only* place that touches the conversion
 * library. Everything else imports from here, so the dependency can be
 * swapped (or replaced by our own table) without touching the app.
 */

// The library ships as UMD; interop differs between the Next bundler and the
// test runner, so normalise once here rather than at every call site.
const NepaliDate = ((NepaliDateLib as unknown as { default?: unknown }).default ??
  NepaliDateLib) as typeof NepaliDateLib;

/** Month is 1-based (1 = Baishakh), matching how a BS date is written and read. */
export interface BSDate {
  year: number;
  month: number;
  day: number;
}

/** Romanised BS month names, in order. Index 0 is Baishakh. */
export const BS_MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

/**
 * The conversion table's supported span. Outside it the library throws, and a
 * report page must never crash because someone typed a stray year — callers
 * get null and fall back to the Gregorian rendering.
 */
export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

/** Nepal's fiscal year opens on Shrawan 1 — BS month 4. */
export const FISCAL_YEAR_START_MONTH = 4;

/* ------------------------------------------------------------------ *
 * Conversion
 * ------------------------------------------------------------------ */

/**
 * Gregorian instant -> BS calendar date, in server-local time. Null when the
 * date falls outside the calendar table.
 *
 * The conversion is verified by converting straight back and comparing. That
 * is not belt-and-braces: below its table the library does unchecked
 * arithmetic and returns a *plausible-looking* wrong date instead of
 * throwing — 1900-01-01 AD comes back as 2043-04-08 BS, which converts
 * forward again to 1986-07-23, adrift by 86 years. A silent 86-year error in
 * a VAT filing is exactly the failure this module exists to prevent, so
 * every conversion has to prove itself.
 */
export function toBS(date: Date): BSDate | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  try {
    // Midday local, so a timezone offset can never tip the conversion into
    // the neighbouring day.
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    const nd = new NepaliDate(local);
    const bs: BSDate = { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };

    if (bs.year < BS_MIN_YEAR || bs.year > BS_MAX_YEAR) return null;

    const back = new NepaliDate(bs.year, bs.month - 1, bs.day).toJsDate();
    if (
      back.getFullYear() !== local.getFullYear() ||
      back.getMonth() !== local.getMonth() ||
      back.getDate() !== local.getDate()
    ) {
      return null;
    }

    return bs;
  } catch {
    return null;
  }
}

/** BS calendar date -> the Gregorian instant at local midnight. Null when out of range or not a real BS date. */
export function fromBS(bs: BSDate): Date | null {
  if (bs.year < BS_MIN_YEAR || bs.year > BS_MAX_YEAR) return null;
  if (bs.month < 1 || bs.month > 12 || bs.day < 1 || bs.day > 32) return null;
  try {
    const jsDate = new NepaliDate(bs.year, bs.month - 1, bs.day).toJsDate();
    const atMidnight = new Date(jsDate.getFullYear(), jsDate.getMonth(), jsDate.getDate(), 0, 0, 0, 0);
    // The library tolerates an over-long day (e.g. Baishakh 32 in a 31-day
    // month) by rolling into the next month. Reject that instead of silently
    // returning a different date than the one asked for.
    const back = toBS(atMidnight);
    if (!back || back.year !== bs.year || back.month !== bs.month || back.day !== bs.day) return null;
    return atMidnight;
  } catch {
    return null;
  }
}

/** Days in a given BS month — varies from 29 to 32 with no formula, so it is measured, not computed. */
export function bsDaysInMonth(year: number, month: number): number | null {
  for (let day = 32; day >= 29; day--) {
    if (fromBS({ year, month, day })) return day;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

/** 2083-05-03 — the form used on invoices and in IRD filings. */
export function fmtBS(date: Date): string {
  const bs = toBS(date);
  // Falls back to the Gregorian date rather than showing nothing, so an
  // out-of-range value is visibly odd instead of silently blank.
  if (!bs) return date.toISOString().slice(0, 10);
  return `${bs.year}-${pad(bs.month)}-${pad(bs.day)}`;
}

export const fmtBSDate = fmtBS;

/** 3 Bhadra 2083 — for headings and anywhere a date is read aloud. */
export function fmtBSLong(date: Date): string {
  const bs = toBS(date);
  if (!bs) return date.toISOString().slice(0, 10);
  return `${bs.day} ${BS_MONTHS[bs.month - 1]} ${bs.year}`;
}

/** 3 Bhadra 2083, 4:35 pm — BS date with the clock time, which stays Gregorian-agnostic. */
export function fmtBSDateTime(date: Date): string {
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${fmtBSLong(date)}, ${time}`;
}

/** 3 Bhadra — compact, for axis labels and dense tables where the year is implied. */
export function fmtBSDayMonth(date: Date): string {
  const bs = toBS(date);
  if (!bs) return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${bs.day} ${BS_MONTHS[bs.month - 1]}`;
}

/** Baishakh 2083 — a month heading. */
export function fmtBSMonth(date: Date): string {
  const bs = toBS(date);
  if (!bs) return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  return `${BS_MONTHS[bs.month - 1]} ${bs.year}`;
}

/* ------------------------------------------------------------------ *
 * Ranges
 * ------------------------------------------------------------------ */

/** First and last Gregorian instants of a BS month, ready to hand to a report query. */
export function bsMonthRange(year: number, month: number): { from: Date; to: Date } | null {
  const from = fromBS({ year, month, day: 1 });
  const days = bsDaysInMonth(year, month);
  if (!from || !days) return null;
  const lastDay = fromBS({ year, month, day: days });
  if (!lastDay) return null;
  const to = new Date(lastDay);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/**
 * Nepal's fiscal year label for a date — "2083/84".
 *
 * The year runs Shrawan 1 to the end of Ashadh, so anything in months 1–3
 * belongs to the fiscal year that opened in the *previous* BS year. Getting
 * this backwards misfiles a quarter of every year's VAT.
 */
export function fiscalYearOf(date: Date): string | null {
  const bs = toBS(date);
  if (!bs) return null;
  const startYear = bs.month >= FISCAL_YEAR_START_MONTH ? bs.year : bs.year - 1;
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/** The Gregorian span of a fiscal year that opened in `startYear` BS. */
export function fiscalYearRange(startYear: number): { from: Date; to: Date } | null {
  const from = fromBS({ year: startYear, month: FISCAL_YEAR_START_MONTH, day: 1 });
  const endMonth = FISCAL_YEAR_START_MONTH - 1; // Ashadh
  const days = bsDaysInMonth(startYear + 1, endMonth);
  if (!from || !days) return null;
  const lastDay = fromBS({ year: startYear + 1, month: endMonth, day: days });
  if (!lastDay) return null;
  const to = new Date(lastDay);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

/** Parses "2083-05-03" from a form field. Null for anything malformed or not a real BS date. */
export function parseBSInput(value: string | undefined): BSDate | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const bs = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  return fromBS(bs) ? bs : null;
}

/** Today, in BS. */
export function todayBS(now: Date = new Date()): BSDate | null {
  return toBS(now);
}
