"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Fuel,
  Users,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Check,
  Copy,
  Edit3,
  Phone,
  Mail,
  MapPin,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
} from "lucide-react";
import {
  updateStationProfileAdminAction,
  updateStationAdminCredentialsAction,
  type UpdateStationProfileState,
  type StationAdminCredentialState,
} from "@/lib/actions/platform";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SuspendControl } from "@/components/admin/AdminForms";
import { fmtBSLong } from "@/lib/bs-date";

interface StationManageProps {
  slug: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    companyName: string | null;
    address: string;
    phone: string | null;
    email: string | null;
    databaseName: string;
    databaseServer: string;
    status: string;
    createdAt: Date;
    suspendedAt: Date | null;
    suspendedReason: string | null;
  };
  station: {
    id: string;
    name: string;
    companyName: string | null;
    address: string;
    phone: string | null;
    email: string | null;
    tanks: Array<{
      id: string;
      fuel: string;
      capacityL: any;
      levelL: any;
      ratePerL: any;
    }>;
    users: Array<{
      id: string;
      name: string;
      username: string;
      role: string;
      employeeId: string | null;
      active: boolean;
      createdAt: Date;
      onShift: boolean;
      phone: string | null;
      email: string | null;
    }>;
  } | null;
  stats: {
    tanksCount: number;
    staffCount: number;
    salesCount: number;
    customersCount: number;
  };
}

export function StationManageView({ slug, tenant, station, stats }: StationManageProps) {
  // Station Profile Edit State
  const [profileState, profileAction, profilePending] = useActionState(
    updateStationProfileAdminAction,
    {} as UpdateStationProfileState
  );

  // User Credential Edit State
  const [credState, credAction, credPending] = useActionState(
    updateStationAdminCredentialsAction,
    {} as StationAdminCredentialState
  );

  // Active selected user for credential reset
  const [selectedUser, setSelectedUser] = useState<StationManageProps["station"] extends null ? any : NonNullable<StationManageProps["station"]>["users"][number] | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleGenerateKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  const handleCopyCredentials = (uname: string, pass: string) => {
    const text = `Station Code: ${slug}\nUsername: ${uname}\nPassword: ${pass}\nPortal: ${window.location.origin}/login?station=${slug}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const isSuspended = tenant.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg hover:bg-surface-hi transition-colors text-text-muted hover:text-text"
            title="Back to Stations Directory"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-[18px] font-bold text-text">
                {tenant.name}
              </h2>
              <span className="font-mono rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                {tenant.slug}
              </span>
              <Badge tone={isSuspended ? "error" : "success"}>
                {tenant.status}
              </Badge>
            </div>
            <p className="text-[12px] text-text-muted">
              Dedicated Database: <code className="font-mono text-emerald-400 font-bold">[{tenant.databaseName}]</code> on <code className="font-mono text-text">{tenant.databaseServer}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/login?station=${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-all"
          >
            <ExternalLink size={13} /> Open Station Portal
          </a>
          <SuspendControl
            stationId={tenant.id}
            name={tenant.name}
            suspended={isSuspended}
          />
        </div>
      </div>

      {/* 2. Overview Metric Badges */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Fuel size={14} className="text-accent" /> Fuel Tanks
          </div>
          <div className="font-display text-xl font-bold text-text">
            {stats.tanksCount} Tanks
          </div>
          <div className="text-[11px] text-text-muted">
            {station?.tanks.map((t) => t.fuel).join(", ") || "No tanks initialized"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Users size={14} className="text-accent" /> Registered Staff
          </div>
          <div className="font-display text-xl font-bold text-text">
            {stats.staffCount} Staff Accounts
          </div>
          <div className="text-[11px] text-text-muted">
            {station?.users.filter((u) => u.role === "OWNER").length || 1} Station Admin(s)
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <HardDrive size={14} className="text-emerald-400" /> Invoices Billed
          </div>
          <div className="font-display text-xl font-bold text-text">
            {stats.salesCount.toLocaleString("en-IN")} Sales
          </div>
          <div className="text-[11px] text-text-muted">
            {stats.customersCount} Credit Accounts
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock size={14} className="text-accent" /> Station Registered
          </div>
          <div className="font-display text-sm font-bold text-text">
            {fmtBSLong(tenant.createdAt)}
          </div>
          <div className="text-[11px] text-text-muted">
            Physical SQL Isolation Active
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Edit Station Profile & Staff Credential Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Edit Station Profile & Database Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Edit Station Profile & Database (पम्प विवरण सम्पादन)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-text-muted">Super Admin Control</span>
            </div>

            {profileState?.message && (
              <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success font-medium">
                <CheckCircle2 size={16} /> {profileState.message}
              </div>
            )}
            {profileState?.error && (
              <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-medium">
                <AlertCircle size={16} /> {profileState.error}
              </div>
            )}

            <form action={profileAction} className="space-y-4">
              <input type="hidden" name="slug" value={slug} />

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Station / Pump Name" htmlFor="pName">
                  <Input
                    id="pName"
                    name="name"
                    defaultValue={tenant.name}
                    placeholder="e.g. Shree Petroleum"
                    required
                  />
                </Field>

                <Field label="Owner / Company Name (Optional)" htmlFor="pComp">
                  <Input
                    id="pComp"
                    name="companyName"
                    defaultValue={tenant.companyName || ""}
                    placeholder="e.g. Shree Energy Pvt. Ltd."
                  />
                </Field>

                <Field label="Contact Phone" htmlFor="pPhone">
                  <Input
                    id="pPhone"
                    name="phone"
                    defaultValue={tenant.phone || ""}
                    placeholder="e.g. 9851000000"
                  />
                </Field>

                <Field label="Official Email" htmlFor="pEmail">
                  <Input
                    id="pEmail"
                    name="email"
                    type="email"
                    defaultValue={tenant.email || ""}
                    placeholder="e.g. info@station.com"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Physical Address" htmlFor="pAddress">
                    <Input
                      id="pAddress"
                      name="address"
                      defaultValue={tenant.address}
                      placeholder="Station Location"
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Dedicated Database Name */}
              <div className="rounded-xl border border-border/80 bg-surface-hi p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold text-text">Dedicated Database Connection</span>
                </div>
                <Field label="SQL Server Database Name" htmlFor="pDb">
                  <Input
                    id="pDb"
                    name="databaseName"
                    defaultValue={tenant.databaseName}
                    placeholder="FuelStation_station"
                    required
                  />
                </Field>
                <p className="text-[11px] text-text-muted">
                  Changing the database name will update the tenant routing in Master DB.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <PrimaryButton type="submit" disabled={profilePending} className="px-5 py-2.5 text-xs font-bold">
                  {profilePending ? "Saving Station Profile…" : "Save Station Changes"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Staff Accounts & Password Reset (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Staff & Admin Accounts (कर्मचारी खाता तथा पासवर्ड)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-text-muted">
                {station?.users.length || 0} Accounts
              </span>
            </div>

            {credState?.message && (
              <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success font-medium">
                <CheckCircle2 size={16} /> {credState.message}
              </div>
            )}
            {credState?.error && (
              <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-medium">
                <AlertCircle size={16} /> {credState.error}
              </div>
            )}

            {/* Users Roster */}
            <div className="space-y-2.5">
              {station?.users.map((u) => {
                const isOwner = u.role === "OWNER";
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-bg p-3.5 hover:border-accent/40 transition-all"
                  >
                    <div className="space-y-0.5 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{u.name}</span>
                        <Badge tone={isOwner ? "accent" : "muted"} className="text-[10px] py-0 px-1.5">
                          {u.role}
                        </Badge>
                      </div>
                      <div className="font-mono text-[11px] text-accent font-semibold">
                        @{u.username}
                      </div>
                      {u.phone && <div className="text-[10.5px] text-text-muted">{u.phone}</div>}
                    </div>

                    <GhostButton
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setNewPassword("");
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-text hover:bg-surface-hi"
                    >
                      <KeyRound size={13} className="text-accent" />
                      Edit / Reset
                    </GhostButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Edit Credentials & Reset Password */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            action={async (formData) => {
              await credAction(formData);
              setSelectedUser(null);
            }}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="userId" value={selectedUser.id} />

            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-accent" />
                <h3 className="font-display text-[16px] font-bold text-text">
                  Manage Account: @{selectedUser.username}
                </h3>
              </div>
              <Badge tone={selectedUser.role === "OWNER" ? "accent" : "muted"}>
                {selectedUser.role}
              </Badge>
            </div>

            <p className="text-xs text-text-muted">
              Update username, full name, or directly set a new password for this user inside the dedicated station database.
            </p>

            <Field label="Staff Full Name" htmlFor="uName">
              <Input
                id="uName"
                name="name"
                defaultValue={selectedUser.name}
                required
              />
            </Field>

            <Field label="Login Username" htmlFor="uUsername">
              <Input
                id="uUsername"
                name="username"
                defaultValue={selectedUser.username}
                required
              />
            </Field>

            <Field label="Set New Password (Leave blank to keep unchanged)" htmlFor="uPassword">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="uPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-[9px] top-1/2 -translate-y-1/2 cursor-pointer text-text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <GhostButton
                    type="button"
                    onClick={handleGenerateKey}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-accent hover:bg-accent/10 py-1"
                  >
                    <Sparkles size={12} />
                    Generate Secure Key
                  </GhostButton>

                  {newPassword && (
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(selectedUser.username, newPassword)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text cursor-pointer"
                    >
                      {copiedKey ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copiedKey ? "Copied!" : "Copy Creds"}
                    </button>
                  )}
                </div>
              </div>
            </Field>

            <div>
              <label className="text-[12px] font-medium text-text-muted block mb-1">
                Account Status
              </label>
              <select
                name="active"
                defaultValue={selectedUser.active ? "true" : "false"}
                className="w-full rounded-lg border border-border bg-bg p-2 text-xs text-text"
              >
                <option value="true">Active (Can Sign In)</option>
                <option value="false">Disabled / Inactive (Blocked from Sign In)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <GhostButton type="button" onClick={() => setSelectedUser(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit" disabled={credPending}>
                {credPending ? "Saving…" : "Save New Credentials"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
