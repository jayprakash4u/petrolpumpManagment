"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  KeyRound,
  User,
  Phone,
  Mail,
  MapPin,
  Send,
  Fuel,
  Lock,
  Eye,
  EyeOff,
  Database,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import {
  onboardStationAction,
  setStationSuspendedAction,
  type OnboardState,
  type SuspendState,
} from "@/lib/actions/platform";
import { slugFromName, normalizeSlug, generateStationCode } from "@/lib/tenant";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const onboardInitial: OnboardState = {};
const suspendInitial: SuspendState = {};

/* ------------------------------------------------------------------ */

export function OnboardStationForm() {
  const [state, action, pending] = useActionState(onboardStationAction, onboardInitial);
  const [copied, setCopied] = useState(false);

  const copyInvitation = () => {
    if (state.invitationPacket?.inviteText) {
      navigator.clipboard.writeText(state.invitationPacket.inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Success Invitation & Credentials Card */}
      {state.invitationPacket && (
        <div className="animate-fade-in rounded-2xl border border-success/40 bg-success/5 p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-success/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20 text-success">
                <CheckCircle2 size={26} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-text">
                  Station Registered & Invitation Ready!
                </h3>
                <p className="text-xs text-text-muted">
                  {state.invitationPacket.stationName} has been provisioned. Send these login details to the Station Admin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyInvitation}
                className="flex items-center gap-1.5 rounded-xl bg-success px-3.5 py-2 text-xs font-bold text-[#1A1306] shadow-xs hover:bg-success/90 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                {copied ? "Copied to Clipboard!" : "Copy Invitation Packet"}
              </button>
            </div>
          </div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Station Code / Handle</span>
              <div className="font-mono text-sm font-bold text-accent">{state.invitationPacket.stationSlug}</div>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Station Admin Username</span>
              <div className="font-mono text-sm font-bold text-text">{state.invitationPacket.adminUsername}</div>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Temporary Password</span>
              <div className="font-mono text-sm font-bold text-text">{state.invitationPacket.adminPassword}</div>
            </div>

            {state.invitationPacket.databaseName && (
              <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Dedicated Database</span>
                <div className="font-mono text-xs font-bold text-emerald-400">[{state.invitationPacket.databaseName}]</div>
              </div>
            )}

            <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Station Admin Contact</span>
              <div className="text-xs text-text font-medium">
                {state.invitationPacket.adminName}
                {state.invitationPacket.adminEmail ? ` · ${state.invitationPacket.adminEmail}` : ""}
                {state.invitationPacket.adminPhone ? ` · ${state.invitationPacket.adminPhone}` : ""}
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-surface p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Station Portal Access</span>
              <div>
                <a
                  href={state.invitationPacket.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                >
                  Launch Station Login <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Invitation Text Box */}
          <div className="space-y-1.5">
            <span className="text-[11.5px] font-semibold text-text-muted">Formatted WhatsApp / SMS / Email Message:</span>
            <pre className="font-mono text-[11.5px] leading-relaxed rounded-xl border border-border/80 bg-surface-hi p-4 text-text whitespace-pre-wrap select-all">
              {state.invitationPacket.inviteText}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              href="/admin"
              className="text-xs font-semibold text-text-muted hover:text-text hover:underline"
            >
              ← Return to All Stations Directory
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              + Onboard Another Station
            </button>
          </div>
        </div>
      )}

      {/* 2. Onboarding Input Form */}
      {!state.invitationPacket && (
        <OnboardFields
          action={action}
          pending={pending}
          error={state.error}
        />
      )}
    </div>
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
  // Station Profile State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Station Code (System Generated)
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // Dedicated Database State
  const [databaseName, setDatabaseName] = useState("");
  const [dbTouched, setDbTouched] = useState(false);

  // Station Admin State
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [adminPassword, setAdminPassword] = useState("pass1234");
  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate slug, database name and username dynamically
  const effectiveSlug = slugTouched ? slug : slugFromName(name);
  const defaultDbName = effectiveSlug ? `FuelStation_${effectiveSlug.replace(/-/g, "_")}` : "";
  const effectiveDbName = dbTouched ? databaseName : defaultDbName;

  const effectiveUsername = usernameTouched
    ? adminUsername
    : adminName
    ? normalizeSlug(adminName.split(" ")[0] || "")
    : "";

  const handleRandomizeSlug = () => {
    setSlugTouched(true);
    setSlug(generateStationCode(name || "station", true));
  };

  const handleGenerateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(gen);
  };

  return (
    <form action={action} className="space-y-6">
      {/* SECTION 1: Station / Company Information */}
      <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <Fuel size={17} className="text-accent" />
          <h4 className="font-display text-sm font-bold text-text">
            1. Station / Pump Details (पम्प तथा कम्पनी विवरण)
          </h4>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Station / Pump Name" htmlFor="name">
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bagmati Petroleum Center"
              required
            />
          </Field>

          <Field label="Owner / Company Name (Optional)" htmlFor="companyName">
            <Input
              id="companyName"
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Bagmati Energy Traders Pvt. Ltd."
            />
          </Field>

          <Field label="Station Phone Number" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01-4455667 or 9801234567"
            />
          </Field>

          <Field label="Station Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@bagmatipetroleum.com"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Physical Address / Location" htmlFor="address">
              <Input
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Tribhuvan Highway, Naubise, Dhading"
                required
              />
            </Field>
          </div>
        </div>
      </div>

      {/* SECTION 2: System-Generated Station Code / ID */}
      <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-accent" />
            <h4 className="font-display text-sm font-bold text-text">
              2. Station Code / Identifier (सिस्टम कोड)
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
            System-Generated
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[220px]">
              <Input
                id="slug"
                name="slug"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(normalizeSlug(e.target.value));
                }}
                placeholder="bagmati-petroleum"
                required
              />
            </div>

            <GhostButton
              type="button"
              onClick={handleRandomizeSlug}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-text hover:bg-surface-hi"
              title="Add random numerical suffix"
            >
              <RefreshCw size={13} />
              Randomize Suffix
            </GhostButton>
          </div>

          <p className="text-[11.5px] text-text-muted">
            The unique identifier typed by staff at login (e.g.{" "}
            <span className="font-mono text-accent font-semibold">
              {effectiveSlug || "station-code"}
            </span>
            ). Staff can bookmark{" "}
            <span className="font-mono text-text">
              /login?station={effectiveSlug || "station-code"}
            </span>
            .
          </p>
        </div>
      </div>

      {/* SECTION 3: Dedicated SQL Server Database Configuration */}
      <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Database size={17} className="text-accent" />
            <h4 className="font-display text-sm font-bold text-text">
              3. Dedicated SQL Server Database Name (डाटाबेस नाम)
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
            <HardDrive size={11} /> 100% Isolated
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[240px]">
              <Field label="SQL Server Database Name" htmlFor="databaseName">
                <Input
                  id="databaseName"
                  name="databaseName"
                  value={effectiveDbName}
                  onChange={(e) => {
                    setDbTouched(true);
                    setDatabaseName(e.target.value.replace(/[^a-zA-Z0-9_]/g, "_"));
                  }}
                  placeholder="FuelStation_bagmati_petroleum"
                  required
                />
              </Field>
            </div>

            {dbTouched && (
              <div className="pt-6">
                <GhostButton
                  type="button"
                  onClick={() => {
                    setDbTouched(false);
                    setDatabaseName("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/10"
                >
                  <RefreshCw size={13} />
                  Reset to Default
                </GhostButton>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/80 bg-surface p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Target SQL Server:</span>
              <code className="font-mono font-bold text-text">localhost:1435</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Provisioning Target:</span>
              <code className="font-mono font-bold text-accent">[{effectiveDbName || "FuelStation_station"}]</code>
            </div>
          </div>

          <p className="text-[11.5px] text-text-muted">
            The dedicated Microsoft SQL Server database that will be created on the fly. All forecourt sales, tanks, customer ledgers, and staff records for this station will be physically isolated inside this database.
          </p>
        </div>
      </div>

      {/* SECTION 4: Station Admin / Initial Owner Account */}
      <div className="rounded-2xl border border-border bg-bg/50 p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <ShieldCheck size={17} className="text-accent" />
          <h4 className="font-display text-sm font-bold text-text">
            4. Station Admin Credentials (सञ्चालक / व्यवस्थापक खाता)
          </h4>
        </div>

        <p className="text-[12px] text-text-muted">
          The system will create the station account and provision the Station Admin with full station control.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Station Admin Full Name" htmlFor="ownerName">
            <Input
              id="ownerName"
              name="ownerName"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Ramesh Kumar Shrestha"
              required
            />
          </Field>

          <Field label="Admin Phone Number" htmlFor="adminPhone">
            <Input
              id="adminPhone"
              name="adminPhone"
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="e.g. 9851000000"
            />
          </Field>

          <Field label="Admin Email (For Login / Invitation)" htmlFor="adminEmail">
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="e.g. ramesh@bagmatipetroleum.com"
            />
          </Field>

          <Field label="Admin Login Username" htmlFor="ownerUsername">
            <Input
              id="ownerUsername"
              name="ownerUsername"
              value={effectiveUsername}
              onChange={(e) => {
                setUsernameTouched(true);
                setAdminUsername(normalizeSlug(e.target.value));
              }}
              placeholder="ramesh"
              required
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Temporary Password" htmlFor="ownerPassword">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Input
                    id="ownerPassword"
                    name="ownerPassword"
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-[9px] top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <GhostButton
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/10"
                >
                  <KeyRound size={13} />
                  Generate Strong Key
                </GhostButton>
              </div>
            </Field>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error font-medium"
        >
          {error}
        </div>
      )}

      {/* Primary Action Button */}
      <div className="pt-2">
        <PrimaryButton
          type="submit"
          disabled={pending}
          className="w-full py-3.5 text-[15px] font-bold shadow-lg shadow-accent/10 cursor-pointer"
        >
          <Building2 size={18} />
          {pending ? "Provisioning Station & Minting Access..." : "Create Station & Generate Invitation"}
        </PrimaryButton>
        <p className="mt-2 text-center text-xs text-text-muted">
          Once created, the system generates the access invitation packet with 1-click sharing.
        </p>
      </div>
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
