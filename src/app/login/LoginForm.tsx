"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Fuel, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const initialState: LoginState = {};

export function LoginForm({ defaultStation = "shree-petroleum" }: { defaultStation?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [station, setStation] = useState(defaultStation);
  const [username, setUsername] = useState("prakash");
  const [password, setPassword] = useState("password123");

  const fillDemoUser = (user: string) => {
    setStation("shree-petroleum");
    setUsername(user);
    setPassword("password123");
  };

  return (
    <div className="w-full max-w-[400px] animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-lg shadow-accent/20">
          <Fuel size={28} color="#1A1306" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">Shree Petroleum</h1>
          <p className="font-data text-xs tracking-wider text-text-muted uppercase">Station Operator Console</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <Field label="Station Code" htmlFor="station">
          <Input
            id="station"
            name="station"
            autoComplete="organization"
            autoFocus
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="shree-petroleum"
            required
          />
        </Field>

        <Field label="Operator Username" htmlFor="username">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. prakash, anita, sita"
            required
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-[9px] top-1/2 -translate-y-1/2 cursor-pointer text-text-muted transition-colors hover:text-text"
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
              <span className="font-bold">Sign-in Failed:</span> {state.error}
            </div>
          </div>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-2 w-full py-3 text-[14.5px] font-bold">
          {pending ? "Signing in…" : "Sign In to Station Panel"}
        </PrimaryButton>

        {/* 1-Click Demo Login Box */}
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border/80 bg-surface-hi p-3">
          <div className="flex flex-col text-left">
            <span className="text-[11.5px] font-semibold text-text">Demo Credentials:</span>
            <span className="font-data text-[11px] text-text-muted">
              Station: <strong className="text-text">shree-petroleum</strong> · User: <strong className="text-text">prakash</strong>
            </span>
          </div>
          <GhostButton
            type="button"
            onClick={() => fillDemoUser("prakash")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] font-semibold text-accent hover:bg-accent/10"
          >
            <Sparkles size={12} />
            Auto Fill
          </GhostButton>
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-text-muted">
        Are you a platform Super Admin? Sign in at{" "}
        <a href="/admin/login" className="font-semibold text-accent hover:underline">
          /admin/login
        </a>
        .
      </p>
    </div>
  );
}
