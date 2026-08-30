"use client";

import { useActionState, useState } from "react";
import { ShieldCheck, AlertCircle, KeyRound, Sparkles, User } from "lucide-react";
import { adminLoginAction, type AdminLoginState } from "@/lib/actions/platform";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: AdminLoginState = {};

/** Operator sign-in for the Super Admin platform console. */
export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("SuperAdmin2026!");

  const fillDemo = () => {
    setUsername("admin");
    setPassword("SuperAdmin2026!");
  };

  return (
    <div className="w-full max-w-[420px] animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 shadow-lg shadow-accent/5">
          <ShieldCheck size={28} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">PUMP-SAAS ADMIN</h1>
          <p className="font-data text-xs tracking-wider text-text-muted uppercase">Super Admin Access Portal</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <Field label="Operator Username" htmlFor="username">
          <div className="relative">
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="admin"
              required
            />
          </div>
        </Field>

        <Field label="Access Key / Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>
        </Field>

        {state?.error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3 text-[13px] text-error font-medium"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-error" />
            <div className="flex-1">
              <span className="font-bold">Authentication Failed:</span> {state.error}
            </div>
          </div>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-2 w-full py-3 text-[14.5px] font-bold">
          {pending ? "Authenticating Session…" : "Sign In to Platform Admin"}
        </PrimaryButton>

        {/* 1-Click Demo Credentials Quick Fill */}
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border/80 bg-surface-hi p-3">
          <div className="flex flex-col text-left">
            <span className="text-[11.5px] font-semibold text-text">Super Admin Credentials:</span>
            <span className="font-data text-[11px] text-text-muted">User: <strong className="text-text">admin</strong> · Pass: <strong className="text-text">SuperAdmin2026!</strong></span>
          </div>
          <GhostButton
            type="button"
            onClick={fillDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold text-accent hover:bg-accent/10"
          >
            <Sparkles size={12} />
            Auto Fill
          </GhostButton>
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-text-muted">
        Managing single petrol pump stations? Sign in at{" "}
        <a href="/login" className="font-semibold text-accent hover:underline">
          /login
        </a>
        .
      </p>
    </div>
  );
}
