"use client";

import { useActionState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { startShiftAction, endShiftAction, type ShiftFormState } from "@/lib/actions/shifts";
import { GhostButton } from "@/components/ui/Button";

const initialState: ShiftFormState = {};

/**
 * One button per person. Rendered inside the roster row, so the action it
 * fires and the row it belongs to can never drift apart — the userId is a
 * hidden field, and the server re-checks that the caller is allowed to touch
 * that particular person's shift.
 */
export function ShiftButton({
  userId,
  onShift,
  compact,
}: {
  userId: string;
  onShift: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(onShift ? endShiftAction : startShiftAction, initialState);

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <GhostButton
        type="submit"
        disabled={pending}
        tone={onShift ? "error" : "success"}
        className={compact ? "px-2.5 py-1.5 text-[12px]" : undefined}
      >
        {onShift ? <LogOut size={13} /> : <LogIn size={13} />}
        {pending ? "…" : onShift ? "End Shift" : "Start Shift"}
      </GhostButton>
      {state.error && <span className="max-w-[220px] text-right text-[11px] text-error">{state.error}</span>}
    </form>
  );
}
