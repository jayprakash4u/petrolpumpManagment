"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Plus,
  LifeBuoy,
  Bell,
  CheckCircle2,
  Users,
  ChevronRight,
  Sparkles,
  Layers,
  Calendar,
  KeyRound,
  PauseCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { fmtRs } from "@/lib/money";

export interface DashboardStationItem {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  location: string;
  plan: "Basic" | "Pro" | "Enterprise";
  status: "Active" | "Trial" | "Expired" | "Suspended";
  daysRemaining: number;
  monthlyFee: number;
  registeredDate: string;
}

export interface DashboardSupportItem {
  id: string;
  ticketNo: string;
  stationName: string;
  slug: string;
  subject: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
}

export function CompanyAdminDashboardView({
  initialStations,
  overview,
}: {
  initialStations?: any[];
  overview?: any;
}) {
  const [stations] = useState<DashboardStationItem[]>(() => {
    if (initialStations && initialStations.length > 0) {
      return initialStations.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        ownerName: s.ownerName || "Station Admin",
        location: s.location || "Kathmandu",
        plan: s.plan || "Pro",
        status: s.status === "ACTIVE" ? "Active" : s.status === "SUSPENDED" ? "Suspended" : "Active",
        daysRemaining: s.subscriptionDays || 30,
        monthlyFee: s.monthlyFee || 4000,
        registeredDate: s.registeredDate || "Today",
      }));
    }
    return [
    {
      id: "1",
      name: "ABC Petrol Pump",
      slug: "abc-petrol",
      ownerName: "Ram Shrestha",
      location: "Kathmandu",
      plan: "Pro",
      status: "Active",
      daysRemaining: 25,
      monthlyFee: 4000,
      registeredDate: "2082-10-15",
    },
    {
      id: "2",
      name: "XYZ Fuel Station",
      slug: "xyz-fuel",
      ownerName: "Hari Prasad Sharma",
      location: "Lalitpur",
      plan: "Basic",
      status: "Active",
      daysRemaining: 10,
      monthlyFee: 2000,
      registeredDate: "2082-11-01",
    },
    {
      id: "3",
      name: "Highway Express Petroleum",
      slug: "highway-express",
      ownerName: "Bikram Gurung",
      location: "Pokhara",
      plan: "Enterprise",
      status: "Active",
      daysRemaining: 180,
      monthlyFee: 7000,
      registeredDate: "2082-08-20",
    },
    {
      id: "4",
      name: "Chitwan Valley Fuel Hub",
      slug: "chitwan-valley",
      ownerName: "Rajesh Adhikari",
      location: "Bharatpur",
      plan: "Pro",
      status: "Trial",
      daysRemaining: 7,
      monthlyFee: 4000,
      registeredDate: "2083-05-01",
    },
    {
      id: "5",
      name: "Eastern Oil Center",
      slug: "eastern-oil",
      ownerName: "Binod Basnet",
      location: "Biratnagar",
      plan: "Basic",
      status: "Expired",
      daysRemaining: 0,
      monthlyFee: 2000,
      registeredDate: "2082-02-10",
    },
  ];
});

  const [supportTickets] = useState<DashboardSupportItem[]>([
    {
      id: "t-1",
      ticketNo: "#1025",
      stationName: "ABC Petrol Pump",
      slug: "abc-petrol",
      subject: "Unable to add fuel delivery stock record",
      priority: "HIGH",
      status: "OPEN",
      createdAt: "15 mins ago",
    },
    {
      id: "t-2",
      ticketNo: "#1024",
      stationName: "XYZ Fuel Station",
      slug: "xyz-fuel",
      subject: "Need guidance setting up 80mm thermal printer logo",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdAt: "2 hours ago",
    },
    {
      id: "t-3",
      ticketNo: "#1023",
      stationName: "Birgunj Border Fuel",
      slug: "birgunj-fuel",
      subject: "Monthly VAT sales annexure IRD verification query",
      priority: "LOW",
      status: "OPEN",
      createdAt: "5 hours ago",
    },
  ]);

  const expiringList = stations.filter((s) => s.daysRemaining <= 30 && s.daysRemaining > 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Building2 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Company Admin SaaS Console (सफ्टवेयर कम्पनी व्यवस्थापन केन्द्र)
            </h2>
            <p className="text-[12px] text-text-muted">
              Central SaaS platform headquarters for multi-tenant fuel station licensing, subscription billing, and support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/stations/new"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[13px] font-bold text-[#1A1306] shadow-xs hover:bg-accent/90 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" /> Add New Station
          </Link>
        </div>
      </div>

      {/* 2. Key Platform KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Total Stations"
          value="128 Stations"
          icon={Building2}
          tone="accent"
        />
        <StatCard
          label="Active Stations"
          value="115 Active"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Trial Stations"
          value="8 In Trial"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Expired / Due"
          value="5 Expired"
          icon={AlertTriangle}
          tone="error"
        />
        <StatCard
          label="Monthly Revenue"
          value="Rs. 4,60,000"
          icon={DollarSign}
          tone="accent"
        />
        <StatCard
          label="Active Subscriptions"
          value="115 Licenses"
          icon={CreditCard}
          tone="success"
        />
      </div>

      {/* 3. Main Operational Panels: Recent Stations & Expiring Subscriptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Registrations & Active Stations (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Recent Station Registrations (भर्खर दर्ता भएका पम्पहरू)
                </h3>
              </div>
              <Link
                href="/admin/stations"
                className="flex items-center gap-1 text-[12px] font-bold text-accent hover:underline"
              >
                <span>View All 128 Stations</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {stations.map((st) => {
                const isExpired = st.status === "Expired";
                const isTrial = st.status === "Trial";
                return (
                  <div
                    key={st.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3.5 hover:border-accent/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-[200px] flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold text-xs">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text text-[13.5px]">
                            {st.name}
                          </span>
                          <span className="font-mono rounded bg-accent/15 px-1.5 py-0.2 text-[10px] font-bold text-accent">
                            {st.slug}
                          </span>
                          <Badge
                            tone={
                              isExpired
                                ? "error"
                                : isTrial
                                ? "warning"
                                : "success"
                            }
                          >
                            {st.status}
                          </Badge>
                        </div>
                        <div className="text-[11.5px] text-text-muted mt-0.5">
                          Owner: <strong>{st.ownerName}</strong> · Location: {st.location} · Plan: <span className="text-accent font-semibold">{st.plan}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-[11.5px]">
                        <div className="font-bold text-text font-data">
                          {st.daysRemaining} days left
                        </div>
                        <div className="text-text-muted text-[10.5px]">
                          Rs {st.monthlyFee.toLocaleString("en-IN")}/mo
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/stations/${st.slug}`}
                          className="rounded-lg border border-border bg-surface-hi px-2.5 py-1 text-[11.5px] font-semibold text-text hover:text-accent hover:border-accent/40 transition-colors"
                          title="View Station Details & Settings"
                        >
                          View Details
                        </Link>
                        <a
                          href={`/api/admin/impersonate?slug=${st.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1 text-[11.5px] font-bold text-accent hover:bg-accent/25 transition-all shadow-xs"
                          title="Login as Station Admin for customer support"
                        >
                          <ExternalLink size={12} /> Login
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SaaS Subscriptions & Plans Quick Summary */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  SaaS Pricing Plans Distribution
                </h3>
              </div>
              <Link
                href="/admin/subscriptions"
                className="flex items-center gap-1 text-[12px] font-bold text-accent hover:underline"
              >
                <span>Manage Plans</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text">Basic Plan</span>
                  <Badge tone="muted">42 Stations</Badge>
                </div>
                <div className="text-lg font-bold text-accent font-data">
                  Rs. 2,000 <span className="text-[11px] text-text-muted font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  Forecourt starter, single tank, 2 cashier accounts
                </div>
              </div>

              <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5 space-y-2 ring-1 ring-accent/20">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text">Professional</span>
                  <Badge tone="accent">68 Stations</Badge>
                </div>
                <div className="text-lg font-bold text-accent font-data">
                  Rs. 4,000 <span className="text-[11px] text-text-muted font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  IRD tax invoice sync, credit ledgers, multi-tank dip logs
                </div>
              </div>

              <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-text">Enterprise</span>
                  <Badge tone="muted">18 Stations</Badge>
                </div>
                <div className="text-lg font-bold text-accent font-data">
                  Rs. 7,000 <span className="text-[11px] text-text-muted font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  Multi-station clusters, unlimited team, API access & 24/7 SLA
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expiring Subscriptions & Support Tickets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expiring Subscriptions Alert Card */}
          <div className="rounded-2xl border border-warning/40 bg-warning/5 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-warning/20 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Expiring Subscriptions (&le; 30 Days)
                </h3>
              </div>
              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold text-warning">
                {expiringList.length} Due
              </span>
            </div>

            <div className="space-y-2.5">
              {expiringList.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-bg p-3"
                >
                  <div>
                    <div className="font-bold text-[13px] text-text">{st.name}</div>
                    <div className="text-[11px] text-text-muted">
                      Owner: {st.ownerName} · {st.location}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="rounded bg-error/15 px-2 py-0.5 text-[11px] font-bold text-error">
                      {st.daysRemaining} days left
                    </span>
                    <div>
                      <Link
                        href="/admin/payments"
                        className="text-[11px] font-bold text-accent hover:underline block"
                      >
                        Extend License &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Tickets Queue */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Customer Support Tickets
                </h3>
              </div>
              <Link
                href="/admin/support"
                className="flex items-center gap-1 text-[12px] font-bold text-accent hover:underline"
              >
                <span>Support Desk</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {supportTickets.map((tk) => (
                <div
                  key={tk.id}
                  className="rounded-xl border border-border bg-bg p-3.5 space-y-2 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent text-xs">
                        {tk.ticketNo}
                      </span>
                      <span className="font-bold text-text text-xs">
                        {tk.stationName}
                      </span>
                    </div>
                    <Badge tone={tk.priority === "HIGH" ? "error" : "muted"}>
                      {tk.priority}
                    </Badge>
                  </div>

                  <p className="text-[12px] text-text font-medium">
                    &ldquo;{tk.subject}&rdquo;
                  </p>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-text-muted">
                    <span>Opened {tk.createdAt}</span>
                    <Link
                      href="/admin/support"
                      className="font-bold text-accent hover:underline"
                    >
                      Reply & Resolve &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Tenant System Architecture Health */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Layers size={14} className="text-success" />
              SaaS Multi-Tenant Database Status
            </h4>
            <div className="rounded-xl border border-border bg-bg p-3 space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-text-muted">Master Registry DB:</span>
                <span className="font-mono font-bold text-success">[FuelStationMasterDB]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Isolated Tenant DBs:</span>
                <span className="font-mono font-bold text-text">128 Partitioned Instances</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Database Engine:</span>
                <span className="font-mono text-text">Microsoft SQL Server</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Platform Operators:</span>
                <span className="font-bold text-accent">4 Active Headquarters Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
