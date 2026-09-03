"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Sparkles,
  Building2,
  Calendar,
  Percent,
  CheckCircle2,
  Lock,
  Edit3,
  Users,
  Fuel,
  Receipt,
  Plus,
  X,
  Sliders,
} from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import {
  SUBSCRIPTION_DURATIONS,
  calculatePackagePrice,
  type SubscriptionDuration,
} from "@/lib/subscription-plans";
import { fmtRs } from "@/lib/money";

export interface SaasPlanConfig {
  id: string;
  name: string;
  nepaliName: string;
  monthlyRateNpr: number;
  popular?: boolean;
  active: boolean;
  description: string;
  maxTanks: number | "UNLIMITED";
  maxStaff: number | "UNLIMITED";
  features: string[];
}

export function CompanyPlansView() {
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionDuration>("12_MONTHS");

  const [plans, setPlans] = useState<SaasPlanConfig[]>([
    {
      id: "plan-basic",
      name: "Basic Plan",
      nepaliName: "आधारभूत योजना",
      monthlyRateNpr: 2000,
      active: true,
      description: "Ideal for small single-island highway or town fuel stations.",
      maxTanks: 2,
      maxStaff: 3,
      features: [
        "Up to 2 Fuel Tanks & Nozzles",
        "Up to 3 Cashier / Attendant Logins",
        "Fast 80mm / 58mm Thermal POS Billing",
        "Daily Cash & Credit Reconciliation",
        "Standard Business Support",
      ],
    },
    {
      id: "plan-pro",
      name: "Professional Plan",
      nepaliName: "व्यावसायिक योजना (IRD प्रमाणित)",
      monthlyRateNpr: 4000,
      popular: true,
      active: true,
      description: "Complete ERP for busy petrol stations with official Nepal IRD tax billing.",
      maxTanks: 6,
      maxStaff: 10,
      features: [
        "Up to 6 Fuel Tanks & Multi-Nozzle Dip Logs",
        "Up to 10 Cashier, Accountant & Manager Accounts",
        "A4 Tax Invoices with IRD VAT Annexure-5",
        "Credit Customer Passbook & Vehicle Fleet Limits",
        "Shift End Cash Handover & Expense Audits",
        "Priority Hotline Support",
      ],
    },
    {
      id: "plan-enterprise",
      name: "Enterprise Plan",
      nepaliName: "कर्पोरेट तथा बहु-पम्प समूह",
      monthlyRateNpr: 7000,
      active: true,
      description: "For petroleum distributors, multi-station chains, and large forecourt plazas.",
      maxTanks: "UNLIMITED",
      maxStaff: "UNLIMITED",
      features: [
        "Unlimited Fuel Tanks, CNG & Multi-Island Nozzles",
        "Unlimited Staff & Cashier User Accounts",
        "Multi-Station Corporate Dashboard",
        "Automatic SMS/Email Customer Fuel Receipts",
        "Custom API Integration with Tank Automation",
        "24/7 Dedicated Account Manager & SLA",
      ],
    },
  ]);

  // Edit Plan Modal
  const [editingPlan, setEditingPlan] = useState<SaasPlanConfig | null>(null);

  // Assign Plan Modal
  const [assigningPlan, setAssigningPlan] = useState<SaasPlanConfig | null>(null);
  const [targetStationSlug, setTargetStationSlug] = useState("abc-petrol");
  const [assignDuration, setAssignDuration] = useState<SubscriptionDuration>("12_MONTHS");
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const mockStations = [
    { slug: "abc-petrol", name: "ABC Petrol Pump (Kathmandu)" },
    { slug: "xyz-fuel", name: "XYZ Fuel Station (Lalitpur)" },
    { slug: "shree-pashupati", name: "Shree Pashupati Petroleum (Kathmandu)" },
    { slug: "pokhara-highway", name: "Pokhara Highway Fuel Center (Pokhara)" },
    { slug: "everest-oil", name: "Everest Oil Traders (Bharatpur)" },
  ];

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlans((prev) =>
      prev.map((p) => (p.id === editingPlan.id ? editingPlan : p))
    );
    setEditingPlan(null);
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningPlan) return;
    const stName = mockStations.find((s) => s.slug === targetStationSlug)?.name || targetStationSlug;
    setAssignSuccess(`Assigned "${assigningPlan.name}" (${SUBSCRIPTION_DURATIONS.find(d => d.id === assignDuration)?.label}) to ${stName}.`);
    setAssigningPlan(null);
    setTimeout(() => setAssignSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <CreditCard size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Plans & Subscriptions Management (सदस्यता योजना व्यवस्थापन)
            </h2>
            <p className="text-[12px] text-text-muted">
              Configure SaaS subscription pricing tiers, feature matrices, tank/user quotas, and assign plans to petrol stations.
            </p>
          </div>
        </div>
      </div>

      {assignSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {assignSuccess}
        </div>
      )}

      {/* 2. Billing Tenure Selector Strip */}
      <div className="flex flex-col items-center justify-center space-y-2 p-2">
        <div className="text-[12px] font-bold uppercase tracking-wider text-text-muted">
          Select Subscription Billing Tenure (अवधि छनौट गर्नुहोस्):
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl border border-border bg-surface shadow-xs">
          {SUBSCRIPTION_DURATIONS.map((dur) => {
            const isSelected = selectedDuration === dur.id;
            return (
              <button
                key={dur.id}
                type="button"
                onClick={() => setSelectedDuration(dur.id)}
                className={clsx(
                  "relative flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all cursor-pointer",
                  isSelected
                    ? "bg-accent text-[#1A1306] shadow-sm font-bold"
                    : "text-text-muted hover:bg-surface-hi hover:text-text"
                )}
              >
                <span>{dur.label}</span>
                {dur.badge && (
                  <span
                    className={clsx(
                      "rounded px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase",
                      isSelected
                        ? "bg-black/20 text-[#1A1306]"
                        : "bg-accent/20 text-accent"
                    )}
                  >
                    {dur.badge.split("·")[0]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pricing Plans Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const pricing = calculatePackagePrice(plan.monthlyRateNpr, selectedDuration);

          return (
            <div
              key={plan.id}
              className={clsx(
                "rounded-2xl border p-6 flex flex-col justify-between transition-all relative",
                plan.popular
                  ? "border-accent bg-accent/5 shadow-md ring-1 ring-accent/30"
                  : "border-border bg-surface shadow-xs"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-accent px-3 py-0.5 text-[11px] font-bold text-[#1A1306] shadow-xs">
                  MOST POPULAR
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-[20px] font-bold text-text">
                      {plan.name}
                    </h3>
                    <div className="text-[11.5px] font-semibold text-accent mt-0.5">
                      {plan.nepaliName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingPlan(plan)}
                    className="rounded-lg border border-border bg-surface-hi p-1.5 text-text-muted hover:text-accent transition-colors"
                    title="Edit Plan Config"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>

                <p className="text-[12px] text-text-muted leading-relaxed">
                  {plan.description}
                </p>

                {/* Quota Badges */}
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-lg border border-border bg-bg px-2.5 py-1 text-text flex items-center gap-1.5 font-medium">
                    <Fuel size={13} className="text-accent" />
                    {plan.maxTanks === "UNLIMITED" ? "Unlimited Tanks" : `Up to ${plan.maxTanks} Tanks`}
                  </span>
                  <span className="rounded-lg border border-border bg-bg px-2.5 py-1 text-text flex items-center gap-1.5 font-medium">
                    <Users size={13} className="text-accent" />
                    {plan.maxStaff === "UNLIMITED" ? "Unlimited Users" : `Up to ${plan.maxStaff} Users`}
                  </span>
                </div>

                {/* Price Display */}
                <div className="rounded-xl border border-border bg-bg p-3.5 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12px] text-text-muted">Package Total:</span>
                    <span className="font-display text-2xl font-extrabold text-accent font-data">
                      {fmtRs(pricing.grossPayable)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11.5px] text-text-muted pt-1 border-t border-border/60">
                    <span>Base Monthly Price:</span>
                    <span className="font-data font-bold text-text">
                      Rs. {plan.monthlyRateNpr.toLocaleString("en-IN")} / mo
                    </span>
                  </div>

                  {pricing.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-success font-medium">
                      <span>{pricing.discountPercent}% Term Discount:</span>
                      <span className="font-data">-{fmtRs(pricing.discountAmount)}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-text-muted/70 text-right">
                    Includes 13% Nepal VAT ({fmtRs(pricing.vatAmount)})
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="border-t border-border pt-3.5 space-y-2.5">
                  <div className="text-[11.5px] font-bold uppercase tracking-wider text-text-muted">
                    Features & Limits:
                  </div>
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12.5px] text-text">
                      <Check size={16} className="text-success shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    setAssigningPlan(plan);
                    setAssignDuration(selectedDuration);
                  }}
                  className={clsx(
                    "w-full justify-center text-[12.5px] py-2.5",
                    plan.popular ? "" : "bg-surface-hi border border-border text-text hover:bg-white/10"
                  )}
                >
                  Assign to Station &rarr;
                </PrimaryButton>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Edit Plan Configurations                                       */}
      {/* ========================================================================= */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSavePlan}
            className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Edit Plan: {editingPlan.name}
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    Adjust pricing, limits and status
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <Field label="Plan Display Name" htmlFor="plName">
                <Input
                  id="plName"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  required
                />
              </Field>

              <Field label="Monthly Price (NPR)" htmlFor="plPrice">
                <Input
                  id="plPrice"
                  type="number"
                  value={editingPlan.monthlyRateNpr}
                  onChange={(e) => setEditingPlan({ ...editingPlan, monthlyRateNpr: Number(e.target.value) })}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text block mb-1">Max Tanks Quota</label>
                  <select
                    value={String(editingPlan.maxTanks)}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxTanks: e.target.value === "UNLIMITED" ? "UNLIMITED" : Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-bg p-2 text-xs text-text"
                  >
                    <option value="2">2 Tanks</option>
                    <option value="4">4 Tanks</option>
                    <option value="6">6 Tanks</option>
                    <option value="UNLIMITED">Unlimited Tanks</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-text block mb-1">Max Users Quota</label>
                  <select
                    value={String(editingPlan.maxStaff)}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxStaff: e.target.value === "UNLIMITED" ? "UNLIMITED" : Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-bg p-2 text-xs text-text"
                  >
                    <option value="3">3 Users</option>
                    <option value="5">5 Users</option>
                    <option value="10">10 Users</option>
                    <option value="UNLIMITED">Unlimited Users</option>
                  </select>
                </div>
              </div>

              <Field label="Plan Description" htmlFor="plDesc">
                <Input
                  id="plDesc"
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  required
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <GhostButton type="button" onClick={() => setEditingPlan(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Save Changes
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Modal: Assign Plan to a Station                                       */}
      {/* ========================================================================= */}
      {assigningPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleConfirmAssign}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[#1A1306]">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Assign Plan to Station
                  </h3>
                  <div className="text-[11px] text-text-muted">
                    {assigningPlan.name} (Rs. {assigningPlan.monthlyRateNpr.toLocaleString("en-IN")}/mo)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssigningPlan(null)}
                className="rounded-lg p-1.5 text-text-muted hover:bg-white/10 hover:text-text cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-[12.5px]">
              <div>
                <label className="text-xs font-medium text-text block mb-1">
                  Select Target Fuel Station
                </label>
                <select
                  value={targetStationSlug}
                  onChange={(e) => setTargetStationSlug(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs text-text"
                >
                  {mockStations.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text block mb-1">
                  Subscription Duration
                </label>
                <select
                  value={assignDuration}
                  onChange={(e) => setAssignDuration(e.target.value as any)}
                  className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs text-text"
                >
                  {SUBSCRIPTION_DURATIONS.map((dur) => (
                    <option key={dur.id} value={dur.id}>
                      {dur.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-border bg-bg p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-text-muted">Calculated Fee:</span>
                  <span className="font-bold text-accent font-data">
                    {fmtRs(calculatePackagePrice(assigningPlan.monthlyRateNpr, assignDuration).grossPayable)}
                  </span>
                </div>
                <div className="text-[10.5px] text-text-muted">
                  Includes 13% VAT and automatic validity extension.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <GhostButton type="button" onClick={() => setAssigningPlan(null)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Confirm Plan Assignment
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
