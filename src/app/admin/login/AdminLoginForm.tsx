"use client";

import { useState } from "react";
import { useActionState } from "react";
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Fuel } from "lucide-react";
import Link from "next/link";
import { adminLoginAction, type AdminLoginState } from "@/lib/actions/platform";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: AdminLoginState = {};
const isDev = process.env.NODE_ENV === "development";

/** Operator sign-in for the platform admin console. */
export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-95 animate-fade-in">
      {/* Mobile-only compact brand — desktop uses AdminBrandPanel */}
      <div className="mb-6 flex items-center gap-2.5 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
          <Fuel size={16} color="#1A1306" strokeWidth={2.5} />
        </div>
        <div>
          <p className="font-display text-[15px] font-bold tracking-tight text-text">Fuel Nepal</p>
          <p className="font-data text-[10px] tracking-[0.12em] text-text-muted uppercase">Platform Console</p>
        </div>
      </div>

      <p className="font-data text-[11px] font-semibold tracking-[0.15em] text-accent uppercase">
        Fuel Nepal · Platform Admin
      </p>
      <h1 className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-text">Operator sign in</h1>
      <p className="mt-1 text-[13px] text-text-muted">
        Use your platform operator credentials. This console is separate from station staff login.
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <Field label="Username" htmlFor="username">
          <div className="relative">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              placeholder="operator username"
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
          {pending ? "Signing in…" : "Sign In to Console"}
        </PrimaryButton>
      </form>

      {isDev && (
        <p className="mt-4 text-center text-[11px] text-text-muted">
          Local development: credentials from <code className="font-data text-[10.5px]">npm run db:setup:mssql</code>
        </p>
      )}

      <div className="mt-8 rounded-xl border border-border/80 bg-surface/60 p-4">
        <p className="text-[12.5px] font-medium text-text">Station staff?</p>
        <p className="mt-0.5 text-[12px] text-text-muted">
          Pump operators and managers sign in with their station code at the tenant portal.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:text-accent/80"
        >
          Go to station login
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
