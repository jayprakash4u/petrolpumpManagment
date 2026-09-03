"use client";

import { useState } from "react";
import {
  Settings,
  Building2,
  Mail,
  MessageSquare,
  CreditCard,
  Bell,
  Database,
  CheckCircle2,
  Lock,
  Save,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { DatabaseBackupsView } from "@/components/admin/DatabaseBackupsView";

type SettingsTab = "COMPANY" | "GATEWAYS" | "EMAIL_SMS" | "NOTIFICATIONS" | "SYSTEM";

export function PlatformSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("COMPANY");

  // Company Information State
  const [companyName, setCompanyName] = useState("Nepal PetroCloud Technologies Pvt. Ltd.");
  const [panNo, setPanNo] = useState("601928374");
  const [officialEmail, setOfficialEmail] = useState("billing@petrocloud.com.np");
  const [supportPhone, setSupportPhone] = useState("+977-1-4797257 / 9851000000");
  const [address, setAddress] = useState("New Baneshwor, Kathmandu, Nepal");
  const [website, setWebsite] = useState("https://petrocloud.com.np");

  // Email & SMS State
  const [smtpHost, setSmtpHost] = useState("smtp.sendgrid.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("apikey");
  const [smsProvider, setSmsProvider] = useState("SPARROW_SMS");
  const [smsToken, setSmsToken] = useState("sparrow_live_v2_994810294810");
  const [smsSenderId, setSmsSenderId] = useState("PETROCLOUD");

  // Payment Gateways State
  const [fonepayMerchant, setFonepayMerchant] = useState("PETROCLOUD_CORP");
  const [esewaMerchant, setEsewaMerchant] = useState("EPAYTEST");
  const [khaltiPublicKey, setKhaltiPublicKey] = useState("test_public_key_dc74e0fd57cb46cd93832aee0a505e");
  const [bankAccount, setBankAccount] = useState("01901017500129 (Nabil Bank Ltd, New Baneshwor)");

  // Notification Rules State
  const [notifyExpiringDays, setNotifyExpiringDays] = useState("15");
  const [autoSmsInvoice, setAutoSmsInvoice] = useState(true);
  const [autoEmailInvoice, setAutoEmailInvoice] = useState(true);
  const [autoSecurityAlerts, setAutoSecurityAlerts] = useState(true);

  // Success Feedback
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess("Platform settings updated successfully.");
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Settings size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Platform Settings (कम्पनी तथा प्लेटफर्म सेटिङ्हरू)
            </h2>
            <p className="text-[12px] text-text-muted">
              Configure SaaS company profile, Email/SMS notifications, Nepal payment gateways, and database system parameters.
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {saveSuccess}
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("COMPANY")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
            activeTab === "COMPANY"
              ? "border border-accent bg-accent text-[#1A1306] shadow-xs"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Building2 size={15} />
          <span>1. Company Information</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("EMAIL_SMS")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
            activeTab === "EMAIL_SMS"
              ? "border border-accent bg-accent text-[#1A1306] shadow-xs"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Mail size={15} />
          <span>2. Email & SMS Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("GATEWAYS")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
            activeTab === "GATEWAYS"
              ? "border border-accent bg-accent text-[#1A1306] shadow-xs"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <CreditCard size={15} />
          <span>3. Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
            activeTab === "NOTIFICATIONS"
              ? "border border-accent bg-accent text-[#1A1306] shadow-xs"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Bell size={15} />
          <span>4. Notification Rules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SYSTEM")}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
            activeTab === "SYSTEM"
              ? "border border-accent bg-accent text-[#1A1306] shadow-xs"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Database size={15} />
          <span>5. System & Database</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: COMPANY INFORMATION                                              */}
      {/* ========================================================================= */}
      {activeTab === "COMPANY" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-4xl">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
                <Building2 size={18} className="text-accent" /> SaaS Platform Company Profile
              </h3>
              <p className="text-[12px] text-text-muted">
                Printed on official SaaS software invoices and customer tax receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Registered Company Name" htmlFor="cName">
                <Input
                  id="cName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </Field>

              <Field label="Company PAN / VAT Registration" htmlFor="cPan">
                <Input
                  id="cPan"
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  required
                />
              </Field>

              <Field label="Official Billing & Support Email" htmlFor="cEmail">
                <Input
                  id="cEmail"
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  required
                />
              </Field>

              <Field label="Customer Support Hotline" htmlFor="cPhone">
                <Input
                  id="cPhone"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  required
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Headquarters Address" htmlFor="cAddr">
                  <Input
                    id="cAddr"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Official Website URL" htmlFor="cWeb">
                  <Input
                    id="cWeb"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <PrimaryButton type="submit">
                <Save size={14} /> Save Company Profile
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: EMAIL & SMS GATEWAY CONFIGURATION                                */}
      {/* ========================================================================= */}
      {activeTab === "EMAIL_SMS" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-4xl">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
                <Mail size={18} className="text-accent" /> SMTP Email Server Configuration
              </h3>
              <p className="text-[12px] text-text-muted">
                Used to dispatch subscription invoices, password reset codes, and system reports.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="SMTP Host Server" htmlFor="sHost">
                <Input
                  id="sHost"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  required
                />
              </Field>

              <Field label="SMTP Port" htmlFor="sPort">
                <Input
                  id="sPort"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  required
                />
              </Field>

              <Field label="SMTP Username" htmlFor="sUser">
                <Input
                  id="sUser"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  required
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
                <MessageSquare size={18} className="text-accent" /> Nepal SMS Gateway (Aakash / Sparrow SMS)
              </h3>
              <p className="text-[12px] text-text-muted">
                Direct SMS gateway for urgent fuel station alerts and subscription expiry SMS.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-text block mb-1">SMS Gateway Provider</label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg p-2.5 text-xs text-text"
                >
                  <option value="SPARROW_SMS">Sparrow SMS (Nepal)</option>
                  <option value="AAKASH_SMS">Aakash SMS Gateway</option>
                  <option value="INFOBIP">Infobip Global</option>
                </select>
              </div>

              <Field label="SMS API Authorization Token" htmlFor="sTok">
                <Input
                  id="sTok"
                  type="password"
                  value={smsToken}
                  onChange={(e) => setSmsToken(e.target.value)}
                  required
                />
              </Field>

              <Field label="Approved Sender ID" htmlFor="sSend">
                <Input
                  id="sSend"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end pt-3">
              <PrimaryButton type="submit">
                <Save size={14} /> Save Gateway Settings
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: PAYMENT GATEWAYS CONFIGURATION                                   */}
      {/* ========================================================================= */}
      {activeTab === "GATEWAYS" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-4xl">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
                <CreditCard size={18} className="text-accent" /> Nepal SaaS Payment Gateways & Banking
              </h3>
              <p className="text-[12px] text-text-muted">
                Accept subscription payments from fuel stations via Fonepay QR, eSewa, Khalti, or Bank Transfer.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Fonepay Dynamic QR Merchant Code" htmlFor="fCode">
                <Input
                  id="fCode"
                  value={fonepayMerchant}
                  onChange={(e) => setFonepayMerchant(e.target.value)}
                  required
                />
              </Field>

              <Field label="eSewa Merchant Service Code" htmlFor="eCode">
                <Input
                  id="eCode"
                  value={esewaMerchant}
                  onChange={(e) => setEsewaMerchant(e.target.value)}
                  required
                />
              </Field>

              <Field label="Khalti Public API Key" htmlFor="kKey">
                <Input
                  id="kKey"
                  value={khaltiPublicKey}
                  onChange={(e) => setKhaltiPublicKey(e.target.value)}
                  required
                />
              </Field>

              <Field label="Corporate Bank Account (for Cheque / RTGS)" htmlFor="bAcc">
                <Input
                  id="bAcc"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div className="flex justify-end pt-3">
              <PrimaryButton type="submit">
                <Save size={14} /> Save Payment Gateways
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: NOTIFICATION RULES                                               */}
      {/* ========================================================================= */}
      {activeTab === "NOTIFICATIONS" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in max-w-4xl">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
                <Bell size={18} className="text-accent" /> Automated SaaS Alerts & Notification Rules
              </h3>
              <p className="text-[12px] text-text-muted">
                Automate customer subscription alerts and renewal reminders.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Subscription Expiring Alert Window (Days Prior)" htmlFor="nDays">
                <Input
                  id="nDays"
                  type="number"
                  value={notifyExpiringDays}
                  onChange={(e) => setNotifyExpiringDays(e.target.value)}
                  required
                />
              </Field>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSmsInvoice}
                    onChange={(e) => setAutoSmsInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-text text-xs">Send Auto-SMS upon Payment Receipt</span>
                    <p className="text-[11px] text-text-muted">Dispatches instant confirmation SMS to station owner with transaction ref.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEmailInvoice}
                    onChange={(e) => setAutoEmailInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-text text-xs">Send Official Tax Invoice PDF via Email</span>
                    <p className="text-[11px] text-text-muted">Attaches Annexure-5 compliant tax bill to official station email.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-border bg-bg p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSecurityAlerts}
                    onChange={(e) => setAutoSecurityAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="font-bold text-text text-xs">Platform Security Audit Logging</span>
                    <p className="text-[11px] text-text-muted">Logs every admin password reset and suspension into tamper-proof audit trail.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <PrimaryButton type="submit">
                <Save size={14} /> Save Notification Preferences
              </PrimaryButton>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: SYSTEM & DATABASE BACKUPS                                        */}
      {/* ========================================================================= */}
      {activeTab === "SYSTEM" && (
        <div className="space-y-6 animate-fade-in">
          <DatabaseBackupsView />
        </div>
      )}
    </div>
  );
}
