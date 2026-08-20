"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/lib/actions/platform";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: AdminLoginState = {};

/** Operator sign-in. No station code — platform accounts live above tenancy. */
export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);

  return (
    <div className="w-full max-w-[380px] animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-hi">
          <ShieldCheck size={24} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Platform Console</h1>
          <p className="font-data text-xs tracking-wide text-text-muted">OPERATOR ACCESS</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <Field label="Username" htmlFor="username">
          <Input id="username" name="username" autoComplete="username" autoFocus placeholder="operator" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" />
        </Field>

        {state?.error && (
          <div role="alert" className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-[11px] py-2 text-[12.5px] text-error">
            {state.error}
          </div>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-1 w-full py-3 text-[14.5px]">
          {pending ? "Signing in…" : "Sign In"}
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-xs text-text-muted">
        This console manages petrol pumps on the platform. Staff sign in at <span className="font-data text-text">/login</span>.
      </p>
    </div>
  );
}
