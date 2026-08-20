"use client";

import { useActionState, useState } from "react";
import { Building2, ShieldCheck, CheckCircle2, PauseCircle, PlayCircle } from "lucide-react";
import {
  onboardStationAction,
  setStationSuspendedAction,
  type OnboardState,
  type SuspendState,
} from "@/lib/actions/platform";
import { slugFromName, normalizeSlug } from "@/lib/tenant";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const onboardInitial: OnboardState = {};
const suspendInitial: SuspendState = {};

/* ------------------------------------------------------------------ */

export function OnboardStationForm() {
  const [state, action, pending] = useActionState(onboardStationAction, onboardInitial);

  return (
    <>
      {/* Keyed on the success message so a completed onboarding clears the form — including the owner's password. */}
      <OnboardFields key={state.message ?? "entering"} action={action} pending={pending} error={state.error} />
      {state.message && (
        <div className="animate-fade-in mt-3 flex items-start gap-2 rounded-lg border border-success/30 bg-success/8 px-3 py-2 text-[12.5px] text-success">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          {state.message}
        </div>
      )}
    </>
  );
}

function OnboardFields({
  action,
  pending,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // The code follows the name until the operator edits it themselves, then
  // it stops moving under their hands.
  const effectiveSlug = slugTouched ? slug : slugFromName(name);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Station name" htmlFor="name">
        <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Everest Fuels" />
      </Field>

      <div>
        <Field label="Station code" htmlFor="slug">
          <Input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(normalizeSlug(e.target.value));
            }}
            placeholder="everest-fuels"
          />
        </Field>
        <p className="mt-1 text-[11.5px] text-text-muted">
          What staff type at sign-in. Permanent and public — pick something short they can remember.
        </p>
      </div>

      <Field label="Address" htmlFor="address">
        <Input id="address" name="address" placeholder="Ring Road, Kathmandu" />
      </Field>

      <div className="mt-1 border-t border-border pt-4">
        <p className="mb-3 text-[12px] text-text-muted">
          The first owner account. Only an owner can add more staff, so a station is unusable without one — both are
          created together or not at all.
        </p>

        <div className="flex flex-col gap-4">
          <Field label="Owner name" htmlFor="ownerName">
            <Input id="ownerName" name="ownerName" autoComplete="off" placeholder="Prakash Shrestha" />
          </Field>
          <Field label="Owner username" htmlFor="ownerUsername">
            <Input id="ownerUsername" name="ownerUsername" autoComplete="off" placeholder="prakash" />
          </Field>
          <Field label="Temporary password" htmlFor="ownerPassword">
            <Input
              id="ownerPassword"
              name="ownerPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
        </div>
      </div>

      {error && (
        <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
          {error}
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending} className="w-full py-2.5">
        <Building2 size={15} />
        {pending ? "Creating…" : "Create Station"}
      </PrimaryButton>
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function SuspendControl({
  stationId,
  name,
  suspended,
}: {
  stationId: string;
  name: string;
  suspended: boolean;
}) {
  const [state, action, pending] = useActionState(setStationSuspendedAction, suspendInitial);
  const [open, setOpen] = useState(false);

  if (suspended) {
    return (
      <form action={action} className="flex flex-col items-end gap-1">
        <input type="hidden" name="stationId" value={stationId} />
        <input type="hidden" name="suspend" value="false" />
        <GhostButton type="submit" tone="success" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          <PlayCircle size={13} />
          {pending ? "…" : "Restore"}
        </GhostButton>
        {state.error && <span className="max-w-[260px] text-right text-[11px] text-error">{state.error}</span>}
      </form>
    );
  }

  if (!open) {
    return (
      <GhostButton type="button" tone="error" onClick={() => setOpen(true)} className="px-2.5 py-1.5 text-[12px]">
        <PauseCircle size={13} />
        Suspend
      </GhostButton>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="stationId" value={stationId} />
      <input type="hidden" name="suspend" value="true" />
      <span className="text-[11.5px] text-text-muted">Signs everyone at {name} out immediately.</span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Input name="reason" autoFocus required minLength={3} placeholder="Reason" className="w-44 px-2 py-1 text-[12px]" />
        <PrimaryButton type="submit" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          {pending ? "…" : "Confirm"}
        </PrimaryButton>
        <GhostButton type="button" onClick={() => setOpen(false)} className="px-2.5 py-1.5 text-[12px]">
          Cancel
        </GhostButton>
      </div>
      {state.error && <span className="max-w-[280px] text-right text-[11px] text-error">{state.error}</span>}
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function AdminSignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <GhostButton type="submit" className="px-2.5 py-1.5 text-[12px]">
        <ShieldCheck size={13} />
        Sign out
      </GhostButton>
    </form>
  );
}
