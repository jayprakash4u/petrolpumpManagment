"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Building2, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: LoginState = {};
const isDev = process.env.NODE_ENV === "development";

export function LoginForm({
  defaultStation = "",
  redirectTo = "/dashboard",
}: {
  defaultStation?: string;
  redirectTo?: string;
}) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-95 animate-fade-in">
      <p className="font-data text-[11px] font-semibold tracking-[0.15em] text-accent uppercase">
        Fuel Nepal · Station Login
      </p>
      <h1 className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-text">Sign in</h1>
      <p className="mt-1 text-[13px] text-text-muted">
        Enter your station code and the operator credentials issued to you.
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={redirectTo} />

        <Field label="Station Code" htmlFor="station">
          <div className="relative">
            <Building2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="station"
              name="station"
              autoComplete="organization"
              autoFocus
              defaultValue={defaultStation}
              placeholder="your-station-code"
              className="pl-9"
              required
            />
          </div>
        </Field>

        <Field label="Operator Username" htmlFor="username">
          <div className="relative">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="e.g. ramesh, anita"
              className="pl-9"
              required
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-9 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.25 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition-colors hover:text-text"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {state?.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3 text-[13px] text-error font-medium"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-error" />
            <div className="flex-1">
              <span className="font-bold">Sign-in failed:</span> {state.error}
            </div>
          </div>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-1 w-full py-3 text-[14.5px] font-bold">
          {pending ? "Signing in…" : "Sign In"}
        </PrimaryButton>
      </form>

      {isDev && (
        <p className="mt-4 text-center text-[11px] text-text-muted">
          Local development: use credentials from your seed script or database setup.
        </p>
      )}
    </div>
  );
}
