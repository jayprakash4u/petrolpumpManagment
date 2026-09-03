"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Edit3,
  KeyRound,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  User,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
  Users,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  History,
  HardDrive,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { setStationSuspendedAction } from "@/lib/actions/platform";
import { formatStationId } from "@/lib/tenant";
import { fmtRs } from "@/lib/money";

type DetailTab = "OVERVIEW" | "DETAILS" | "ACCOUNT" | "SUBSCRIPTION" | "ACTIVITY";

interface StationDetailFullPageProps {
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
    panNo?: string | null;
    vatNo?: string | null;
    dealerCode?: string | null;
    logoUrl?: string | null;
    tanks: Array<{
      id: string;
      fuel: string;
      capacityL: number;
      levelL: number;
      openingL: number;
      ratePerL: number;
      lowStockPct: number;
    }>;
    users: Array<{
      id: string;
      name: string;
      username: string;
      role: string;
      employeeId?: string | null;
      active: boolean;
      createdAt: Date;
      phone?: string | null;
      email?: string | null;
    }>;
  } | null;
  stats?: {
    tanksCount: number;
    staffCount: number;
    salesCount: number;
    customersCount: number;
  };
}

export function StationDetailFullPageView({
  slug,
  tenant,
  station,
  stats,
}: StationDetailFullPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<DetailTab>("OVERVIEW");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const ownerUser = station?.users.find((u) => u.role === "OWNER") || station?.users[0] || {
    id: "owner-1",
    name: "Ram Thapa",
    username: "abc_pump",
    phone: tenant.phone || "9851029384",
    email: tenant.email || "admin@abcpump.com",
    active: true,
  };

  const isSuspended = tenant.status === "SUSPENDED";

  const handleToggleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    const willSuspend = !isSuspended;

    const formData = new FormData();
    formData.append("stationId", tenant.id);
    formData.append("suspend", willSuspend ? "true" : "false");
    formData.append("reason", suspendReason || (willSuspend ? "Suspended by platform administrator" : "Restored by platform administrator"));

    startTransition(async () => {
      const res = await setStationSuspendedAction({}, formData);
      setShowSuspendDialog(false);
      if (res.error) {
        setActionNotice(`Error: ${res.error}`);
      } else {
        setActionNotice(res.message || (willSuspend ? `${tenant.name} suspended.` : `${tenant.name} restored.`));
        router.refresh();
      }
      setTimeout(() => setActionNotice(null), 4000);
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Top Navigation Bar: ← Back to Stations */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/stations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to Stations</span>
        </Link>
      </div>

      {actionNotice && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success font-medium">
          <CheckCircle2 size={16} /> {actionNotice}
        </div>
      )}

      {/* 2. Station Header Banner */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-2xs">
              {station?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={station.logoUrl} alt={tenant.name} className="h-full w-full object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/15 text-accent font-bold text-lg">
                  {tenant.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-[22px] font-bold text-text">
                  {tenant.name}
                </h1>
                <Badge tone={isSuspended ? "error" : "success"}>
                  {isSuspended ? "SUSPENDED" : "ACTIVE"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-1 text-text">
                  <MapPin size={13} className="text-accent" />
                  <span>{tenant.address || "Kathmandu"}</span>
                </div>
                <span>·</span>
                <span className="font-mono text-text font-semibold">
                  Station ID: {formatStationId(tenant.id)}
                </span>
                <span>·</span>
                <span className="font-mono text-accent font-bold">
                  Station Code: {tenant.slug.toUpperCase()}
                </span>
                <span>·</span>
                <span className="font-mono text-text-muted">
                  Tenant Key: [{tenant.databaseName || tenant.slug}]
                </span>
              </div>
            </div>
          </div>

          {/* Top Page Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/stations/${slug}/edit`}>
              <GhostButton className="text-xs">
                <Edit3 size={13} /> Edit Station
              </GhostButton>
            </Link>

            <Link href={`/admin/stations/${slug}/password`}>
              <GhostButton className="text-xs">
                <KeyRound size={13} /> Change Password
              </GhostButton>
            </Link>

            <GhostButton
              onClick={() => {
                setSuspendReason("");
                setShowSuspendDialog(true);
              }}
              className={clsx(
                "text-xs",
                isSuspended
                  ? "text-success border-success/40 hover:bg-success/10"
                  : "text-error border-error/40 hover:bg-error/10"
              )}
            >
              {isSuspended ? (
                <>
                  <PlayCircle size={13} /> Activate
                </>
              ) : (
                <>
                  <PauseCircle size={13} /> Deactivate
                </>
              )}
            </GhostButton>

            <a
              href={`/api/admin/impersonate?slug=${slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent px-3.5 py-2 text-xs font-bold text-[#1A1306] hover:bg-accent/90 transition-all shadow-xs"
              title="Login as Station Admin to help client troubleshoot"
            >
              <ExternalLink size={13} /> Login as Station Admin
            </a>
          </div>
        </div>

        {/* 3. Navigation Tabs: Overview | Details | Account | Subscription | Activity */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {[
            { key: "OVERVIEW", label: "Overview" },
            { key: "DETAILS", label: "Details" },
            { key: "ACCOUNT", label: "Account" },
            { key: "SUBSCRIPTION", label: "Subscription" },
            { key: "ACTIVITY", label: "Activity" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as DetailTab)}
              className={clsx(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                activeTab === key
                  ? "bg-accent text-[#1A1306] shadow-xs"
                  : "border border-border bg-surface-hi text-text hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW                                                           */}
      {/* ========================================================================= */}
      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 animate-fade-in">
          {/* Owner Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="font-display text-[15px] font-bold text-text flex items-center gap-2">
                <User size={16} className="text-accent" /> Owner Information
              </div>
              <Link
                href={`/admin/stations/${slug}/password`}
                className="text-[11.5px] text-accent hover:underline font-bold"
              >
                Change Credentials &rarr;
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Owner Name:</span>
                <span className="font-bold text-text">{ownerUser.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Phone:</span>
                <span className="font-mono text-text">{ownerUser.phone || tenant.phone || "9851029384"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Email:</span>
                <span className="text-text">{ownerUser.email || tenant.email || "admin@abcpump.com"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Username:</span>
                <span className="font-mono font-bold text-accent">@{ownerUser.username}</span>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="font-display text-[15px] font-bold text-text flex items-center gap-2">
                <CreditCard size={16} className="text-accent" /> SaaS Subscription
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("SUBSCRIPTION")}
                className="text-[11.5px] text-accent hover:underline font-bold cursor-pointer"
              >
                Manage License &rarr;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Plan:</span>
                <span className="font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  Professional Plan
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Status:</span>
                <span className="font-bold text-success">Active (24 days remaining)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Expires:</span>
                <span className="font-mono font-bold text-text">28 Sep 2026</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Monthly Rate:</span>
                <span className="font-mono font-bold text-accent font-data">Rs. 4,000 / month</span>
              </div>
            </div>
          </div>

          {/* Station Information Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="font-display text-[15px] font-bold text-text flex items-center gap-2">
                <Building2 size={16} className="text-accent" /> Station Information
              </div>
              <Link
                href={`/admin/stations/${slug}/edit`}
                className="text-[11.5px] text-accent hover:underline font-bold"
              >
                Edit &rarr;
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Station ID:</span>
                <span className="font-mono font-bold text-text">{formatStationId(tenant.id)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Station Code:</span>
                <span className="font-mono font-bold text-accent">{tenant.slug.toUpperCase()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Address:</span>
                <span className="font-bold text-text">{tenant.address || "Kathmandu"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">License / PAN:</span>
                <span className="font-mono text-text">{station?.panNo || "300066034"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Created Date:</span>
                <span className="font-mono text-text">03 Sep 2026</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Tenant Key:</span>
                <span className="font-mono text-accent font-bold">[{tenant.databaseName || tenant.slug}]</span>
              </div>
            </div>
          </div>

          {/* Activity Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="font-display text-[15px] font-bold text-text flex items-center gap-2">
                <History size={16} className="text-accent" /> Platform Status & Access
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVITY")}
                className="text-[11.5px] text-accent hover:underline font-bold cursor-pointer"
              >
                View Audit Trail &rarr;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Last Station Login:</span>
                <span className="font-bold text-text">Today, 10:42 AM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Active Staff User Accounts:</span>
                <span className="font-bold text-text font-data">{stats?.staffCount || station?.users.length || 6} Users</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-text-muted">Tenant Routing Partition:</span>
                <span className="font-mono text-accent font-bold">[{tenant.databaseName || tenant.slug}]</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Account Access Plane:</span>
                <span className="font-bold text-success font-data">Forecourt Portal Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETAILS (FULL STATION PROFILE & COMPLIANCE)                        */}
      {/* ========================================================================= */}
      {activeTab === "DETAILS" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-display text-[16px] font-bold text-text">
                Station Business Profile & Legal Compliance
              </h2>
              <p className="text-xs text-text-muted">
                Official business identity, PAN/VAT credentials, contact information, and tenant routing key.
              </p>
            </div>

            <Link href={`/admin/stations/${slug}/edit`}>
              <PrimaryButton className="text-xs">
                <Edit3 size={13} /> Edit Details
              </PrimaryButton>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <span className="font-bold text-accent uppercase tracking-wider text-[11px] block font-data">
                Business & Legal Identity
              </span>
              <div className="space-y-1.5 pt-1">
                <div><span className="text-text-muted">Station ID: </span><span className="font-mono font-bold text-text">{formatStationId(tenant.id)}</span></div>
                <div><span className="text-text-muted">Station Code: </span><span className="font-mono font-bold text-accent">{tenant.slug.toUpperCase()}</span></div>
                <div><span className="text-text-muted">Station Display Name: </span><strong className="text-text">{tenant.name}</strong></div>
                <div><span className="text-text-muted">Registered Legal Entity: </span><span className="text-text">{tenant.companyName || `${tenant.name} Pvt. Ltd.`}</span></div>
                <div><span className="text-text-muted">Physical Address: </span><span className="text-text">{tenant.address}</span></div>
                <div><span className="text-text-muted">Official Phone: </span><span className="text-text font-mono">{tenant.phone || "9851029384"}</span></div>
                <div><span className="text-text-muted">Official Email: </span><span className="text-text">{tenant.email || "accounts@station.com"}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <span className="font-bold text-accent uppercase tracking-wider text-[11px] block font-data">
                Tax Registration & SaaS Partition
              </span>
              <div className="space-y-1.5 pt-1">
                <div><span className="text-text-muted">PAN Number: </span><strong className="font-mono text-text">{station?.panNo || "300066034"}</strong></div>
                <div><span className="text-text-muted">VAT Registration: </span><span className="font-mono text-text">{station?.vatNo || station?.panNo || "300066034"}</span></div>
                <div><span className="text-text-muted">NOC Dealer Code: </span><span className="font-mono text-text">{station?.dealerCode || "NOC-KTM-012"}</span></div>
                <div><span className="text-text-muted">Tenant Key: </span><span className="font-mono font-bold text-accent">[{tenant.databaseName || tenant.slug}]</span></div>
                <div><span className="text-text-muted">SaaS Data Isolation: </span><span className="text-success font-medium">Multi-Tenant Scoped</span></div>
                <div><span className="text-text-muted">Account Created: </span><span className="font-mono text-text">{new Date(tenant.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACCOUNT (OWNER ACCOUNT MANAGEMENT)                                */}
      {/* ========================================================================= */}
      {activeTab === "ACCOUNT" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-display text-[16px] font-bold text-text">
                Station Admin Owner Account
              </h2>
              <p className="text-xs text-text-muted">
                Manage owner username, email, active status, and password reset.
              </p>
            </div>

            <Link href={`/admin/stations/${slug}/password`}>
              <PrimaryButton className="text-xs">
                <KeyRound size={13} /> Change Password
              </PrimaryButton>
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-bg p-5 space-y-4 max-w-xl text-xs">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-muted">Account Name:</span>
              <strong className="text-text">{ownerUser.name}</strong>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-muted">Login Username:</span>
              <span className="font-mono font-bold text-accent">@{ownerUser.username}</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-muted">Login Email:</span>
              <span className="text-text">{ownerUser.email || tenant.email || "admin@abcpump.com"}</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-muted">Phone Number:</span>
              <span className="font-mono text-text">{ownerUser.phone || tenant.phone || "9851029384"}</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-text-muted">Account Status:</span>
              <Badge tone={ownerUser.active ? "success" : "error"}>
                {ownerUser.active ? "ACTIVE" : "SUSPENDED"}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUBSCRIPTION                                                      */}
      {/* ========================================================================= */}
      {activeTab === "SUBSCRIPTION" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text">
              Subscription & SaaS Licensing
            </h2>
            <p className="text-xs text-text-muted">
              Current plan entitlements, validity period, and license renewal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-2">
              <span className="text-text-muted">Active Package:</span>
              <div className="font-display text-lg font-bold text-accent">Professional Plan</div>
              <div className="text-[11px] text-text-muted">Up to 6 Tanks · 10 Staff Users · IRD Sync</div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <span className="text-text-muted">Monthly Rate:</span>
              <div className="font-display text-lg font-bold text-text font-data">Rs. 4,000 / mo</div>
              <div className="text-[11px] text-text-muted">Billed yearly with 15% tenure discount</div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <span className="text-text-muted">Validity Expiration:</span>
              <div className="font-display text-lg font-bold text-success">28 Sep 2026</div>
              <div className="text-[11px] text-text-muted">24 days remaining in current cycle</div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-hi p-4 text-xs">
            <div>
              <div className="font-bold text-text">Renew or Upgrade Subscription</div>
              <div className="text-text-muted">Extend license duration or upgrade to Enterprise for unlimited tanks.</div>
            </div>
            <Link href="/admin/subscriptions">
              <PrimaryButton className="text-xs">
                Manage Plans & Billing &rarr;
              </PrimaryButton>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ACTIVITY (AUDIT LOGS)                                             */}
      {/* ========================================================================= */}
      {activeTab === "ACTIVITY" && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4 animate-fade-in">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text">
              Platform Audit Trail & Security Logs
            </h2>
            <p className="text-xs text-text-muted">
              Record of administrative events, support impersonations, and credential changes.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                action: "Company Admin Logged in as Station Admin (Support Mode)",
                actor: "@operator (Super Admin)",
                time: "Today, 03:45 PM",
                badge: "IMPERSONATION",
              },
              {
                action: "Station Admin password reset by platform administrator",
                actor: "@operator (Super Admin)",
                time: "2083-05-06 14:10",
                badge: "SECURITY",
              },
              {
                action: "Station database partition [FuelStation_abc_petrol] provisioned",
                actor: "System Provisioner",
                time: "2082-10-15 09:30",
                badge: "INITIALIZE",
              },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-bg p-3.5">
                <div className="space-y-1">
                  <div className="font-bold text-text">{log.action}</div>
                  <div className="text-text-muted text-[11px]">Actor: {log.actor}</div>
                </div>
                <div className="text-right space-y-1">
                  <Badge tone="accent">{log.badge}</Badge>
                  <div className="font-mono text-[10.5px] text-text-muted">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MINOR CONFIRMATION DIALOG: DEACTIVATE / ACTIVATE STATION                  */}
      {/* ========================================================================= */}
      {showSuspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleToggleSuspend}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text">
                {isSuspended ? `Activate ${tenant.name}?` : `Deactivate ${tenant.name}?`}
              </h3>
              <p className="text-xs text-text-muted">
                {isSuspended
                  ? "This will restore forecourt access and allow staff to sign in."
                  : "This will temporarily pause staff access and sales billing for this station."}
              </p>
            </div>

            {!isSuspended && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-text block">Reason for Deactivation</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Subscription payment overdue"
                  required
                  className="w-full rounded-xl border border-border bg-bg p-2.5 text-xs text-text"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <GhostButton type="button" onClick={() => setShowSuspendDialog(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton
                type="submit"
                disabled={isPending}
                className={isSuspended ? "" : "bg-error text-white hover:bg-error/90"}
              >
                {isSuspended ? "Confirm Activation" : "Confirm Deactivation"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
