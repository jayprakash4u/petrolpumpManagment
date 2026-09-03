"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Filter,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { clsx } from "clsx";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

export interface StationTenantRow {
  id: string;
  stationId: string;
  name: string;
  slug: string;
  stationCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerUsername: string;
  location: string;
  companyName: string;
  databaseName: string;
  plan: "Basic" | "Pro" | "Enterprise";
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED";
  subscriptionDays: number;
  monthlyFee: number;
  registeredDate: string;
  tanksCount: number;
  staffCount: number;
}

const DEFAULT_DEMO_STATIONS: StationTenantRow[] = [
  {
    id: "st-1",
    stationId: "STN-000001",
    name: "Shree Petrol Pump",
    slug: "shree-001",
    stationCode: "SHREE-001",
    ownerName: "Prakash Shrestha",
    ownerPhone: "9851023941",
    ownerEmail: "admin@shreepump.com",
    ownerUsername: "shree_admin",
    location: "Kathmandu",
    companyName: "Shree Petroleum Center Pvt. Ltd.",
    databaseName: "shree_petroleum",
    plan: "Pro",
    status: "ACTIVE",
    subscriptionDays: 24,
    monthlyFee: 4000,
    registeredDate: "2082-06-01",
    tanksCount: 4,
    staffCount: 8,
  },
    {
      id: "st-2",
      stationId: "STN-000002",
      name: "Manoj Petroleum",
      slug: "manoj-002",
      stationCode: "MANOJ-002",
      ownerName: "Manoj Yadav",
      ownerPhone: "9855019283",
      ownerEmail: "admin@manojpetroleum.com",
      ownerUsername: "manoj_admin",
      location: "Birgunj",
      companyName: "Manoj Petroleum Network Pvt. Ltd.",
      databaseName: "manoj_petroleum",
      plan: "Pro",
      status: "ACTIVE",
      subscriptionDays: 180,
      monthlyFee: 4000,
      registeredDate: "2082-08-15",
      tanksCount: 3,
      staffCount: 5,
    },
    {
      id: "st-3",
      stationId: "STN-000003",
      name: "ABC Petrol Pump",
      slug: "abc-003",
      stationCode: "ABC-003",
      ownerName: "Ram Thapa",
      ownerPhone: "9851029384",
      ownerEmail: "admin@abcpump.com",
      ownerUsername: "abc_pump",
      location: "Kathmandu",
      companyName: "ABC Petroleum Pvt. Ltd.",
      databaseName: "abc_petrol",
      plan: "Pro",
      status: "ACTIVE",
      subscriptionDays: 24,
      monthlyFee: 4000,
      registeredDate: "2082-10-15",
      tanksCount: 3,
      staffCount: 6,
    },
    {
      id: "st-4",
      stationId: "STN-000004",
      name: "XYZ Fuel Station",
      slug: "xyz-004",
      stationCode: "XYZ-004",
      ownerName: "Hari KC",
      ownerPhone: "9841029381",
      ownerEmail: "admin@xyzstation.com",
      ownerUsername: "xyz_station",
      location: "Lalitpur",
      companyName: "XYZ Oil Distributors",
      databaseName: "xyz_fuel",
      plan: "Basic",
      status: "ACTIVE",
      subscriptionDays: 12,
      monthlyFee: 2000,
      registeredDate: "2082-11-01",
      tanksCount: 2,
      staffCount: 4,
    },
    {
      id: "st-5",
      stationId: "STN-000005",
      name: "Pokhara Highway Fuel",
      slug: "pokhara-005",
      stationCode: "POKHARA-005",
      ownerName: "Bikram Gurung",
      ownerPhone: "9846011290",
      ownerEmail: "bikram@pokharafuel.com",
      ownerUsername: "pokhara_admin",
      location: "Pokhara",
      companyName: "Pokhara Highway Energy Pvt. Ltd.",
      databaseName: "pokhara_highway",
      plan: "Pro",
      status: "ACTIVE",
      subscriptionDays: 68,
      monthlyFee: 4000,
      registeredDate: "2082-07-15",
      tanksCount: 3,
      staffCount: 5,
    },
    {
      id: "st-6",
      stationId: "STN-000006",
      name: "Everest Oil Traders",
      slug: "everest-006",
      stationCode: "EVEREST-006",
      ownerName: "Rajesh Adhikari",
      ownerPhone: "9855021940",
      ownerEmail: "rajesh@everestoil.com",
      ownerUsername: "everest_oil",
      location: "Chitwan",
      companyName: "Everest Petroleum Group",
      databaseName: "everest_oil",
      plan: "Enterprise",
      status: "ACTIVE",
      subscriptionDays: 740,
      monthlyFee: 7000,
      registeredDate: "2082-08-01",
      tanksCount: 6,
      staffCount: 14,
    },
    {
      id: "st-7",
      stationId: "STN-000007",
      name: "Birgunj Border Fuel Hub",
      slug: "birgunj-007",
      stationCode: "BIRGUNJ-007",
      ownerName: "Sunil Keshari",
      ownerPhone: "9855034199",
      ownerEmail: "sunil@birgunjfuel.com",
      ownerUsername: "birgunj_hub",
      location: "Birgunj",
      companyName: "Birgunj International Petroleum",
      databaseName: "birgunj_fuel",
      plan: "Enterprise",
      status: "ACTIVE",
      subscriptionDays: 12,
      monthlyFee: 7000,
      registeredDate: "2082-05-20",
      tanksCount: 5,
      staffCount: 12,
    },
    {
      id: "st-8",
      stationId: "STN-000008",
      name: "Butwal Petroleum Center",
      slug: "butwal-008",
      stationCode: "BUTWAL-008",
      ownerName: "Deepak Shrestha",
      ownerPhone: "9857022194",
      ownerEmail: "deepak@butwaloil.com",
      ownerUsername: "butwal_center",
      location: "Butwal",
      companyName: "Butwal Fuel Center Pvt. Ltd.",
      databaseName: "butwal_petroleum",
      plan: "Pro",
      status: "ACTIVE",
      subscriptionDays: 7,
      monthlyFee: 4000,
      registeredDate: "2082-11-15",
      tanksCount: 3,
      staffCount: 6,
    },
    {
      id: "st-9",
      stationId: "STN-000009",
      name: "Janakpur Dham Fuel Center",
      slug: "janakpur-009",
      stationCode: "JANAKPUR-009",
      ownerName: "Rameshwar Shah",
      ownerPhone: "9854021944",
      ownerEmail: "rameshwar@janakpuroil.com",
      ownerUsername: "janakpur_dham",
      location: "Janakpur",
      companyName: "Janakpur Energy Network",
      databaseName: "janakpur_fuel",
      plan: "Basic",
      status: "TRIAL",
      subscriptionDays: 7,
      monthlyFee: 2000,
      registeredDate: "2083-05-01",
      tanksCount: 2,
      staffCount: 3,
    },
    {
      id: "st-10",
      stationId: "STN-000010",
      name: "Eastern Oil Center",
      slug: "eastern-010",
      stationCode: "EASTERN-010",
      ownerName: "Binod Basnet",
      ownerPhone: "9852033910",
      ownerEmail: "binod@easternoil.com",
      ownerUsername: "eastern_oil",
      location: "Biratnagar",
      companyName: "Eastern Petroleum Pvt. Ltd.",
      databaseName: "eastern_oil",
      plan: "Basic",
      status: "EXPIRED",
      subscriptionDays: 0,
      monthlyFee: 2000,
      registeredDate: "2082-02-10",
      tanksCount: 2,
      staffCount: 4,
    },
];

export function StationsDirectoryView({ initialStations }: { initialStations?: StationTenantRow[] }) {
  const router = useRouter();
  const [stations] = useState<StationTenantRow[]>(() => initialStations && initialStations.length > 0 ? initialStations : DEFAULT_DEMO_STATIONS);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [impersonatingSlug, setImpersonatingSlug] = useState<string | null>(null);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSlug = s.slug.toLowerCase().includes(q);
        const matchOwner = s.ownerName.toLowerCase().includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchOwner && !matchLoc) return false;
      }
      return true;
    });
  }, [stations, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with [ + Add New Station ] */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Building2 size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display text-[20px] font-bold text-text">
              Stations
            </h1>
            <p className="text-[12.5px] text-text-muted">
              Manage all client petrol stations, subscriptions, and forecourt tenant partitions.
            </p>
          </div>
        </div>

        <Link href="/admin/stations/new">
          <PrimaryButton className="text-[13px] px-4 py-2.5 shadow-sm">
            <Plus size={16} className="stroke-[2.5]" /> Add New Station
          </PrimaryButton>
        </Link>
      </div>

      {/* 2. Overview Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Stations"
          value={`${stations.length} Registered`}
          icon={Building2}
          tone="accent"
        />
        <StatCard
          label="Active Stations"
          value={`${stations.filter((s) => s.status === "ACTIVE").length} Live`}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Trial Stations"
          value={`${stations.filter((s) => s.status === "TRIAL").length} Stations`}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Expiring (≤ 30 Days)"
          value={`${stations.filter((s) => s.subscriptionDays <= 30 && s.subscriptionDays > 0).length} Due`}
          icon={CreditCard}
          tone="error"
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search stations by name, owner, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="text-text-muted text-xs">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* 4. Main Stations Table (Clicking Opens Full Page) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[850px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-5 py-3.5">Station</th>
                <th className="px-4 py-3.5">Owner</th>
                <th className="px-4 py-3.5">Plan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Subscription</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted font-body">
                    No stations match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStations.map((st) => {
                  const isSuspended = st.status === "SUSPENDED";
                  const isExpired = st.status === "EXPIRED";
                  const isTrial = st.status === "TRIAL";

                  return (
                    <tr
                      key={st.id}
                      onClick={() => router.push(`/admin/stations/${st.slug}`)}
                      className={clsx(
                        "hover:bg-surface-hi/60 transition-colors cursor-pointer group",
                        isSuspended && "bg-error/5 opacity-80"
                      )}
                    >
                      {/* Station Name & City */}
                      <td className="px-5 py-3.5 font-body">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-bold text-accent text-xs">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-[13.5px] text-text group-hover:text-accent transition-colors">
                              {st.name}
                            </div>
                            <div className="text-[11.5px] text-text-muted flex items-center gap-1.5">
                              <MapPin size={11} className="text-accent" />
                              <span>{st.location}</span>
                              <span className="text-border">·</span>
                              <span className="font-mono text-[11px] font-bold text-accent">{st.stationCode}</span>
                              <span className="text-border">·</span>
                              <span className="font-mono text-[10.5px] text-text-muted">{st.stationId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3.5 font-body">
                        <div className="font-bold text-text text-[12.5px]">{st.ownerName}</div>
                        <div className="font-mono text-[11px] text-text-muted">
                          @{st.ownerUsername}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3.5 font-body">
                        <span
                          className={clsx(
                            "rounded-md px-2 py-0.5 text-[11px] font-bold",
                            st.plan === "Enterprise" && "bg-purple-500/15 text-purple-400 border border-purple-500/30",
                            st.plan === "Pro" && "bg-accent/15 text-accent border border-accent/30",
                            st.plan === "Basic" && "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          )}
                        >
                          {st.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center font-body">
                        <Badge
                          tone={
                            isSuspended
                              ? "error"
                              : isExpired
                              ? "error"
                              : isTrial
                              ? "warning"
                              : "success"
                          }
                        >
                          {st.status}
                        </Badge>
                      </td>

                      {/* Subscription Days Left */}
                      <td className="px-4 py-3.5 text-right font-data">
                        <div
                          className={clsx(
                            "font-bold text-[13px]",
                            st.subscriptionDays <= 10
                              ? "text-error"
                              : st.subscriptionDays <= 30
                              ? "text-warning"
                              : "text-success"
                          )}
                        >
                          {st.subscriptionDays === 0
                            ? "Expired"
                            : `${st.subscriptionDays} days`}
                        </div>
                      </td>

                      {/* Actions: View Details & Login */}
                      <td
                        className="px-5 py-3.5 text-right font-body"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/stations/${st.slug}`}
                            className="rounded-lg border border-border bg-surface-hi px-3 py-1.5 text-xs font-semibold text-text hover:text-accent hover:border-accent/40 transition-colors"
                          >
                            <span>View Details &rarr;</span>
                          </Link>

                          <a
                            href={`/api/admin/impersonate?slug=${st.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1.5 text-xs font-bold text-accent hover:bg-accent/25 transition-all shadow-xs"
                            title="Login as Station Admin for troubleshooting"
                          >
                            <ExternalLink size={12} />
                            <span>Login</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
