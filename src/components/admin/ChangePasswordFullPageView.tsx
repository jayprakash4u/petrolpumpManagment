"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  User,
  Lock,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { updateStationAdminCredentialsAction } from "@/lib/actions/platform";

interface ChangePasswordFullPageProps {
  slug: string;
  tenantName: string;
  ownerUser: {
    id: string;
    name: string;
    username: string;
    email?: string | null;
    phone?: string | null;
  };
}

export function ChangePasswordFullPageView({
  slug,
  tenantName,
  ownerUser,
}: ChangePasswordFullPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successPacket, setSuccessPacket] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
    setConfirmPassword(gen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessPacket(null);

    if (newPassword.length < 6) {
      return setErrorMsg("Password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }
    if (!reason.trim()) {
      return setErrorMsg("Please provide a reason for the password change (goes to platform audit log).");
    }

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("userId", ownerUser.id);
    formData.append("name", ownerUser.name);
    formData.append("username", ownerUser.username);
    formData.append("newPassword", newPassword);
    formData.append("reason", reason);

    startTransition(async () => {
      const res = await updateStationAdminCredentialsAction({}, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        const text = `=========================================
⛽ PUMP-SAAS STATION CREDENTIALS UPDATE
=========================================
Station: ${tenantName}
Station Code: ${slug}
Username: ${ownerUser.username}
New Password: ${newPassword}
Portal Login: ${window.location.origin}/login?station=${slug}
=========================================`;
        setSuccessPacket(text);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <Link
            href={`/admin/stations/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-accent transition-colors mb-1"
          >
            <ArrowLeft size={14} /> Back to {tenantName}
          </Link>
          <h1 className="font-display text-[22px] font-bold text-text">
            Change Station Admin Password
          </h1>
          <p className="text-xs text-text-muted">
            Update credentials for the station owner account in the dedicated database.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-4 text-xs text-error font-medium">
          <AlertCircle size={17} /> {errorMsg}
        </div>
      )}

      {/* 2. Success Packet Display */}
      {successPacket ? (
        <div className="rounded-2xl border border-success/30 bg-surface p-6 shadow-xl space-y-4 animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-success font-bold text-sm">
            <CheckCircle2 size={18} /> Password Updated Successfully!
          </div>
          <p className="text-text-muted leading-relaxed">
            The owner password for <strong>{ownerUser.name}</strong> (@{ownerUser.username}) has been re-hashed in the station database. Active sessions have been invalidated for security.
          </p>

          <pre className="p-4 rounded-xl bg-bg border border-border font-mono text-[11px] text-accent overflow-x-auto whitespace-pre-wrap">
            {successPacket}
          </pre>

          <div className="flex items-center justify-between pt-2">
            <GhostButton
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(successPacket);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="text-xs"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Login Details"}</span>
            </GhostButton>

            <Link href={`/admin/stations/${slug}`}>
              <PrimaryButton className="text-xs">
                <span>Return to Station Details &rarr;</span>
              </PrimaryButton>
            </Link>
          </div>
        </div>
      ) : (
        /* 3. Change Password Form */
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5"
        >
          {/* Station & User Context Card */}
          <div className="rounded-xl border border-border bg-bg p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Target Station:</span>
              <span className="font-bold text-text">{tenantName} · <span className="font-mono text-accent">{slug.toUpperCase()}</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Account Owner:</span>
              <span className="font-bold text-text">{ownerUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Username:</span>
              <span className="font-mono font-bold text-accent">@{ownerUser.username}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text">New Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  <Sparkles size={12} /> Generate Password
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <Field label="Confirm New Password *" htmlFor="cPass">
              <Input
                id="cPass"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </Field>

            <Field label="Reason for Password Reset (Platform Audit Log) *" htmlFor="rReason">
              <Input
                id="rReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Owner requested password reset via support call"
                required
                minLength={3}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Link href={`/admin/stations/${slug}`}>
              <GhostButton type="button" className="text-xs">
                Cancel
              </GhostButton>
            </Link>

            <PrimaryButton type="submit" disabled={isPending} className="text-xs px-5 py-2.5">
              <KeyRound size={14} />
              <span>{isPending ? "Updating Password…" : "Update Password"}</span>
            </PrimaryButton>
          </div>
        </form>
      )}
    </div>
  );
}
