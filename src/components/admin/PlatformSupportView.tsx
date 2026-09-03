"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  MessageSquare,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  X,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface SupportTicket {
  id: string;
  ticketNo: string;
  stationName: string;
  slug: string;
  ownerName: string;
  phone: string;
  subject: string;
  description: string;
  category: "PUMP_DELIVERY" | "INVOICE_PRINTING" | "IRD_SYNC" | "USER_ACCESS" | "BILLING";
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  assignedStaff: string;
  replies: Array<{
    id: string;
    sender: string;
    role: "STAFF" | "STATION_OWNER";
    message: string;
    time: string;
  }>;
}

export function PlatformSupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "t-1025",
      ticketNo: "#1025",
      stationName: "ABC Petrol Pump",
      slug: "abc-petrol",
      ownerName: "Ram Shrestha",
      phone: "9851029384",
      subject: "Unable to add fuel delivery stock record",
      description:
        "When clicking 'Record Delivery' for MS Petrol 4000L tank, the form displays a database validation error. We need to reconcile our invoice today.",
      category: "PUMP_DELIVERY",
      priority: "HIGH",
      status: "OPEN",
      createdAt: "15 mins ago",
      assignedStaff: "Sita Support",
      replies: [
        {
          id: "r-1",
          sender: "Ram Shrestha (ABC Petrol Pump)",
          role: "STATION_OWNER",
          message: "Please look into this urgently as fuel tanker is waiting at station forecourt.",
          time: "15 mins ago",
        },
      ],
    },
    {
      id: "t-1024",
      ticketNo: "#1024",
      stationName: "XYZ Fuel Station",
      slug: "xyz-fuel",
      ownerName: "Hari Prasad Sharma",
      phone: "9841029381",
      subject: "Need guidance setting up 80mm thermal printer logo",
      description:
        "We uploaded our official pump logo in invoice studio, but thermal receipts print too wide. We need 80mm compact formatting.",
      category: "INVOICE_PRINTING",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdAt: "2 hours ago",
      assignedStaff: "Aayush Sharma",
      replies: [
        {
          id: "r-2",
          sender: "Hari Prasad Sharma",
          role: "STATION_OWNER",
          message: "Could you configure the 80mm paper size template for our station?",
          time: "2 hours ago",
        },
        {
          id: "r-3",
          sender: "Aayush Sharma (Support Engineer)",
          role: "STAFF",
          message: "Hello Hari Ji, I have switched your station template to Thermal 80mm. Please try printing a test bill now.",
          time: "45 mins ago",
        },
      ],
    },
    {
      id: "t-1023",
      ticketNo: "#1023",
      stationName: "Birgunj Border Fuel Hub",
      slug: "birgunj-fuel",
      ownerName: "Sunil Keshari",
      phone: "9855034199",
      subject: "Monthly VAT sales annexure IRD verification query",
      description:
        "Does the export report include both cash and credit invoices with customer PAN numbers for Inland Revenue Department submission?",
      category: "IRD_SYNC",
      priority: "LOW",
      status: "OPEN",
      createdAt: "5 hours ago",
      assignedStaff: "John Admin",
      replies: [
        {
          id: "r-4",
          sender: "Sunil Keshari",
          role: "STATION_OWNER",
          message: "Kindly confirm Annexure-5 compatibility for Bhadra 2083 tax filing.",
          time: "5 hours ago",
        },
      ],
    },
    {
      id: "t-1022",
      ticketNo: "#1022",
      stationName: "Pokhara Highway Fuel Center",
      slug: "pokhara-highway",
      ownerName: "Bikram Gurung",
      phone: "9846011290",
      subject: "Shift cashier password reset request",
      description: "Night shift attendant forgot PIN code. Resolved via station admin password reset tool.",
      category: "USER_ACCESS",
      priority: "LOW",
      status: "RESOLVED",
      createdAt: "Yesterday",
      assignedStaff: "Sita Support",
      replies: [
        {
          id: "r-5",
          sender: "Sita Support",
          role: "STAFF",
          message: "Assisted owner in using the 'Reset Password' tool from the Station Admin panel. Issue resolved.",
          time: "Yesterday",
        },
      ],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Selected Ticket for Drawer / Modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNo = t.ticketNo.toLowerCase().includes(q);
        const matchSt = t.stationName.toLowerCase().includes(q);
        const matchSub = t.subject.toLowerCase().includes(q);
        if (!matchNo && !matchSt && !matchSub) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchQuery]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    const newReply = {
      id: `r-${Date.now()}`,
      sender: "Sita Support (Platform Team)",
      role: "STAFF" as const,
      message: replyMessage.trim(),
      time: "Just now",
    };

    const updated = {
      ...activeTicket,
      status: "IN_PROGRESS" as const,
      replies: [...activeTicket.replies, newReply],
    };

    setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
    setActiveTicket(updated);
    setReplyMessage("");
    setActionNotice(`Reply posted to Ticket ${activeTicket.ticketNo}. Status marked as In Progress.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "RESOLVED",
            }
          : t
      )
    );
    if (activeTicket && activeTicket.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: "RESOLVED" });
    }
    setActionNotice(`Ticket marked as Resolved.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <LifeBuoy size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Station Support Desk (ग्राहक सहायता तथा टिकट व्यवस्थापन)
            </h2>
            <p className="text-[12px] text-text-muted">
              Respond to station issues, resolve technical queries, and log into tenant consoles in support mode to troubleshoot.
            </p>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {actionNotice}
        </div>
      )}

      {/* 2. Key Support KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open Tickets"
          value={`${tickets.filter((t) => t.status === "OPEN").length} Pending`}
          icon={AlertCircle}
          tone="error"
        />
        <StatCard
          label="In Progress"
          value={`${tickets.filter((t) => t.status === "IN_PROGRESS").length} Active`}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Resolved This Week"
          value={`${tickets.filter((t) => t.status === "RESOLVED").length} Solved`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Average Response SLA"
          value="18 Minutes"
          icon={LifeBuoy}
          tone="accent"
        />
      </div>

      {/* 3. Search & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-1 min-w-[280px] items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-text transition-colors focus-within:border-accent">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search tickets by # (e.g. #1025), station name (ABC Pump), or issue subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-text placeholder:text-text-muted/60 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[12.5px]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Filter size={13} /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <div className="flex items-center gap-1.5 text-text-muted ml-2">
            Priority:
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-[12px] text-text"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High / Urgent</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 4. Support Tickets Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[920px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">TICKET #</th>
                <th className="px-3 py-3.5">STATION & CONTACT</th>
                <th className="px-3 py-3.5">ISSUE / SUBJECT</th>
                <th className="px-3 py-3.5">PRIORITY</th>
                <th className="px-3 py-3.5 text-center">STATUS</th>
                <th className="px-3 py-3.5">ASSIGNED STAFF</th>
                <th className="px-4 py-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted font-body">
                    No support tickets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-hi/40 transition-colors cursor-pointer"
                    onClick={() => setActiveTicket(t)}
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-accent">
                      {t.ticketNo}
                    </td>

                    <td className="px-3 py-3.5 font-body">
                      <div className="font-bold text-text text-[13px]">{t.stationName}</div>
                      <div className="text-[11px] text-text-muted">
                        {t.ownerName} · {t.phone}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 font-body">
                      <div className="font-semibold text-text text-[13px]">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-text-muted line-clamp-1">
                        {t.description}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 font-body">
                      <Badge tone={t.priority === "HIGH" ? "error" : t.priority === "MEDIUM" ? "warning" : "muted"}>
                        {t.priority}
                      </Badge>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <Badge tone={t.status === "OPEN" ? "error" : t.status === "IN_PROGRESS" ? "warning" : "success"}>
                        {t.status}
                      </Badge>
                    </td>

                    <td className="px-3 py-3.5 text-text text-[12px] font-body">
                      {t.assignedStaff}
                    </td>

                    <td className="px-4 py-3.5 text-right font-body">
                      <GhostButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTicket(t);
                        }}
                        className="px-2.5 py-1 text-[11px]"
                      >
                        Respond &rarr;
                      </GhostButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Ticket Response & Resolution Drawer                             */}
      {/* ========================================================================= */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-hi px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
                  <LifeBuoy size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent text-sm">
                      {activeTicket.ticketNo}
                    </span>
                    <h3 className="font-display text-[15px] font-bold text-text">
                      {activeTicket.subject}
                    </h3>
                  </div>
                  <div className="text-[11.5px] text-text-muted">
                    {activeTicket.stationName} · Owner: {activeTicket.ownerName} ({activeTicket.phone})
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body: Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-[12.5px]">
              {/* Station Context Card with "Login as Station Admin" */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3.5 text-xs">
                <div>
                  <span className="font-bold text-text">Troubleshooting Station: </span>
                  <span className="font-mono text-accent font-semibold">{activeTicket.slug}</span>
                </div>
                <a
                  href={`/api/admin/impersonate?slug=${activeTicket.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-[#1A1306] shadow-2xs hover:bg-accent/90 transition-all"
                >
                  <ExternalLink size={12} /> Login to Station (Support Mode)
                </a>
              </div>

              {/* Original Issue Description */}
              <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-bold text-text">Initial Problem Report:</span>
                  <span>{activeTicket.createdAt}</span>
                </div>
                <p className="text-text leading-relaxed">
                  {activeTicket.description}
                </p>
              </div>

              {/* Thread of Responses */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Discussion Thread ({activeTicket.replies.length})
                </div>

                {activeTicket.replies.map((r) => {
                  const isStaff = r.role === "STAFF";
                  return (
                    <div
                      key={r.id}
                      className={clsx(
                        "rounded-xl border p-3.5 space-y-1.5",
                        isStaff
                          ? "border-accent/30 bg-accent/5 ml-4"
                          : "border-border bg-bg mr-4"
                      )}
                    >
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className={clsx("font-bold", isStaff ? "text-accent" : "text-text")}>
                          {r.sender}
                        </span>
                        <span className="text-text-muted font-mono text-[10.5px]">{r.time}</span>
                      </div>
                      <p className="text-text leading-relaxed">{r.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <label className="text-xs font-bold text-text block">
                  Post Official Staff Response
                </label>
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type advice or resolution details to the fuel station owner..."
                  className="w-full rounded-xl border border-border bg-bg p-3 text-xs text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
                  required
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {activeTicket.status !== "RESOLVED" && (
                      <GhostButton
                        type="button"
                        onClick={() => handleResolveTicket(activeTicket.id)}
                        className="text-xs text-success hover:bg-success/10 border-success/30"
                      >
                        <CheckCircle2 size={13} /> Mark as Resolved
                      </GhostButton>
                    )}
                  </div>

                  <PrimaryButton type="submit" disabled={!replyMessage.trim()} className="text-xs px-4 py-2">
                    <Send size={13} /> Send Reply to Station
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
