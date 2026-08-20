"use client";

import { useActionState, useState } from "react";
import { Banknote, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { recordPaymentAction, type CustomerFormState } from "@/lib/actions/customers";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: CustomerFormState = {};
const rs = (n: number) => "Rs " + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export function PaymentForm({
  customerId,
  customerName,
  dueAmount,
  canRecord,
}: {
  customerId: string;
  customerName: string;
  /** Serialized Decimal — this is a Client Component. */
  dueAmount: string;
  canRecord: boolean;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, initialState);

  if (!canRecord) {
    return (
      <p className="rounded-lg border border-border bg-bg px-4 py-3 text-[13px] text-text-muted">
        Your role can&apos;t record customer payments.
      </p>
    );
  }

  const due = Number(dueAmount);
  if (due <= 0) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/8 px-4 py-3 text-[13px] text-success">
        {customerName} is fully settled — nothing outstanding.
      </div>
    );
  }

  return (
    <>
      {/* Keyed so a successful payment resets the field; an error keeps what was typed. */}
      <PaymentFields
        key={state.message ?? `${customerId}:${dueAmount}`}
        customerId={customerId}
        dueAmount={dueAmount}
        action={action}
        pending={pending}
        error={state.error}
      />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function PaymentFields({
  customerId,
  dueAmount,
  action,
  pending,
  error,
}: {
  customerId: string;
  dueAmount: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const due = Number(dueAmount);
  const [amount, setAmount] = useState("");

  const entered = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(entered) && entered > 0;
  const over = valid && entered > due;
  const remaining = valid && !over ? due - entered : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="customerId" value={customerId} />
      {/* Pins the balance shown; the action refuses if it has moved since. */}
      <input type="hidden" name="expectedDue" value={dueAmount} />

      <div className="flex items-baseline justify-between rounded-lg border border-border bg-bg px-3 py-2.5">
        <span className="text-[12.5px] text-text-muted">Outstanding</span>
        <span className="font-data text-[17px] font-bold text-accent">{rs(due)}</span>
      </div>

      <Field label="Amount received" htmlFor="amount">
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(due)}
        />
      </Field>

      <GhostButton type="button" onClick={() => setAmount(String(due))} className="self-start">
        Settle in full — {rs(due)}
      </GhostButton>

      {remaining !== null && (
        <div className={clsx("text-[12.5px]", remaining === 0 ? "text-success" : "text-text-muted")}>
          {remaining === 0 ? "This clears the account." : `${rs(remaining)} would remain outstanding.`}
        </div>
      )}

      {over && (
        <div className="rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          That&apos;s more than the {rs(due)} outstanding. Overpayment isn&apos;t recorded against credit — take the
          balance, and put anything extra through as a cash sale.
        </div>
      )}

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending || !valid || over} className="w-full py-2.5">
        <Banknote size={15} />
        {pending ? "Recording…" : valid && !over ? `Record ${rs(entered)}` : "Record Payment"}
      </PrimaryButton>
    </form>
  );
}
