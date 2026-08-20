import { fmtBSDayMonth, fmtBSLong, toBS, fromBS } from "@/lib/bs-date";

/**
 * Pure reporting-window logic. Date ranges are where reports quietly go
 * wrong — an end date that excludes its own last 23 hours, a reversed range
 * that silently returns nothing, an unbounded span that scans the whole
 * table. All of that is decided here, where it can be tested directly.
 */

export type PresetKey = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

export const PRESET_LABEL: Record<PresetKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  custom: "Custom",
};

/** Presets offered as one-click links; `custom` is driven by the date inputs instead. */
export const PRESETS: Exclude<PresetKey, "custom">[] = ["today", "yesterday", "7d", "30d", "month"];

/** Guards against a range so wide the aggregation scans years of rows. */
export const MAX_RANGE_DAYS = 366;

export interface DateRange {
  /** Inclusive start, at 00:00:00.000 local. */
  from: Date;
  /** Inclusive end, at 23:59:59.999 local — so "to = today" includes everything that happened today. */
  to: Date;
  preset: PresetKey;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** yyyy-mm-dd in *local* time — `toISOString()` would shift the day for anyone east or west of UTC. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses a yyyy-mm-dd form value as a *local* date. Returns null for anything malformed. */
export function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const d = new Date(year, month - 1, day);
  // Rejects impossible dates that Date would silently roll over (2026-02-31 -> 3 March).
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function presetRange(preset: Exclude<PresetKey, "custom">, now: Date = new Date()): DateRange {
  const today = startOfDay(now);

  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(today), preset };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y, to: endOfDay(y), preset };
    }
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6); // today plus the 6 before it
      return { from, to: endOfDay(today), preset };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(today), preset };
    }
    case "month": {
      // The *Bikram Sambat* month, not the Gregorian one. "This month" to a
      // Nepali pump owner means Bhadra, and a Gregorian month boundary would
      // silently split their books across two BS months.
      const bs = toBS(today);
      const bsStart = bs ? fromBS({ year: bs.year, month: bs.month, day: 1 }) : null;
      const from = bsStart ?? new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: endOfDay(today), preset };
    }
  }
}

/**
 * Turns raw search params into a range that is always valid to query with.
 *
 * A reversed range is swapped rather than rejected — someone picking the
 * dates in the wrong order meant the span between them, and returning an
 * empty report would just look like "no sales". An over-long span is
 * trimmed from the *start*, keeping the most recent data, which is what
 * someone looking at a report almost always wants.
 */
export function resolveRange(
  rawPreset: string | undefined,
  rawFrom: string | undefined,
  rawTo: string | undefined,
  now: Date = new Date()
): DateRange {
  const from = parseDateInput(rawFrom);
  const to = parseDateInput(rawTo);

  if (from && to) {
    let start = startOfDay(from);
    let end = startOfDay(to);
    if (start.getTime() > end.getTime()) [start, end] = [end, start];

    const spanDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (spanDays > MAX_RANGE_DAYS) {
      start = new Date(end);
      start.setDate(start.getDate() - (MAX_RANGE_DAYS - 1));
    }

    return { from: start, to: endOfDay(end), preset: "custom" };
  }

  const preset = PRESETS.find((p) => p === rawPreset) ?? "today";
  return presetRange(preset, now);
}

/** Inclusive whole days covered by the range. */
export function rangeDays(range: DateRange): number {
  return Math.floor((startOfDay(range.to).getTime() - startOfDay(range.from).getTime()) / 86_400_000) + 1;
}

/**
 * Daily buckets across the whole range, including days with no activity —
 * a trend line with gaps silently misrepresents a quiet Tuesday as
 * "no data" and distorts the shape of the chart.
 */
export function dayBuckets(range: DateRange): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(range.from);
  const last = startOfDay(range.to);
  while (cursor.getTime() <= last.getTime() && days.length <= MAX_RANGE_DAYS) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Short axis label — "3 Bhadra" for a multi-day range, weekday for a single week. */
export function bucketLabel(d: Date, totalDays: number): string {
  // Weekday names are calendar-agnostic, so a week-long range keeps them.
  if (totalDays <= 7) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return fmtBSDayMonth(d);
}

export function describeRange(range: DateRange): string {
  if (range.preset !== "custom") return PRESET_LABEL[range.preset];
  const fmt = (d: Date) => fmtBSLong(d);
  return rangeDays(range) === 1 ? fmt(range.from) : `${fmt(range.from)} – ${fmt(range.to)}`;
}
