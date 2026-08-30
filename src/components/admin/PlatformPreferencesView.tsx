"use client";

import { useState } from "react";
import { Sliders, Save, CheckCircle2, Building2, ShieldCheck, Globe, Percent, Mail } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";

export function PlatformPreferencesView() {
  const [companyName, setCompanyName] = useState("Petro Cloud Technologies Pvt. Ltd.");
  const [platformPan, setPlatformPan] = useState("609182391");
  const [supportEmail, setSupportEmail] = useState("support@petrocloud.com.np");
  const [supportPhone, setSupportPhone] = useState("+977-1-4491029 / +977-9851023941");
  const [irdEndpoint, setIrdEndpoint] = useState("https://cbms.ird.gov.np/api/bill/realtime");
  const [defaultVatRate, setDefaultVatRate] = useState("13.0");
  const [gracePeriodDays, setGracePeriodDays] = useState("7");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Sliders size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Headquarters Preferences (प्लेटफर्म कन्फिगरेसन)
            </h2>
            <p className="text-[12px] text-text-muted">
              Global SaaS company credentials, IRD CBMS tax gateway URLs, statutory VAT rates, and tenant grace policies.
            </p>
          </div>
        </div>

        <PrimaryButton type="submit" className="text-[13px] px-4 py-2.5">
          <Save size={15} /> Save Preferences
        </PrimaryButton>
      </div>

      {saveSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> Platform headquarters preferences saved and synchronized across all multi-tenant nodes.
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Legal Company & Invoicing */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              SaaS Company Legal Identity
            </h3>
          </div>

          <Field label="Software Vendor Legal Name" htmlFor="cName">
            <Input
              id="cName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </Field>

          <Field label="Vendor Inland Revenue PAN" htmlFor="cPan">
            <Input
              id="cPan"
              value={platformPan}
              onChange={(e) => setPlatformPan(e.target.value)}
              required
            />
          </Field>

          <Field label="24/7 Platform Support Email" htmlFor="cEmail">
            <Input
              id="cEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
            />
          </Field>

          <Field label="Support Hotline Phone Numbers" htmlFor="cPhone">
            <Input
              id="cPhone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              required
            />
          </Field>
        </div>

        {/* 2. IRD Gateway & Regulatory Rules */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck size={18} className="text-success" />
            <h3 className="font-display text-[15px] font-bold text-text">
              IRD CBMS & Policy Configuration
            </h3>
          </div>

          <Field label="IRD Electronic Billing Gateway API URL" htmlFor="irdUrl">
            <Input
              id="irdUrl"
              value={irdEndpoint}
              onChange={(e) => setIrdEndpoint(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Statutory VAT Rate (%)" htmlFor="vatRate">
              <Input
                id="vatRate"
                value={defaultVatRate}
                onChange={(e) => setDefaultVatRate(e.target.value)}
                required
              />
            </Field>

            <Field label="Renewal Grace Period (Days)" htmlFor="graceDays">
              <Input
                id="graceDays"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="rounded-xl border border-border bg-bg p-3.5 text-[11.5px] text-text-muted space-y-1">
            <div className="font-bold text-text">Automatic Policy Enforcement:</div>
            <div>Stations expiring receive a grace period banner before forecourt billing switches to renewal lock mode.</div>
          </div>
        </div>
      </div>
    </form>
  );
}
