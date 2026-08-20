"use client";

import { useActionState, useState } from "react";
import { UserPlus, CheckCircle2, Pencil, Archive, ArchiveRestore } from "lucide-react";
import {
  createCustomerAction,
  updateCreditLimitAction,
  setCustomerActiveAction,
  type CustomerFormState,
} from "@/lib/actions/customers";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: CustomerFormState = {};

/* ------------------------------------------------------------------ */

export function AddCustomerForm({ canAdd }: { canAdd: boolean }) {
  const [state, action, pending] = useActionState(createCustomerAction, initialState);

  if (!canAdd) {
    return (
      <p className="rounded-lg border border-border bg-bg px-4 py-3 text-[13px] text-text-muted">
        Your role can&apos;t add credit customers.
      </p>
    );
  }

  return (
    <>
      <AddCustomerFields key={state.message ?? "entering"} action={action} pending={pending} error={state.error} />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function AddCustomerFields({
  action,
  pending,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Customer name" htmlFor="customerName">
        <Input id="customerName" name="name" placeholder="Kathmandu Cabs Pvt. Ltd." />
      </Field>

      <Field label="Phone (optional)" htmlFor="phone">
        <Input id="phone" name="phone" inputMode="tel" placeholder="98410 22310" />
      </Field>

      <Field label="Credit limit" htmlFor="creditLimit">
        <Input id="creditLimit" name="creditLimit" inputMode="decimal" defaultValue="0" placeholder="50000" />
      </Field>

      <p className="text-[11.5px] text-text-muted">
        A limit of 0 means the account exists but can&apos;t be billed on credit until it&apos;s raised.
      </p>

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending} className="w-full py-2.5">
        <UserPlus size={15} />
        {pending ? "Adding…" : "Add Customer"}
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/** Inline credit-limit editor, owner/manager only. */
export function CreditLimitEditor({
  customerId,
  currentLimit,
}: {
  customerId: string;
  currentLimit: string;
}) {
  const [state, action, pending] = useActionState(updateCreditLimitAction, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <GhostButton type="button" onClick={() => setOpen(true)} className="px-2.5 py-1.5 text-[12px]">
        <Pencil size={12} />
        Limit
      </GhostButton>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="flex items-center gap-1.5">
        <Input
          name="creditLimit"
          inputMode="decimal"
          autoFocus
          defaultValue={currentLimit}
          className="w-28 px-2 py-1 text-[12px]"
          aria-label="New credit limit"
        />
        <PrimaryButton type="submit" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          {pending ? "…" : "Save"}
        </PrimaryButton>
        <GhostButton type="button" onClick={() => setOpen(false)} className="px-2.5 py-1.5 text-[12px]">
          Cancel
        </GhostButton>
      </div>
      {state.error && <span className="max-w-[260px] text-right text-[11px] text-error">{state.error}</span>}
      {state.message && <span className="max-w-[260px] text-right text-[11px] text-success">{state.message}</span>}
    </form>
  );
}

/** Close / reopen an account. Closing is refused server-side while money is outstanding. */
export function CustomerActiveToggle({
  customerId,
  active,
  hasDebt,
}: {
  customerId: string;
  active: boolean;
  hasDebt: boolean;
}) {
  const [state, action, pending] = useActionState(setCustomerActiveAction, initialState);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <GhostButton
        type="submit"
        disabled={pending || (active && hasDebt)}
        tone={active ? "error" : "success"}
        className="px-2.5 py-1.5 text-[12px]"
        title={active && hasDebt ? "Settle the outstanding balance first" : undefined}
      >
        {active ? <Archive size={12} /> : <ArchiveRestore size={12} />}
        {pending ? "…" : active ? "Close" : "Reopen"}
      </GhostButton>
      {state.error && <span className="max-w-[260px] text-right text-[11px] text-error">{state.error}</span>}
    </form>
  );
}
