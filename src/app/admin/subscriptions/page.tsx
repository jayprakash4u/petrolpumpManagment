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
} from "lucide-react";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import {
  SAAS_PLANS,
  SUBSCRIPTION_DURATIONS,
  calculatePackagePrice,
  type SubscriptionDuration,
} from "@/lib/subscription-plans";
import { fmtRs } from "@/lib/money";

export default function AdminSubscriptionsPage() {
  const [selectedDuration, setSelectedDuration] = useState<SubscriptionDuration>("12_MONTHS");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <CreditCard size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              SaaS License Plans & Package Durations (सफ्टवेयर सदस्यता योजनाहरू)
            </h2>
            <p className="text-[12px] text-text-muted">
              Choose subscription terms from 1 month to 3 years with automatic volume discounts, 13% VAT, and price locking.
            </p>
          </div>
        </div>
      </div>

      {/* Package Duration Selector Strip (1M, 3M, 6M, 9M, 12M, 3Y) */}
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

      {/* Pricing Plans Grid for Selected Duration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {SAAS_PLANS.map((plan) => {
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
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[19px] font-bold text-text">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="text-[11.5px] font-semibold text-accent mt-0.5">
                    {plan.nepaliName}
                  </div>
                  <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                    {plan.description}
                  </p>
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
                    <span>Effective Monthly:</span>
                    <span className="font-data font-bold text-text">
                      {fmtRs(pricing.monthlyEffective)} / mo
                    </span>
                  </div>

                  {pricing.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-success font-medium">
                      <span>{pricing.discountPercent}% Term Discount Saved:</span>
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
                    Included Features:
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
                  className={clsx(
                    "w-full justify-center text-[12.5px] py-2.5",
                    plan.popular ? "" : "bg-surface-hi border border-border text-text hover:bg-white/10"
                  )}
                >
                  Assign {SUBSCRIPTION_DURATIONS.find((d) => d.id === selectedDuration)?.label} Plan
                </PrimaryButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
