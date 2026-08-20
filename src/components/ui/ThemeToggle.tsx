"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useSyncExternalStore } from "react";

/**
 * "Has this component hydrated yet?" — the standard next-themes guard, since
 * the resolved theme isn't knowable during SSR. useSyncExternalStore gives
 * the answer without a setState-in-effect: the server snapshot is false and
 * the client snapshot is true, so React flips it as part of hydration
 * instead of scheduling an extra render pass afterwards.
 */
const neverChanges = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const buttonClasses =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:text-text";

  if (!hydrated) {
    return (
      <button type="button" className={buttonClasses} aria-label="Toggle theme">
        <Sun size={16} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={buttonClasses}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
