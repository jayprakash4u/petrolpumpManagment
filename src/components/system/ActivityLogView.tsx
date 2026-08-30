"use client";

import { useState, useMemo } from "react";
import {
  ScrollText,
  Search,
  Download,
  Filter,
  Fuel,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Layers,
  Shield,
  Eye,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

interface ActivityEvent {
  id: string;
  category: "SALES" | "INVENTORY" | "METERS" | "CREDIT" | "SYSTEM";
  action: string;
  description: string;
  actor: string;
  role: string;
  dateBS: string;
  time: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  details?: Record<string, any>;
}

export function ActivityLogView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewingEvent, setViewingEvent] = useState<ActivityEvent | null>(null);

  const [events] = useState<ActivityEvent[]>([
    {
      id: "evt-101",
      category: "SALES",
      action: "SALE_RECORDED",
      description: "Bill #SL-1025 issued for 25.0 L Petrol (MS-91) · Rs 4,250",
      actor: "Ram Shrestha",
      role: "ATTENDANT",
      dateBS: "2083-05-08",
      time: "11:02 AM",
      severity: "SUCCESS",
      details: {
        receiptNo: 1025,
        fuel: "PETROL",
        liters: 25.0,
        amount: 4250,
        payment: "CASH",
        vehicleNo: "BA 2 PA 1234",
      },
    },
    {
      id: "evt-102",
      category: "SALES",
      action: "SALE_RECORDED",
      description: "Bill #SL-1024 issued for 40.0 L Diesel (HSD) · Rs 6,000 billed to Sajha Yatayat",
      actor: "Sita Gurung",
      role: "ATTENDANT",
      dateBS: "2083-05-08",
      time: "10:48 AM",
      severity: "SUCCESS",
      details: {
        receiptNo: 1024,
        fuel: "DIESEL",
        liters: 40.0,
        amount: 6000,
        payment: "CREDIT",
        customer: "Sajha Yatayat Cooperative",
      },
    },
    {
      id: "evt-103",
      category: "SALES",
      action: "SALE_EDITED",
      description: "Bill #SL-1025 modified: Vehicle plate registered as BA 2 PA 1234",
      actor: "Jay Prakash Yadav",
      role: "OWNER",
      dateBS: "2083-05-08",
      time: "10:35 AM",
      severity: "INFO",
      details: {
        saleId: "sample-1025",
        reason: "Customer requested plate entry for corporate fuel claim",
      },
    },
    {
      id: "evt-104",
      category: "CREDIT",
      action: "PAYMENT_RECEIVED",
      description: "Received Rs 1,50,000 clearance cheque #CHQ-98102 from Everest Logistics",
      actor: "Jay Prakash Yadav",
      role: "OWNER",
      dateBS: "2083-05-08",
      time: "10:15 AM",
      severity: "SUCCESS",
      details: {
        customer: "Everest Logistics Pvt. Ltd.",
        amount: 150000,
        mode: "BANK_CHEQUE",
        bank: "Nabil Bank Ltd.",
      },
    },
    {
      id: "evt-105",
      category: "METERS",
      action: "METER_READING_CLOSED",
      description: "Morning shift meter closing entered for Island A (Bay 1 & 2)",
      actor: "Sita Gurung",
      role: "MANAGER",
      dateBS: "2083-05-08",
      time: "09:30 AM",
      severity: "INFO",
      details: {
        dispenser: "Bay 01 - Island A",
        cumulativeOpening: 184290.5,
        cumulativeClosing: 185640.5,
        shiftVolume: 1350.0,
      },
    },
    {
      id: "evt-106",
      category: "INVENTORY",
      action: "TANK_DIP_RECORDED",
      description: "Physical morning dip recorded for Tank 01 (MS Petrol): 1,280 mm · 12,840 L",
      actor: "Ram Shrestha",
      role: "MANAGER",
      dateBS: "2083-05-08",
      time: "06:15 AM",
      severity: "INFO",
      details: {
        tank: "Tank 01 (MS Petrol 20KL)",
        dipMm: 1280,
        calculatedLiters: 12840,
        waterBottomMm: 0,
      },
    },
    {
      id: "evt-107",
      category: "SYSTEM",
      action: "IRD_SYNC_PUSH",
      description: "Automated batch push of 48 sales to IRD Central Billing Management System (CBMS)",
      actor: "SYSTEM",
      role: "DAEMON",
      dateBS: "2083-05-08",
      time: "06:00 AM",
      severity: "SUCCESS",
      details: {
        syncedCount: 48,
        irdResponseCode: 200,
        status: "ACKNOWLEDGED",
      },
    },
  ]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchActor = e.actor.toLowerCase().includes(q);
        const matchAction = e.action.toLowerCase().includes(q);
        if (!matchDesc && !matchActor && !matchAction) return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      "Event ID",
      "Category",
      "Action Code",
      "Description",
      "Actor Name",
      "Role",
      "Date (BS)",
      "Time",
      "Severity",
    ];

    const rows = filteredEvents.map((e) => [
      `"${e.id}"`,
      `"${e.category}"`,
      `"${e.action}"`,
      `"${e.description}"`,
      `"${e.actor}"`,
      `"${e.role}"`,
      `"${e.dateBS}"`,
      `"${e.time}"`,
      `"${e.severity}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `station_activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "SALES":
        return <Badge tone="accent">SALES</Badge>;
      case "INVENTORY":
        return <Badge tone="text">INVENTORY</Badge>;
      case "METERS":
        return <Badge tone="muted">METERS</Badge>;
      case "CREDIT":
        return <Badge tone="success">CREDIT</Badge>;
      case "SYSTEM":
        return <Badge tone="text">SYSTEM</Badge>;
      default:
        return <Badge tone="muted">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ScrollText size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Station Activity Log & Event Stream (स्टेशन दैनिक कार्य विवरण लग)
            </h2>
            <p className="text-[12px] text-text-muted">
              Live chronological stream of sales, inventory dip entries, meter readings, and system security events.
            </p>
          </div>
        </div>

        <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
          <Download size={14} /> Export Activity CSV
        </GhostButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Logged Events"
          value={`${events.length} Events`}
          icon={ScrollText}
          tone="text"
        />
        <StatCard
          label="Fuel Sales Recorded"
          value={`${events.filter((e) => e.category === "SALES").length} Transactions`}
          icon={Fuel}
          tone="accent"
        />
        <StatCard
          label="Financial & Credit"
          value={`${events.filter((e) => e.category === "CREDIT").length} Receipts`}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Automated IRD Syncs"
          value="100% Synced"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Category Filter Chips & Search Bar */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Real-time Search */}
          <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search activity stream by user, bill number, action, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[12px]">
          <span className="text-text-muted font-medium mr-1">Category:</span>
          {[
            { id: "ALL", label: "All Activity" },
            { id: "SALES", label: "Fuel Sales" },
            { id: "INVENTORY", label: "Tank Dips & Purchases" },
            { id: "METERS", label: "Pump Meters" },
            { id: "CREDIT", label: "Customer Credit" },
            { id: "SYSTEM", label: "System & Compliance" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={clsx(
                "rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer",
                selectedCategory === tab.id
                  ? "bg-accent text-[#1A1306] font-bold shadow-2xs"
                  : "bg-bg border border-border text-text hover:bg-surface-hi"
              )}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-[12px] text-text-muted ml-auto font-data">
            {filteredEvents.length} events
          </span>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs divide-y divide-border">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-[13px]">
            No activity events found matching your search.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setViewingEvent(evt)}
              className="flex items-center justify-between p-4 hover:bg-surface-hi/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="text-left font-data text-[12px] text-text-muted w-24 shrink-0">
                  <div className="font-bold text-accent">{evt.time}</div>
                  <div className="text-[10.5px]">{evt.dateBS}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(evt.category)}
                    <span className="font-bold text-[13.5px] text-text font-body">
                      {evt.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11.5px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {evt.actor} ({evt.role})
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[10.5px]">Action: {evt.action}</span>
                  </div>
                </div>
              </div>

              <GhostButton
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingEvent(evt);
                }}
                className="text-[11.5px] px-2.5 py-1"
              >
                <Eye size={12} /> Details
              </GhostButton>
            </div>
          ))
        )}
      </div>

      {/* Event Details Slide-Over / Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <ScrollText size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Event Details: {viewingEvent.action}
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    {viewingEvent.dateBS} at {viewingEvent.time}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingEvent(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-[12.5px]">
              <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2">
                <div>
                  <span className="text-text-muted block text-[11px]">Description:</span>
                  <span className="font-semibold text-text">{viewingEvent.description}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                  <div>
                    <span className="text-text-muted block text-[11px]">Actor / Performer:</span>
                    <span className="text-text font-medium">{viewingEvent.actor}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[11px]">System Role:</span>
                    <Badge tone="accent">{viewingEvent.role}</Badge>
                  </div>
                </div>
              </div>

              {viewingEvent.details && (
                <div className="space-y-1">
                  <div className="font-semibold text-text text-[12px]">Event Payload & Metadata:</div>
                  <pre className="rounded-xl border border-border bg-bg p-3 font-mono text-[11px] text-text-muted overflow-x-auto">
                    {JSON.stringify(viewingEvent.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border bg-surface-hi px-5 py-3">
              <GhostButton onClick={() => setViewingEvent(null)}>Close</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
