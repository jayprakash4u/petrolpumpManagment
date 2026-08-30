import { clsx } from "clsx";
import type { ReactNode } from "react";

export type Tone = "success" | "error" | "accent" | "muted" | "warning" | "text";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  error: "bg-error/12 text-error",
  accent: "bg-accent/12 text-accent",
  muted: "bg-text-muted/12 text-text-muted",
  warning: "bg-warning/12 text-warning",
  text: "bg-text/10 text-text",
};

export function Badge({
  children,
  tone = "muted",
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] font-data text-[11px] font-semibold tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
