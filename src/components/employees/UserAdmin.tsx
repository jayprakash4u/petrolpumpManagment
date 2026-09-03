"use client";

import { useActionState, useState } from "react";
import { UserPlus, UserMinus, UserCheck, CheckCircle2 } from "lucide-react";
import { createUserAction, setUserActiveAction, type UserFormState } from "@/lib/actions/users";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: UserFormState = {};

export function AddEmployeeForm() {
  const [state, action, pending] = useActionState(createUserAction, initialState);

  return (
    <>
      <AddEmployeeFields key={state.message ?? "entering"} action={action} pending={pending} error={state.error} />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function AddEmployeeFields({
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
      <input type="hidden" name="role" value="OWNER" />

      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" required autoComplete="off" placeholder="Ramesh Thapa" />
      </Field>

      <Field label="Username" htmlFor="newUsername">
        <Input id="newUsername" name="username" required autoComplete="off" placeholder="ramesh" />
      </Field>

      <Field label="Phone (optional)" htmlFor="newPhone">
        <Input id="newPhone" name="phone" inputMode="tel" placeholder="98410 22310" />
      </Field>

      <Field label="Employee ID (optional)" htmlFor="newEmpId">
        <Input id="newEmpId" name="employeeId" placeholder="EMP-014" />
      </Field>

      <Field label="Email (optional)" htmlFor="newEmail">
        <Input id="newEmail" name="email" type="email" autoComplete="off" placeholder="Contact only — not used to sign in" />
      </Field>

      <Field label="Temporary password" htmlFor="newPassword">
        <Input
          id="newPassword"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </Field>

      <p className="text-[11.5px] text-text-muted">
        This account will be Pump Admin — full access to this station, same as every other login.
      </p>

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending} className="w-full py-2.5">
        <UserPlus size={15} />
        {pending ? "Adding…" : "Add Employee"}
      </PrimaryButton>
    </form>
  );
}

/** Deactivate / reactivate, shown only to a Station Admin. */
export function ActiveToggle({ userId, active, name }: { userId: string; active: boolean; name: string }) {
  const [state, action, pending] = useActionState(setUserActiveAction, initialState);
  const [confirming, setConfirming] = useState(false);

  if (active && !confirming) {
    return (
      <GhostButton type="button" tone="error" onClick={() => setConfirming(true)} className="px-2.5 py-1.5 text-[12px]">
        <UserMinus size={13} />
        Deactivate
      </GhostButton>
    );
  }

  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <div className="flex items-center gap-1.5">
        {active && <span className="text-[11.5px] text-text-muted">Sign {name.split(" ")[0]} out everywhere?</span>}
        <PrimaryButton type="submit" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          {pending ? "…" : active ? "Confirm" : "Reactivate"}
        </PrimaryButton>
        {active && (
          <GhostButton type="button" onClick={() => setConfirming(false)} className="px-2.5 py-1.5 text-[12px]">
            Cancel
          </GhostButton>
        )}
        {!active && <UserCheck size={13} className="text-success" />}
      </div>
      {state.error && <span className="max-w-[240px] text-right text-[11px] text-error">{state.error}</span>}
    </form>
  );
}
