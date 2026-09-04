"use client";

import { useActionState, useState } from "react";
import { Ban } from "lucide-react";
import { voidSaleAction, type VoidState } from "@/lib/actions/sales";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

const initialState: VoidState = {};

/**
 * Voiding returns fuel to the tank and reverses a credit charge, so it asks
 * for a reason inline rather than firing on a single click — the reason is
 * what makes the AuditLog entry useful six months later.
 */
export function VoidSaleButton({
  saleId,
  receiptNo,
  label = "Cancel this bill",
}: {
  saleId: string;
  receiptNo: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(voidSaleAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-0.5 inline-flex items-center gap-0.5 rounded-[3px] bg-error/15 px-1 py-0.5 text-[8px] font-bold text-error hover:bg-error/25 transition-colors cursor-pointer leading-none"
        aria-label={`Cancel bill #${receiptNo}`}
      >
        <Ban size={8} />
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="mt-1.5 flex flex-col gap-1.5 p-2 rounded-lg border border-error/40 bg-error/10 min-w-48">
      <input type="hidden" name="saleId" value={saleId} />
      <Input
        name="reason"
        autoFocus
        required
        minLength={3}
        className="h-7 text-[11px] px-2 py-1 bg-surface"
      />
      <div className="flex gap-1.5 justify-end">
        <PrimaryButton type="submit" disabled={pending} className="px-2.5 py-1 text-[11px] bg-error hover:bg-error/90 text-white">
          {pending ? "Canceling…" : "Confirm"}
        </PrimaryButton>
        <GhostButton type="button" onClick={() => setOpen(false)} className="px-2 py-1 text-[11px]">
          Close
        </GhostButton>
      </div>
      {state.error && <span className="text-[10.5px] text-error">{state.error}</span>}
    </form>
  );
}
