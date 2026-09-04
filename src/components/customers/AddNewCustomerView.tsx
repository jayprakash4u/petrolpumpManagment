"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { createCustomerAction, type CustomerFormState } from "@/lib/actions/customers";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: CustomerFormState = {};

/**
 * A full page, not a modal — matching how every other record in this app
 * (a bill, a purchase, a supplier) is created: its own page you navigate to
 * and away from.
 *
 * Submits through the real `createCustomerAction`, so this writes the same
 * `Customer` row the Credit page reads — no separate mock store to drift
 * out of sync. Only fields the schema actually has (name, PAN, phone,
 * email, address, credit limit) are collected; "is this a credit account"
 * isn't its own column, it's just whether the limit is above zero, which
 * is what the credit ledger already checks.
 */
export function AddNewCustomerView({ canAdd }: { canAdd: boolean }) {
  const [state, action, pending] = useActionState(createCustomerAction, initialState);

  if (!canAdd) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 text-[13px] text-text-muted shadow-xs">
        Your role can&apos;t add customers.
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl flex items-center gap-2">
            <UserPlus size={20} className="text-accent" />
            <span>Add New Customer</span>
          </h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Register a retail or credit account for billing at the pump.
          </p>
        </div>

        <Link href="/customers/credit">
          <GhostButton
            type="button"
            className="h-8 px-3 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hi flex items-center gap-1.5 cursor-pointer text-text hover:text-accent transition-colors shadow-xs"
          >
            <ArrowLeft size={13} />
            <span>Back to Directory</span>
          </GhostButton>
        </Link>
      </div>

      {state.message && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-xs p-5 sm:p-6">
        <CustomerFields key={state.message ?? "entering"} action={action} pending={pending} error={state.error} />
      </div>
    </div>
  );
}

function CustomerFields({
  action,
  pending,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const [isCreditCustomer, setIsCreditCustomer] = useState(true);

  return (
    <form action={action} className="space-y-5">
      <div className="border-b border-border/80 pb-2">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-accent">Contact Details</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Customer Name *" htmlFor="name">
          <Input id="name" name="name" required />
        </Field>

        <Field label="PAN No." htmlFor="panNo">
          <Input id="panNo" name="panNo" className="font-mono" />
        </Field>

        <Field label="Phone No." htmlFor="phone">
          <Input id="phone" name="phone" inputMode="tel" className="font-mono" />
        </Field>

        <Field label="Email Address" htmlFor="email">
          <Input id="email" name="email" type="email" />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Address" htmlFor="address">
            <Input id="address" name="address" />
          </Field>
        </div>
      </div>

      <div className="border-b border-border/80 pt-1 pb-2">
        <h3 className="font-display text-xs font-bold uppercase tracking-wider text-accent">Credit Terms</h3>
      </div>

      <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-text cursor-pointer">
        <input
          type="checkbox"
          checked={isCreditCustomer}
          onChange={(e) => setIsCreditCustomer(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent cursor-pointer"
        />
        <CreditCard size={14} className="text-text-muted" />
        This is a credit customer
      </label>

      {isCreditCustomer ? (
        <Field label="Credit Limit (NPR)" htmlFor="creditLimit">
          <Input
            id="creditLimit"
            name="creditLimit"
            inputMode="decimal"
            className="font-mono"
            defaultValue="0"
          />
        </Field>
      ) : (
        <input type="hidden" name="creditLimit" value="0" />
      )}

      <p className="text-[11.5px] text-text-muted">
        {isCreditCustomer
          ? "Sales up to this limit can be billed on credit; raise or lower it later from the Credit page."
          : "The account is created without a credit line — it can still be billed cash or prepaid, and credit can be enabled later."}
      </p>

      {error && (
        <div role="alert" className="animate-fade-in flex items-center gap-2 rounded-lg border border-error/30 bg-error/8 px-3 py-2.5 text-[12.5px] text-error">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <PrimaryButton type="submit" disabled={pending} className="h-8.5 px-6 text-xs font-semibold shadow-xs">
          {pending ? "Saving…" : "Create Customer"}
        </PrimaryButton>
        <Link href="/customers/credit">
          <GhostButton type="button" className="h-8.5 px-4 text-xs font-semibold">
            Cancel
          </GhostButton>
        </Link>
      </div>
    </form>
  );
}
