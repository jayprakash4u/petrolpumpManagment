"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "@/components/ui/Field";
import {
  BS_MONTHS,
  BS_MIN_YEAR,
  BS_MAX_YEAR,
  bsDaysInMonth,
  fromBS,
  parseBSInput,
  todayBS,
  type BSDate,
} from "@/lib/bs-date";

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (bs: BSDate) => `${bs.year}-${pad(bs.month)}-${pad(bs.day)}`;
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Auto-inserts the "-" separators as digits are typed, so "20830518" becomes "2083-05-18" without the user typing the dashes themselves. */
function autoFormat(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join("-");
}

/**
 * A BS (Bikram Sambat) date field: type the date directly, or pick it from
 * a real Nepali-calendar popover. Native `<input type="date">` shows a
 * Gregorian picker, which would be actively wrong here — every date this
 * app shows a person is BS, so the picker has to be too.
 */
export function BSDateField({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const parsed = parseBSInput(value) ?? todayBS() ?? { year: BS_MIN_YEAR, month: 1, day: 1 };
    return { year: parsed.year, month: parsed.month };
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [open]);

  const openPicker = () => {
    const parsed = parseBSInput(value) ?? todayBS();
    if (parsed) setView({ year: parsed.year, month: parsed.month });
    setOpen((v) => !v);
  };

  const shiftMonth = (delta: number) => {
    let { year, month } = view;
    month += delta;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return;
    setView({ year, month });
  };

  const daysInMonth = bsDaysInMonth(view.year, view.month);
  const firstOfMonth = fromBS({ year: view.year, month: view.month, day: 1 });
  const leadingBlanks = firstOfMonth ? firstOfMonth.getDay() : 0;
  const selected = parseBSInput(value);
  const today = todayBS();

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(autoFormat(e.target.value))}
          placeholder="YYYY-MM-DD"
          inputMode="numeric"
          maxLength={10}
          className={clsx("pr-9", className)}
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label="Open Nepali calendar"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent"
        >
          <Calendar size={15} />
        </button>
      </div>

      {open && (
        <div className="absolute z-40 mt-1.5 w-64 rounded-xl border border-border bg-surface p-3 shadow-2xl animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} className="rounded p-1 text-text-muted hover:bg-surface-hi hover:text-text">
              <ChevronLeft size={15} />
            </button>
            <span className="font-display text-[13px] font-bold text-text">
              {BS_MONTHS[view.month - 1]} {view.year}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} className="rounded p-1 text-text-muted hover:bg-surface-hi hover:text-text">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-text-muted">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {daysInMonth &&
              Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isSelected = selected?.year === view.year && selected?.month === view.month && selected?.day === day;
                const isToday = today?.year === view.year && today?.month === view.month && today?.day === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      onChange(fmt({ year: view.year, month: view.month, day }));
                      setOpen(false);
                    }}
                    className={clsx(
                      "rounded-md py-1 text-[12px] font-medium transition-colors",
                      isSelected
                        ? "bg-accent text-[#1A1306] font-bold"
                        : isToday
                          ? "border border-accent/50 text-accent"
                          : "text-text hover:bg-surface-hi"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
          </div>

          {today && (
            <button
              type="button"
              onClick={() => {
                onChange(fmt(today));
                setView({ year: today.year, month: today.month });
                setOpen(false);
              }}
              className="mt-2 w-full rounded-lg border border-border py-1.5 text-[11.5px] font-semibold text-accent hover:bg-accent/10"
            >
              Today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
