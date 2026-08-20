"use client";

import { Printer } from "lucide-react";
import { GhostButton } from "@/components/ui/Button";

/** Reprint a bill. Uses the `.print-area` rule already in globals.css, so only the slip prints. */
export function PrintButton() {
  return (
    <GhostButton type="button" onClick={() => window.print()} aria-label="Print bill">
      <Printer size={14} />
      Print
    </GhostButton>
  );
}
