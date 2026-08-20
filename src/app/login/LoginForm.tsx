"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Fuel, Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

const initialState: LoginState = {};

export function LoginForm({ defaultStation = "" }: { defaultStation?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[380px] animate-fade-in">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
          <Fuel size={24} color="#1A1306" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text">Shree Petroleum</h1>
          <p className="font-data text-xs tracking-wide text-text-muted">STATION CONTROL</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        {/*
          Staff identify themselves as (station, username) — usernames are unique
          per pump, not globally, so the station code is what says which
          tenant this login belongs to.
        */}
        <Field label="Station code" htmlFor="station">
          <Input
            id="station"
            name="station"
            autoComplete="organization"
            autoFocus
            defaultValue={defaultStation}
            aria-describedby="station-hint"
            placeholder="shree-petroleum"
          />
        </Field>
        <p id="station-hint" className="-mt-2 text-[11.5px] text-text-muted">
          The code your station was given — usually hyphenated, e.g. <span className="font-data">shree-petroleum</span>.
        </p>
        <Field label="Username" htmlFor="username">
          {/*
            Not autoComplete="username": this field used to hold an email, so
            browsers with a saved credential offer that old address here and
            the sign-in fails for a reason nobody can see. A distinct token
            keeps the browser from filling a value that can no longer work.
          */}
          <Input id="username" name="username" autoComplete="off" placeholder="ramesh" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pr-10"
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
          <div className="animate-fade-in rounded-lg border border-error/30 bg-error/8 px-[11px] py-2 text-[12.5px] text-error">
            {state.error}
          </div>
        )}

        <PrimaryButton type="submit" disabled={pending} className="mt-1 w-full py-3 text-[14.5px]">
          {pending ? "Signing in…" : "Sign In"}
        </PrimaryButton>
      </form>

      <p className="mt-5 text-center text-xs text-text-muted">
        Demo station code <span className="font-data text-text">shree-petroleum</span> · password <span className="font-data text-text">password123</span> · owner@shreepetroleum.test ·
        manager@shreepetroleum.test · cashier@shreepetroleum.test · ramesh@shreepetroleum.test
      </p>
    </div>
  );
}
