import { clsx } from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";

export function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5 text-[12.5px] font-medium text-text-muted">
      {label}
      {children}
    </label>
  );
}

const fieldBaseClasses =
  "w-full rounded-lg border border-border bg-bg px-[11px] py-[9px] font-data text-sm text-text placeholder:text-text-muted/60 transition-colors focus:border-accent/80 focus:outline-none";

// ComponentPropsWithRef (not InputHTMLAttributes) so callers can pass `ref`
// directly — React 19 treats ref as an ordinary prop, no forwardRef needed.
export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={clsx(fieldBaseClasses, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={clsx(fieldBaseClasses, className)} {...props} />;
}
