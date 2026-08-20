import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "animate-fade-in rounded-2xl border border-border bg-surface",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
