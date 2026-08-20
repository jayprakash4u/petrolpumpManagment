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
export function VoidSaleButton({ saleId, receiptNo }: { saleId: string; receiptNo: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(voidSaleAction, initialState);

  if (!open) {
    return (
      <GhostButton type="button" tone="error" onClick={() => setOpen(true)} aria-label={`Void receipt ${receiptNo}`}>
        <Ban size={13} />
        Void
      </GhostButton>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input type="hidden" name="saleId" value={saleId} />
      <Input
        name="reason"
        autoFocus
        required
        minLength={3}
        placeholder={`Reason for voiding #${receiptNo}`}
        className="sm:w-56"
      />
      <div className="flex gap-2">
        <PrimaryButton type="submit" disabled={pending} className="px-3 py-1.5 text-[12px]">
          {pending ? "Voiding…" : "Confirm"}
        </PrimaryButton>
        <GhostButton type="button" onClick={() => setOpen(false)}>
          Cancel
        </GhostButton>
      </div>
      {state.error && <span className="text-[11.5px] text-error">{state.error}</span>}
    </form>
  );
}
