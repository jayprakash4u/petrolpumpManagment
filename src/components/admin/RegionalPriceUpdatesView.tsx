"use client";

import { useState } from "react";
import { Radio, Fuel, Send, CheckCircle2, TrendingUp, TrendingDown, MapPin, Calendar, Clock } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface PriceBroadcast {
  id: string;
  region: string;
  petrolPrice: number;
  dieselPrice: number;
  kerosenePrice: number;
  effectiveDateBS: string;
  broadcastAtBS: string;
  status: "ACTIVE" | "SCHEDULED";
  appliedPumps: number;
}

export function RegionalPriceUpdatesView() {
  const [broadcasts, setBroadcasts] = useState<PriceBroadcast[]>([
    {
      id: "pb-1",
      region: "Kathmandu Valley & Bagmati (काठमाडौं उपत्यका)",
      petrolPrice: 172.0,
      dieselPrice: 158.0,
      kerosenePrice: 158.0,
      effectiveDateBS: "2083-05-01",
      broadcastAtBS: "2083-04-30 23:59",
      status: "ACTIVE",
      appliedPumps: 6,
    },
    {
      id: "pb-2",
      region: "Terai Highway Corridor (तराई महेन्द्र राजमार्ग)",
      petrolPrice: 170.5,
      dieselPrice: 156.5,
      kerosenePrice: 156.5,
      effectiveDateBS: "2083-05-01",
      broadcastAtBS: "2083-04-30 23:59",
      status: "ACTIVE",
      appliedPumps: 10,
    },
    {
      id: "pb-3",
      region: "Pokhara & Western Region (पोखरा तथा पश्चिमाञ्चल)",
      petrolPrice: 171.5,
      dieselPrice: 157.5,
      kerosenePrice: 157.5,
      effectiveDateBS: "2083-05-01",
      broadcastAtBS: "2083-04-30 23:59",
      status: "ACTIVE",
      appliedPumps: 4,
    },
  ]);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("All Regions (Nationwide)");
  const [newPetrol, setNewPetrol] = useState("172.00");
  const [newDiesel, setNewDiesel] = useState("158.00");
  const [newKerosene, setNewKerosene] = useState("158.00");
  const [effectiveTime, setEffectiveTime] = useState("Midnight Today (००:०० बजे देखि)");
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const newBroadcast: PriceBroadcast = {
      id: `pb-${Date.now()}`,
      region: selectedRegion,
      petrolPrice: parseFloat(newPetrol),
      dieselPrice: parseFloat(newDiesel),
      kerosenePrice: parseFloat(newKerosene),
      effectiveDateBS: "2083-05-09",
      broadcastAtBS: "2083-05-08 12:45",
      status: "ACTIVE",
      appliedPumps: 20,
    };
    setBroadcasts([newBroadcast, ...broadcasts]);
    setShowBroadcastModal(false);
    setBroadcastSuccess(
      `Nepal Oil Corporation (NOC) tariff update broadcasted to all 20 stations in "${selectedRegion}".`
    );
    setTimeout(() => setBroadcastSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Radio size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              NOC Regional Fuel Price Broadcasts (नेपाल आयल निगम मूल्य प्रसारण)
            </h2>
            <p className="text-[12px] text-text-muted">
              Broadcast official NOC tariff adjustments instantly across all station dispenser pumps and POS cashiers by province or nationally.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setShowBroadcastModal(true)} className="text-[13px] px-4 py-2.5">
          <Send size={15} /> Broadcast Price Revision
        </PrimaryButton>
      </div>

      {broadcastSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {broadcastSuccess}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="NOC Petrol Tariff"
          value="Rs 172.00 / L"
          icon={Fuel}
          tone="accent"
        />
        <StatCard
          label="NOC Diesel Tariff"
          value="Rs 158.00 / L"
          icon={Fuel}
          tone="success"
        />
        <StatCard
          label="Synced Station Tanks"
          value="20 / 20 Pumps Synced"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Sync Propagation Latency"
          value="< 450ms Nationwide"
          icon={Radio}
          tone="accent"
        />
      </div>

      {/* Regional Price Broadcasts Grid */}
      <div className="grid grid-cols-1 gap-4">
        {broadcasts.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-bold text-text">{b.region}</h3>
                  <Badge tone="success">APPLIED</Badge>
                </div>
                <div className="text-[12px] text-text-muted mt-0.5">
                  Effective from: <strong className="text-text font-data">{b.effectiveDateBS}</strong> · Broadcasted at: {b.broadcastAtBS}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[13px] font-data">
                <div className="rounded-xl border border-border bg-bg px-3 py-1.5 text-center">
                  <span className="text-[10.5px] text-text-muted block font-body">PETROL (MS)</span>
                  <span className="font-bold text-accent">Rs {b.petrolPrice.toFixed(2)}</span>
                </div>
                <div className="rounded-xl border border-border bg-bg px-3 py-1.5 text-center">
                  <span className="text-[10.5px] text-text-muted block font-body">DIESEL (HSD)</span>
                  <span className="font-bold text-success">Rs {b.dieselPrice.toFixed(2)}</span>
                </div>
                <div className="rounded-xl border border-border bg-bg px-3 py-1.5 text-center">
                  <span className="text-[10.5px] text-text-muted block font-body">KEROSENE (SKO)</span>
                  <span className="font-bold text-text">Rs {b.kerosenePrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3 text-[12px] text-text-muted">
              <span>Automatic Forecourt Meter Rate Push: <strong className="text-text font-data">{b.appliedPumps} Stations Updated</strong></span>
              <span className="text-success flex items-center gap-1 font-medium">
                <CheckCircle2 size={13} /> Synchronized with IRD CBMS
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSendBroadcast}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text">
                Broadcast NOC Fuel Price Revision
              </h3>
              <p className="text-[12px] text-text-muted">
                Push revised wholesale/retail tariffs to station pumps and billing cashiers.
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-text-muted block mb-1">
                Target Region / Province
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text"
              >
                <option value="All Regions (Nationwide)">All Regions (Nationwide 20 Stations)</option>
                <option value="Kathmandu Valley & Bagmati (काठमाडौं उपत्यका)">Kathmandu Valley (Ring Road & City)</option>
                <option value="Terai Highway Corridor (तराई महेन्द्र राजमार्ग)">Terai Highway Corridor (Chitwan, Butwal, Birgunj)</option>
                <option value="Pokhara & Western Region (पोखरा तथा पश्चिमाञ्चल)">Pokhara & Western Hills</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Petrol (MS) Rs/L" htmlFor="pPrice">
                <Input
                  id="pPrice"
                  value={newPetrol}
                  onChange={(e) => setNewPetrol(e.target.value)}
                  required
                />
              </Field>
              <Field label="Diesel (HSD) Rs/L" htmlFor="dPrice">
                <Input
                  id="dPrice"
                  value={newDiesel}
                  onChange={(e) => setNewDiesel(e.target.value)}
                  required
                />
              </Field>
              <Field label="Kerosene Rs/L" htmlFor="kPrice">
                <Input
                  id="kPrice"
                  value={newKerosene}
                  onChange={(e) => setNewKerosene(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label="Effective Cutover Time" htmlFor="effTime">
              <Input
                id="effTime"
                value={effectiveTime}
                onChange={(e) => setEffectiveTime(e.target.value)}
                placeholder="e.g. Midnight (००:०० बजे देखि)"
                required
              />
            </Field>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <GhostButton type="button" onClick={() => setShowBroadcastModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Broadcast Price Update
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
