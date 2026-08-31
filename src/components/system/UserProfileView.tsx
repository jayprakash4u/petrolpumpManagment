"use client";

import { useActionState, useState } from "react";
import {
  UserCog,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Save,
  Laptop,
} from "lucide-react";
import { updateOwnProfileAction, type OwnProfileState } from "@/lib/actions/auth";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABEL, type Role } from "@/lib/permissions";
import { fmtBSLong } from "@/lib/bs-date";

const initialState: OwnProfileState = {};

export function UserProfileView({
  userName,
  userRole,
  userEmail,
  userPhone,
  employeeId,
  joinedAt,
  stationName,
  stationAddress,
  currentSession,
}: {
  userName: string;
  userRole: string;
  userEmail: string | null;
  userPhone: string | null;
  employeeId: string | null;
  /** ISO string — Decimal/Date instances can't cross the Server -> Client boundary, so the page formats it as a string first. */
  joinedAt: string;
  stationName: string;
  stationAddress: string;
  currentSession: {
    userAgent: string | null;
    ipAddress: string | null;
    startedAt: string;
  };
}) {
  const [state, action, pending] = useActionState(updateOwnProfileAction, initialState);

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail ?? "");
  const [phone, setPhone] = useState(userPhone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <form action={action} className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <UserCog size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              User Profile & Security (प्रयोगकर्ता प्रोफाइल र सुरक्षा)
            </h2>
            <p className="text-[12px] text-text-muted">
              Your account details and password — changes here apply only to your own account.
            </p>
          </div>
        </div>

        <PrimaryButton type="submit" disabled={pending} className="text-[13px] px-4 py-2">
          <Save size={15} /> {pending ? "Saving…" : "Save Profile"}
        </PrimaryButton>
      </div>

      {state.message && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> {state.message}
        </div>
      )}
      {state.error && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-[13px] text-error font-medium">
          <AlertCircle size={16} /> {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Account Profile Details */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-accent" />
              <h3 className="font-display text-[15px] font-bold text-text">Account Details</h3>
            </div>
            <Badge tone="accent">{ROLE_LABEL[userRole as Role] ?? userRole}</Badge>
          </div>

          <Field label="Full Name" htmlFor="profName">
            <Input id="profName" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>

          <Field label="Contact Email" htmlFor="profEmail">
            <Input
              id="profEmail"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Mobile Number" htmlFor="profPhone">
            <Input
              id="profPhone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98XXXXXXXX"
            />
          </Field>

          {employeeId && (
            <p className="text-[12px] text-text-muted">
              Employee ID: <span className="font-mono font-semibold text-text">{employeeId}</span>
            </p>
          )}
        </div>

        {/* 2. Password & Security Credentials */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <KeyRound size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">Change Password</h3>
          </div>

          <p className="text-[12px] text-text-muted">Leave both fields blank to keep your current password.</p>

          <Field label="Current Password" htmlFor="currPass">
            <div className="relative">
              <Input
                id="currPass"
                name="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.25 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <Field label="New Password (min 8 characters)" htmlFor="newPass">
            <div className="relative">
              <Input
                id="newPass"
                name="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.25 top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <p className="text-[11px] text-text-muted">
            Changing your password signs you out on every other device — this one stays signed in.
          </p>
        </div>

        {/* 3. Assigned Station */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">Assigned Station</h3>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Station Name:</span>
              <strong className="text-text text-right">{stationName}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Address:</span>
              <span className="text-text text-right">{stationAddress}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Your Role:</span>
              <span className="text-text">{ROLE_LABEL[userRole as Role] ?? userRole}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-text-muted">Joined:</span>
              <span className="text-text">{fmtBSLong(new Date(joinedAt))}</span>
            </div>
          </div>
        </div>

        {/* 4. Current Session */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Laptop size={18} className="text-success" />
            <h3 className="font-display text-[15px] font-bold text-text">This Sign-in</h3>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <div className="min-w-0">
                <div className="truncate font-semibold text-text">
                  {currentSession.userAgent || "Unknown device"}
                </div>
                <div className="text-[11px] text-text-muted">
                  {currentSession.ipAddress ? `IP: ${currentSession.ipAddress}` : "IP not recorded"}
                </div>
              </div>
              <Badge tone="success">THIS DEVICE</Badge>
            </div>
            <div className="text-[11.5px] text-text-muted">
              Signed in since {fmtBSLong(new Date(currentSession.startedAt))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
