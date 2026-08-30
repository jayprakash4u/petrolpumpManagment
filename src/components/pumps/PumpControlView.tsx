"use client";

import { useState } from "react";
import {
  Sliders,
  Power,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Send,
  Fuel,
  Cpu,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { MOCK_PUMP_BAYS } from "@/lib/mock/pumps";
import type { PumpBay } from "@/lib/pumps";

export function PumpControlView() {
  const [bays, setBays] = useState<PumpBay[]>(MOCK_PUMP_BAYS);
  const [selectedPumpId, setSelectedPumpId] = useState<string>("pump-01");
  const [presetType, setPresetType] = useState<"AMOUNT" | "VOLUME">("AMOUNT");
  const [presetValue, setPresetValue] = useState<string>("1000");
  const [isStationEstop, setIsStationEstop] = useState(false);
  const [commandLog, setCommandLog] = useState<string[]>([
    "[10:45:00] Station Controller Loop Initialized: RS485 Loop Ready",
    "[10:46:12] Pump 01: Dispense Authorized for Sajha Bus",
    "[10:47:04] Pump 02: Petrol Rate Latched to Rs 170.00/L",
  ]);

  const togglePumpLock = (pumpId: string) => {
    setBays(
      bays.map((b) => {
        if (b.id === pumpId) {
          const isNowLocked = b.state !== "OFFLINE";
          const newLog = `[${new Date().toLocaleTimeString()}] Pump #${b.pumpNumber}: ${
            isNowLocked ? "Manual Bay Lockout Engaged" : "Bay Unlocked & Ready"
          }`;
          setCommandLog((prev) => [newLog, ...prev]);
          return { ...b, state: isNowLocked ? "OFFLINE" : "IDLE" };
        }
        return b;
      })
    );
  };

  const handleSendPreset = () => {
    const pump = bays.find((b) => b.id === selectedPumpId);
    if (!pump) return;
    const msg = `[${new Date().toLocaleTimeString()}] Pump #${pump.pumpNumber}: Sent Preset Command -> ${
      presetType === "AMOUNT" ? `Rs ${presetValue}` : `${presetValue} Liters`
    } Auto-Cutoff Latch`;
    setCommandLog((prev) => [msg, ...prev]);
  };

  const handleSyncRates = () => {
    const msg = `[${new Date().toLocaleTimeString()}] Broadcast: Synchronized Fuel Rates to all 4 Dispenser heads (Petrol: Rs 170.00, Diesel: Rs 150.00, CNG: Rs 110.00)`;
    setCommandLog((prev) => [msg, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Sliders size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Pump Automation & Forecourt Control (पम्प नियन्त्रण तथा कमाण्ड केन्द्र)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Hardware protocol commands, emergency cutoff relays, dispenser lockout, and electronic price latching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handleSyncRates} className="text-[12.5px]">
            <RefreshCw size={14} /> Sync Rates to Pumps
          </GhostButton>
        </div>
      </div>

      {/* Main Grid: Control Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Preset & Command Console (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Preset Command Box */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 font-display text-[15px] font-bold text-text mb-1">
              <Fuel size={17} className="text-accent" /> Dispenser Preset & Authorization Console
            </div>
            <p className="text-[12px] text-text-muted mb-4">
              Send automatic preset volume or cash cut-off limits directly to the dispenser electronics.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">Target Bay:</label>
                <select
                  value={selectedPumpId}
                  onChange={(e) => setSelectedPumpId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-text"
                >
                  {bays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">Preset Limit Type:</label>
                <select
                  value={presetType}
                  onChange={(e) => setPresetType(e.target.value as "AMOUNT" | "VOLUME")}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-text"
                >
                  <option value="AMOUNT">Fixed Cash Amount (NPR)</option>
                  <option value="VOLUME">Fixed Volume (Liters)</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-text-muted block mb-1">Limit Value:</label>
                <input
                  type="number"
                  value={presetValue}
                  onChange={(e) => setPresetValue(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] font-data text-text"
                  placeholder={presetType === "AMOUNT" ? "e.g. 2000" : "e.g. 25"}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="flex gap-2">
                {presetType === "AMOUNT" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPresetValue("500")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      Rs 500
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("1000")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      Rs 1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("2000")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      Rs 2,000
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("5000")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      Rs 5,000
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setPresetValue("5")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      5 L
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("10")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      10 L
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("25")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      25 L
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetValue("50")}
                      className="rounded bg-surface-hi px-2.5 py-1 text-[11.5px] text-text hover:bg-border"
                    >
                      50 L
                    </button>
                  </>
                )}
              </div>

              <PrimaryButton onClick={handleSendPreset} className="text-[12.5px]">
                <Send size={14} /> Send Preset to Pump
              </PrimaryButton>
            </div>
          </div>

          {/* Individual Pump Bay Lockout Controls */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="font-display text-[15px] font-bold text-text mb-1">
              Individual Bay Lockouts & Isolation Relays
            </div>
            <p className="text-[12px] text-text-muted mb-4">
              Isolate or lock individual dispenser heads for maintenance, meter tests, or tank dip measurement.
            </p>

            <div className="space-y-3">
              {bays.map((bay) => {
                const isLocked = bay.state === "OFFLINE";
                return (
                  <div
                    key={bay.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-bg p-3"
                  >
                    <div>
                      <div className="font-semibold text-text text-[13px]">{bay.name}</div>
                      <div className="text-[11.5px] text-text-muted">
                        Status:{" "}
                        <span className={isLocked ? "text-error font-bold" : "text-success font-bold"}>
                          {isLocked ? "LOCKED OUT (ISOLATED)" : "ONLINE (READY)"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePumpLock(bay.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        isLocked
                          ? "bg-success/15 text-success hover:bg-success/25"
                          : "bg-error/15 text-error hover:bg-error/25"
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Unlock size={14} /> Unlock Bay
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Lock Bay Out
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Controller Telemetry & Activity Log (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Forecourt Controller Box */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 font-display text-[14px] font-bold text-text mb-3">
              <Cpu size={17} className="text-accent" /> Automation Controller Status
            </div>

            <div className="space-y-2 text-[12px] text-text-muted">
              <div className="flex justify-between">
                <span>Protocol Driver:</span>
                <span className="font-mono text-text">Wayne Dart / Tatsuno 2-Wire</span>
              </div>
              <div className="flex justify-between">
                <span>Interface Loop:</span>
                <span className="font-mono text-text">RS-485 Optical Loop</span>
              </div>
              <div className="flex justify-between">
                <span>Baud Rate:</span>
                <span className="font-mono text-text">9600 bps · 8N1</span>
              </div>
              <div className="flex justify-between">
                <span>Controller Heartbeat:</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active (0 ms Latency)
                </span>
              </div>
            </div>
          </div>

          {/* Live Command Log */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between font-display text-[14px] font-bold text-text mb-3">
              <span>Command Audit Stream</span>
              <Badge tone="accent">Live</Badge>
            </div>

            <div className="h-64 overflow-y-auto rounded-lg border border-border bg-bg p-3 font-mono text-[11px] space-y-1.5 text-text-muted">
              {commandLog.map((log, idx) => (
                <div key={idx} className="text-text">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
