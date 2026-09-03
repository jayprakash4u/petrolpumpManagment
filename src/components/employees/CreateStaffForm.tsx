"use client";

import { useActionState } from "react";
import { UserPlus, ShieldCheck, CheckCircle2 } from "lucide-react";
import { createUserAction, type UserFormState } from "@/lib/actions/users";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: UserFormState = {};

/**
 * There is one role — Pump Admin, full access — so this form has nothing
 * to choose beyond identity and login credentials. It used to also let you
 * pick a job-title role and customize a granular permission checklist per
 * employee; both are gone now that every login has identical access.
 */
export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="role" value="OWNER" />

      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h3 className="font-display text-[14.5px] font-bold text-text">Employee Details</h3>
          <p className="text-[12px] text-text-muted">General employee profile and login identity</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name *" htmlFor="staffName">
            <Input id="staffName" name="name" required autoComplete="off" placeholder="e.g. Ramesh Thapa" />
          </Field>
          <Field label="Username (Login ID) *" htmlFor="staffUsername">
            <Input id="staffUsername" name="username" required autoComplete="off" placeholder="e.g. ramesh" />
          </Field>
          <Field label="Phone (Mobile)" htmlFor="staffPhone">
            <Input id="staffPhone" name="phone" inputMode="tel" placeholder="e.g. 98410 22310" />
          </Field>
          <Field label="Employee ID" htmlFor="staffEmpId">
            <Input id="staffEmpId" name="employeeId" placeholder="e.g. EMP-014" />
          </Field>
          <Field label="Email (Optional)" htmlFor="staffEmail">
            <Input id="staffEmail" name="email" type="email" placeholder="Contact only — not used to sign in" />
          </Field>
          <Field label="Temporary Password *" htmlFor="staffPassword">
            <Input
              id="staffPassword"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <h4 className="font-display text-[13.5px] font-bold text-text">Pump Admin — Full Access</h4>
          <p className="mt-1 text-[12.5px] text-text-muted">
            This account will have complete access to this station — sales, forecourt, stock, pricing, expenses,
            reports, and staff — the same as every other login. There's nothing further to configure.
          </p>
        </div>
      </div>

      {state.error && (
        <div role="alert" className="animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3.5 text-[13px] text-error">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {state.message && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success">
          <CheckCircle2 size={16} className="shrink-0" />
          <span><strong>Success!</strong> {state.message}</span>
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending} className="w-full py-3.5 text-[14.5px]">
        <UserPlus size={16} />
        {pending ? "Creating Staff Account..." : "Create Staff Account"}
      </PrimaryButton>
    </form>
  );
}
