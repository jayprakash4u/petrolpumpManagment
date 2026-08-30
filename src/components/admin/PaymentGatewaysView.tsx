"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Key, ToggleLeft, ToggleRight, QrCode } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface GatewayConfig {
  id: string;
  name: string;
  provider: string;
  type: "QR_POS" | "HOST_TO_HOST" | "CLEARING_SWITCH" | "DIGITAL_WALLET";
  enabled: boolean;
  status: "ONLINE" | "MAINTENANCE";
  merchantId: string;
  successRate: string;
  dailyVolumeNpr: string;
}

export function PaymentGatewaysView() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([
    {
      id: "gw-1",
      name: "Fonepay Dynamic Forecourt QR",
      provider: "Fonepay Payment Service Ltd.",
      type: "QR_POS",
      enabled: true,
      status: "ONLINE",
      merchantId: "FP-PUMP-98410294",
      successRate: "99.8%",
      dailyVolumeNpr: "Rs 14,20,500",
    },
    {
      id: "gw-2",
      name: "Nabil Bank Host-to-Host Direct Settlement",
      provider: "Nabil Bank Ltd.",
      type: "HOST_TO_HOST",
      enabled: true,
      status: "ONLINE",
      merchantId: "NABIL-H2H-88129",
      successRate: "99.9%",
      dailyVolumeNpr: "Rs 38,90,000",
    },
    {
      id: "gw-3",
      name: "ConnectIPS (NCHL Interbank Switch)",
      provider: "Nepal Clearing House Ltd.",
      type: "CLEARING_SWITCH",
      enabled: true,
      status: "ONLINE",
      merchantId: "NCHL-CORP-4401",
      successRate: "99.5%",
      dailyVolumeNpr: "Rs 8,50,000",
    },
    {
      id: "gw-4",
      name: "eSewa Corporate Fleet Wallet",
      provider: "eSewa Ltd.",
      type: "DIGITAL_WALLET",
      enabled: false,
      status: "ONLINE",
      merchantId: "ESEWA-FLEET-2201",
      successRate: "99.1%",
      dailyVolumeNpr: "Rs 3,10,000",
    },
  ]);

  const [togglingMsg, setTogglingMsg] = useState<string | null>(null);

  const toggleGateway = (id: string) => {
    setGateways((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, enabled: !g.enabled } : g
      )
    );
    const g = gateways.find((x) => x.id === id);
    setTogglingMsg(`Gateway "${g?.name}" status updated.`);
    setTimeout(() => setTogglingMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Wallet size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Payment Gateways & Direct Settlement (डिजिटल भुक्तानी गेटवे)
            </h2>
            <p className="text-[12px] text-text-muted">
              Configure unified forecourt digital payment aggregators (Fonepay QR, Nabil Direct H2H, ConnectIPS & Wallets) for all multi-tenant pumps.
            </p>
          </div>
        </div>
      </div>

      {togglingMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {togglingMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Payment Gateways"
          value={`${gateways.filter((g) => g.enabled).length} Enabled`}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="24h Processed Volume"
          value="Rs 64.7 Lakhs"
          icon={ShieldCheck}
          tone="accent"
        />
        <StatCard
          label="Avg. Gateway Success"
          value="99.8% High"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Auto Settlement Batch"
          value="T+0 Instant"
          icon={RefreshCw}
          tone="text"
        />
      </div>

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {gateways.map((gw) => (
          <div
            key={gw.id}
            className={`rounded-2xl border p-5 space-y-4 transition-all ${
              gw.enabled
                ? "border-border bg-surface shadow-xs"
                : "border-border/60 bg-bg opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-bold text-text">{gw.name}</h3>
                </div>
                <div className="text-[12px] text-text-muted mt-0.5">{gw.provider}</div>
              </div>

              <Badge tone={gw.enabled ? "success" : "muted"}>
                {gw.enabled ? "ACTIVE" : "DISABLED"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg p-3 text-[11.5px]">
              <div>
                <span className="text-text-muted block">Merchant ID:</span>
                <span className="font-mono font-bold text-accent">{gw.merchantId}</span>
              </div>
              <div>
                <span className="text-text-muted block">24h Success Rate:</span>
                <span className="font-data font-bold text-success">{gw.successRate}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[12px] text-text-muted">
                Daily Throughput: <strong className="text-text font-data">{gw.dailyVolumeNpr}</strong>
              </span>

              <button
                type="button"
                onClick={() => toggleGateway(gw.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                  gw.enabled
                    ? "bg-error/15 text-error hover:bg-error/25"
                    : "bg-success/15 text-success hover:bg-success/25"
                }`}
              >
                {gw.enabled ? "Disable Gateway" : "Enable Gateway"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
