"use client";

import { useState } from "react";
import { Bell, Send, AlertTriangle, Info, CheckCircle2, ShieldAlert, Sparkles, Clock, Trash2 } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "CRITICAL_ALERT" | "MAINTENANCE_NOTICE" | "REGULATORY_UPDATE" | "FEATURE_UPDATE";
  targetStations: string;
  sentAtBS: string;
  status: "ACTIVE" | "ARCHIVED";
}

export function SystemNotificationsView() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "sn-1",
      title: "Scheduled IRD CBMS Tax Server Maintenance",
      message: "The Inland Revenue Department (IRD) electronic billing server will undergo routine maintenance from 01:00 AM to 02:30 AM tonight. Local billing remains operational and will auto-sync.",
      type: "MAINTENANCE_NOTICE",
      targetStations: "All 20 Stations",
      sentAtBS: "2083-05-08 10:00",
      status: "ACTIVE",
    },
    {
      id: "sn-2",
      title: "Monsoon Decanting Safety Protocols Enforced",
      message: "Heavy rainfall alert across Terai highway corridor. All stations must verify water-finding paste on tank dipsticks prior to product decanting.",
      type: "CRITICAL_ALERT",
      targetStations: "Highway & Terai Clusters",
      sentAtBS: "2083-05-07 14:20",
      status: "ACTIVE",
    },
    {
      id: "sn-3",
      title: "Thermal Slip Header Format Compliance Notice",
      message: "Reminder to ensure Station PAN (9 digits) and IRD Annexure 5 approval number is printed clearly on all customer receipts.",
      type: "REGULATORY_UPDATE",
      targetStations: "All 20 Stations",
      sentAtBS: "2083-05-05 09:15",
      status: "ACTIVE",
    },
  ]);

  const [showSendModal, setShowSendModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<SystemNotification["type"]>("MAINTENANCE_NOTICE");
  const [newTarget, setNewTarget] = useState("All 20 Stations");
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotif: SystemNotification = {
      id: `sn-${Date.now()}`,
      title: newTitle,
      message: newMessage,
      type: newType,
      targetStations: newTarget,
      sentAtBS: "2083-05-08 12:50",
      status: "ACTIVE",
    };
    setNotifications([newNotif, ...notifications]);
    setShowSendModal(false);
    setNewTitle("");
    setNewMessage("");
    setSendSuccess(`System notification sent to "${newTarget}" dashboards.`);
    setTimeout(() => setSendSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Bell size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Broadcasts & System Notifications (सूचना तथा सन्देश)
            </h2>
            <p className="text-[12px] text-text-muted">
              Dispatch urgent operational warnings, scheduled maintenance banners, and compliance reminders directly to station screens.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setShowSendModal(true)} className="text-[13px] px-4 py-2.5">
          <Send size={15} /> Send Broadcast Notice
        </PrimaryButton>
      </div>

      {sendSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {sendSuccess}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Broadcasts"
          value={`${notifications.length} Active`}
          icon={Bell}
          tone="accent"
        />
        <StatCard
          label="Target Forecourts"
          value="20 Stations"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Urgent Alerts"
          value="1 Critical"
          icon={AlertTriangle}
          tone="error"
        />
        <StatCard
          label="Read Acknowledgment"
          value="98.5% Real-time"
          icon={Clock}
          tone="text"
        />
      </div>

      {/* Notifications Stream */}
      <div className="grid grid-cols-1 gap-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-[16px] font-bold text-text">{n.title}</h3>
                  <Badge tone={n.type === "CRITICAL_ALERT" ? "error" : n.type === "MAINTENANCE_NOTICE" ? "accent" : "muted"}>
                    {n.type.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="text-[11.5px] text-text-muted">
                  Target: <strong className="text-text">{n.targetStations}</strong> · Dispatched: {n.sentAtBS}
                </div>
              </div>
            </div>

            <p className="text-[12.5px] text-text-muted leading-relaxed">
              {n.message}
            </p>
          </div>
        ))}
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSendNotification}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text">
                Dispatch System Broadcast Notice
              </h3>
              <p className="text-[12px] text-text-muted">
                Display this banner across station control dashboards.
              </p>
            </div>

            <Field label="Notice Title" htmlFor="nTitle">
              <Input
                id="nTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Scheduled Network Upgrade"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">
                  Alert Severity
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text"
                >
                  <option value="MAINTENANCE_NOTICE">Maintenance Notice</option>
                  <option value="CRITICAL_ALERT">Critical Operational Alert</option>
                  <option value="REGULATORY_UPDATE">Regulatory / Tax Update</option>
                  <option value="FEATURE_UPDATE">New Feature Announcement</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">
                  Target Stations
                </label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text"
                >
                  <option value="All 20 Stations">All 20 Stations (Nationwide)</option>
                  <option value="Kathmandu Valley Metro">Kathmandu Valley Metro Hubs</option>
                  <option value="Highway & Terai Clusters">Highway & Terai Clusters</option>
                  <option value="Industrial Border Logistics">Industrial Border Hubs</option>
                </select>
              </div>
            </div>

            <Field label="Broadcast Message Body" htmlFor="nMsg">
              <Input
                id="nMsg"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Detailed instructions for station attendants..."
                required
              />
            </Field>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <GhostButton type="button" onClick={() => setShowSendModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Dispatch Broadcast
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
