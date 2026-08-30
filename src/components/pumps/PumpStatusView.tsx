"use client";

import { useState } from "react";
import {
  Fuel,
  Gauge,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  User,
  Power,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { MOCK_PUMP_BAYS } from "@/lib/mock/pumps";
import type { PumpBay, PumpState } from "@/lib/pumps";

export function PumpStatusView() {
  const [bays, setBays] = useState<PumpBay[]>(MOCK_PUMP_BAYS);
  const [isStationEstop, setIsStationEstop] = useState(false);

  const activeDispensingCount = bays.filter((b) => b.state === "DISPENSING").length;
  const idleCount = bays.filter((b) => b.state === "IDLE").length;
  const totalFlowRate = bays.reduce(
    (sum, b) => sum + b.nozzles.reduce((nSum, n) => nSum + n.flowRateLpm, 0),
    0
  );
  const todayLiters = bays.reduce((sum, b) => sum + b.todayLiters, 0);
  const todaySales = bays.reduce((sum, b) => sum + b.todaySalesNpr, 0);

  const handleToggleEstop = () => {
    setIsStationEstop(!isStationEstop);
    setBays(
      bays.map((b) => ({
        ...b,
        isEstopActive: !isStationEstop,
        state: !isStationEstop ? "ESTOP_LOCKED" : "IDLE",
      }))
    );
  };

  const getPumpStateBadge = (state: PumpState) => {
    switch (state) {
      case "DISPENSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold text-success animate-pulse">
            <span className="h-2 w-2 rounded-full bg-success animate-ping" />
            DISPENSING
          </span>
        );
      case "IDLE":
        return <Badge tone="accent">IDLE READY</Badge>;
      case "AUTHORIZING":
        return <Badge tone="muted">AUTHORIZING</Badge>;
      case "PAUSED":
        return <Badge tone="muted">PAUSED</Badge>;
      case "OFFLINE":
        return <Badge tone="error">OFFLINE</Badge>;
      case "ESTOP_LOCKED":
        return <Badge tone="error">E-STOP LOCKED</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with E-Stop Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Gauge size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Live Pumps Forecourt Telemetry (प्रत्यक्ष पम्प तथा नोजल स्थिति)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Real-time dispenser hardware automation, nozzle flow telemetry, and forecourt safety controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleEstop}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[13px] font-bold transition-all shadow-sm ${
              isStationEstop
                ? "bg-success text-bg hover:bg-success/90"
                : "bg-error text-white hover:bg-error/90 animate-pulse"
            }`}
          >
            <Power size={16} />
            {isStationEstop ? "RESET EMERGENCY STOP" : "FORECOURT E-STOP"}
          </button>
        </div>
      </div>

      {/* Forecourt KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Active Dispensing"
          value={`${activeDispensingCount} / ${bays.length} Bays`}
          icon={Activity}
          tone="success"
          small
        />
        <StatCard
          label="Idle Ready"
          value={`${idleCount} Dispensers`}
          icon={CheckCircle2}
          tone="accent"
          small
        />
        <StatCard
          label="Current Total Flow"
          value={`${totalFlowRate.toFixed(1)} L/min`}
          icon={Gauge}
          tone="accent"
          small
        />
        <StatCard
          label="Today's Dispensed Volume"
          value={fmtL(todayLiters)}
          icon={Fuel}
          tone="text"
          small
        />
        <StatCard
          label="Today's Forecourt Revenue"
          value={fmtRs(todaySales)}
          icon={Zap}
          tone="success"
          small
        />
      </div>

      {/* Grid of Dispenser Bays */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {bays.map((bay) => {
          const activeNozzle = bay.nozzles.find((n) => n.state === "DISPENSING");
          return (
            <div
              key={bay.id}
              className={`rounded-2xl border bg-surface p-5 transition-all ${
                bay.state === "DISPENSING"
                  ? "border-success/40 shadow-sm"
                  : bay.state === "ESTOP_LOCKED"
                  ? "border-error/40 bg-error/5"
                  : "border-border"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[16px] font-bold text-text">
                      {bay.name}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-text-muted">
                    {bay.model} · <span className="font-mono text-[11px]">{bay.ipAddress}</span>
                  </div>
                </div>
                <div>{getPumpStateBadge(bay.state)}</div>
              </div>

              {/* Middle Section: Live Vehicle & Attendant */}
              <div className="mt-3.5 grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-lg border border-border bg-bg p-2.5">
                  <div className="text-[11px] text-text-muted flex items-center gap-1">
                    <User size={13} /> Attendant on Duty:
                  </div>
                  <div className="font-semibold text-text mt-0.5">
                    {bay.assignedAttendantName || "Unassigned"}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-bg p-2.5">
                  <div className="text-[11px] text-text-muted flex items-center gap-1">
                    <Car size={13} /> Vehicle in Bay:
                  </div>
                  <div className="font-mono font-bold text-accent mt-0.5">
                    {bay.currentVehicleNo || "None (Bay Clear)"}
                  </div>
                </div>
              </div>

              {/* Live Dispensing Dial / Monitor */}
              {bay.state === "DISPENSING" && activeNozzle && (
                <div className="mt-3.5 rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                  <div className="text-[11.5px] font-medium text-success uppercase tracking-wider">
                    Currently Dispensing: {activeNozzle.productName}
                  </div>
                  <div className="mt-1 flex items-center justify-center gap-6">
                    <div>
                      <div className="text-[11px] text-text-muted">Volume</div>
                      <div className="font-data text-[24px] font-bold text-text">
                        {activeNozzle.sessionLiters.toFixed(2)} <span className="text-[13px] text-text-muted">L</span>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div>
                      <div className="text-[11px] text-text-muted">Amount</div>
                      <div className="font-data text-[24px] font-bold text-success">
                        Rs {activeNozzle.sessionAmountNpr.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-text-muted flex items-center justify-center gap-2">
                    <Activity size={13} className="text-success animate-spin" /> Live Flow Rate:{" "}
                    <span className="font-bold text-text">{activeNozzle.flowRateLpm} L/min</span>
                  </div>
                </div>
              )}

              {/* Nozzles Strip */}
              <div className="mt-4 space-y-2">
                <div className="text-[11.5px] font-semibold text-text-muted uppercase tracking-wider">
                  Configured Nozzles ({bay.nozzles.length})
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {bay.nozzles.map((noz) => (
                    <div
                      key={noz.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2 text-[12px]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            noz.fuelType === "PETROL"
                              ? "bg-amber-500"
                              : noz.fuelType === "DIESEL"
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-text">
                            Nozzle #{noz.nozzleNumber} ({noz.fuelType})
                          </div>
                          <div className="text-[10.5px] text-text-muted">
                            Rate: Rs {noz.currentRatePerL}/L
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-text-muted">
                        {noz.state === "DISPENSING" ? (
                          <span className="text-success font-bold">LIFTED</span>
                        ) : (
                          "HUNG UP"
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11.5px] text-text-muted">
                <div>
                  Today: <span className="font-data font-semibold text-text">{fmtL(bay.todayLiters)}</span> ·{" "}
                  <span className="font-data font-semibold text-text">{fmtRs(bay.todaySalesNpr)}</span>
                </div>
                <div>Heartbeat: {bay.lastHeartbeatBS.slice(11)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
