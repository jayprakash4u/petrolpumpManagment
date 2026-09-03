"use client";

import { useState } from "react";
import {
  Bell,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Clock,
  Radio,
  Building2,
  CreditCard,
  Wallet,
  Users,
  X,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface SystemNotificationItem {
  id: string;
  category: "SUBSCRIPTION_EXPIRING" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "NEW_STATION" | "ANNOUNCEMENT";
  title: string;
  message: string;
  stationName?: string;
  timestamp: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "UNREAD" | "READ";
}

export function SystemNotificationsView() {
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([
    {
      id: "n-1",
      category: "SUBSCRIPTION_EXPIRING",
      title: "Subscription Expiring in 7 Days",
      message: "Butwal Petroleum Center's 6-Month Pro Plan is expiring on 2083-05-15. Auto-renewal notice dispatched.",
      stationName: "Butwal Petroleum Center",
      timestamp: "10 mins ago",
      priority: "HIGH",
      status: "UNREAD",
    },
    {
      id: "n-2",
      category: "PAYMENT_SUCCESS",
      title: "Payment Received: Rs. 40,000",
      message: "ABC Petrol Pump successfully paid for 12-Month Pro Plan renewal via NABIL Bank Transfer (Ref: TXN-NAB-994812).",
      stationName: "ABC Petrol Pump",
      timestamp: "1 hour ago",
      priority: "MEDIUM",
      status: "UNREAD",
    },
    {
      id: "n-3",
      category: "NEW_STATION",
      title: "New Station Registered & Provisioned",
      message: "Janakpur Dham Fuel Center was onboarded with dedicated database [FuelStation_janakpur_fuel]. Admin user: @rameshwar.admin.",
      stationName: "Janakpur Dham Fuel Center",
      timestamp: "3 hours ago",
      priority: "MEDIUM",
      status: "READ",
    },
    {
      id: "n-4",
      category: "PAYMENT_FAILED",
      title: "Online Renewal Payment Failed",
      message: "Fonepay QR transaction of Rs. 12,000 for Eastern Oil Center timed out. Station flagged for manual follow-up.",
      stationName: "Eastern Oil Center",
      timestamp: "Yesterday",
      priority: "HIGH",
      status: "READ",
    },
    {
      id: "n-5",
      category: "ANNOUNCEMENT",
      title: "System Maintenance Broadcast: IRD Sync Server",
      message: "Scheduled cloud infrastructure upgrade tonight from 01:00 AM to 02:00 AM. Station POS billing will remain 100% operational offline.",
      timestamp: "Yesterday",
      priority: "LOW",
      status: "READ",
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("All 128 Stations");
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const filteredNotifs = notifications.filter((n) => {
    if (activeCategory !== "ALL" && n.category !== activeCategory) return false;
    return true;
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const newBroadcast: SystemNotificationItem = {
      id: `n-${Date.now()}`,
      category: "ANNOUNCEMENT",
      title: broadcastTitle,
      message: `${broadcastMessage} (Target: ${broadcastTarget})`,
      timestamp: "Just now",
      priority: "MEDIUM",
      status: "UNREAD",
    };
    setNotifications([newBroadcast, ...notifications]);
    setShowBroadcastModal(false);
    setBroadcastTitle("");
    setBroadcastMessage("");
    setSendSuccess(`Announcement broadcast sent to "${broadcastTarget}".`);
    setTimeout(() => setSendSuccess(null), 4000);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Bell size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Notifications & Broadcasts (सूचना तथा सन्देश केन्द्र)
            </h2>
            <p className="text-[12px] text-text-muted">
              Live SaaS platform event stream: subscription expiring notices, payment status alerts, new registrations, and tenant broadcasts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleMarkAllRead} className="text-xs">
            <CheckCircle2 size={14} /> Mark All Read
          </GhostButton>
          <PrimaryButton onClick={() => setShowBroadcastModal(true)} className="text-xs">
            <Radio size={14} /> New Announcement Broadcast
          </PrimaryButton>
        </div>
      </div>

      {sendSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {sendSuccess}
        </div>
      )}

      {/* 2. Platform Event Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Unread Alerts"
          value={`${notifications.filter((n) => n.status === "UNREAD").length} Unread`}
          icon={Bell}
          tone="accent"
        />
        <StatCard
          label="Expiring Alerts"
          value={`${notifications.filter((n) => n.category === "SUBSCRIPTION_EXPIRING").length} Due`}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Payment Confirmations"
          value={`${notifications.filter((n) => n.category === "PAYMENT_SUCCESS").length} Confirmed`}
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="New Stations Provisioned"
          value={`${notifications.filter((n) => n.category === "NEW_STATION").length} Registered`}
          icon={Building2}
          tone="text"
        />
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { key: "ALL", label: "All Events" },
          { key: "SUBSCRIPTION_EXPIRING", label: "Subscriptions Expiring" },
          { key: "PAYMENT_SUCCESS", label: "Payments Received" },
          { key: "PAYMENT_FAILED", label: "Payment Alerts" },
          { key: "NEW_STATION", label: "New Stations" },
          { key: "ANNOUNCEMENT", label: "System Announcements" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveCategory(key)}
            className={clsx(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              activeCategory === key
                ? "bg-accent text-[#1A1306] shadow-xs"
                : "border border-border bg-surface text-text hover:bg-surface-hi"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 4. Notification Items Feed */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-muted text-xs">
            No notifications found in this category.
          </div>
        ) : (
          filteredNotifs.map((item) => {
            const isUnread = item.status === "UNREAD";
            return (
              <div
                key={item.id}
                className={clsx(
                  "rounded-2xl border p-4.5 transition-all shadow-xs space-y-2",
                  isUnread
                    ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                    : "border-border bg-surface"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs",
                        item.category === "SUBSCRIPTION_EXPIRING" && "bg-warning/20 text-warning",
                        item.category === "PAYMENT_SUCCESS" && "bg-success/20 text-success",
                        item.category === "PAYMENT_FAILED" && "bg-error/20 text-error",
                        item.category === "NEW_STATION" && "bg-accent/20 text-accent",
                        item.category === "ANNOUNCEMENT" && "bg-blue-500/20 text-blue-400"
                      )}
                    >
                      {item.category === "SUBSCRIPTION_EXPIRING" && <Clock size={16} />}
                      {item.category === "PAYMENT_SUCCESS" && <Wallet size={16} />}
                      {item.category === "PAYMENT_FAILED" && <AlertTriangle size={16} />}
                      {item.category === "NEW_STATION" && <Building2 size={16} />}
                      {item.category === "ANNOUNCEMENT" && <Radio size={16} />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold text-text text-[14px]">
                          {item.title}
                        </span>
                        <Badge
                          tone={
                            item.priority === "HIGH"
                              ? "error"
                              : item.priority === "MEDIUM"
                              ? "warning"
                              : "muted"
                          }
                        >
                          {item.category.replace(/_/g, " ")}
                        </Badge>
                        {isUnread && (
                          <span className="rounded bg-accent px-1.5 py-0.2 text-[9px] font-extrabold text-[#1A1306] uppercase">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-[12.5px] text-text-muted leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-text-muted font-mono shrink-0">
                    {item.timestamp}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Send System Announcement Broadcast                              */}
      {/* ========================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSendBroadcast}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <Radio size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Send System Announcement
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    Broadcast alert to station manager consoles
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <Field label="Announcement Title" htmlFor="bTitle">
                <Input
                  id="bTitle"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Upgrade Tonight"
                  required
                />
              </Field>

              <div>
                <label className="text-xs font-medium text-text block mb-1">Target Stations</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs text-text"
                >
                  <option value="All 128 Stations">All 128 Stations (Nationwide)</option>
                  <option value="Kathmandu Valley Hubs">Kathmandu Valley Hubs Only</option>
                  <option value="Highway & Terai Corridors">Highway & Terai Corridors</option>
                  <option value="Enterprise Plan Tier">Enterprise Plan Clients Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text block mb-1">Message Body</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Detailed maintenance or policy notice..."
                  className="w-full rounded-xl border border-border bg-bg p-3 text-xs text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <GhostButton type="button" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Send Broadcast
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
