"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Fuel,
  CreditCard,
  Layers,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Database,
  Lock,
  Upload,
  Image as ImageIcon,
  X,
  Briefcase,
} from "lucide-react";
import { clsx } from "clsx";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { onboardStationAction, type OnboardState } from "@/lib/actions/platform";
import { generateStationCodeFromName, formatStationId } from "@/lib/tenant";
import { fmtRs } from "@/lib/money";

const STORAGE_KEY = "fsm_new_station_draft_v4";

interface DraftData {
  // Step 1: Station Details
  name: string;
  stationId: string;   // Immutable system ID: e.g. STN-000001
  stationCode: string; // Clean station code: e.g. SHREE-001
  databaseName: string; // Tenant Key / Database Name: e.g. shree_petroleum

  // Step 2: Business Details
  companyName: string; // Legal / Business Name
  logoDataUrl: string; // Base64 or uploaded URL
  panNo: string;       // PAN Number *
  vatNo: string;       // VAT Number
  phone: string;       // Official Phone *
  email: string;       // Official Email
  address: string;     // Address *
  city: string;        // City *
  dealerCode: string;  // NOC Dealer Code

  // Step 3: Owner Account
  ownerName: string;
  ownerEmail: string;
  ownerUsername: string;
  ownerPassword: string;
  confirmPassword: string;

  // Step 4: Plan Selection
  plan: "Basic" | "Pro" | "Enterprise";
  billingCycle: "MONTHLY" | "YEARLY";
}

const INITIAL_DRAFT: DraftData = {
  name: "",
  stationId: formatStationId(129),
  stationCode: "",
  databaseName: "",
  companyName: "",
  logoDataUrl: "",
  panNo: "",
  vatNo: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  dealerCode: "",
  ownerName: "",
  ownerEmail: "",
  ownerUsername: "",
  ownerPassword: "",
  confirmPassword: "",
  plan: "Pro",
  billingCycle: "MONTHLY",
};

export function NewStationWizardView() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [draft, setDraft] = useState<DraftData>(INITIAL_DRAFT);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<OnboardState["invitationPacket"] | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraft((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // Save draft whenever it changes
  const updateDraft = (updates: Partial<DraftData>) => {
    setDraft((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Handle Logo Upload (PNG/JPG Max 2MB)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Logo image size must be less than 2 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, or SVG).");
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        updateDraft({ logoDataUrl: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate a clean, strong password
  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateDraft({ ownerPassword: gen, confirmPassword: gen });
  };

  // Step 1 Validation: Station Details
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!draft.name.trim()) return setErrorMsg("Station name is required.");
    if (!draft.stationCode.trim()) return setErrorMsg("Station code is required.");
    if (!draft.databaseName.trim()) return setErrorMsg("Tenant key is required.");

    // Prepopulate legal company name if empty
    if (!draft.companyName.trim()) {
      updateDraft({ companyName: `${draft.name.trim()} Pvt. Ltd.` });
    }

    setStep(2);
  };

  // Step 2 Validation: Business Details
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!draft.companyName.trim()) return setErrorMsg("Legal / Business name is required.");
    if (!draft.panNo.trim()) return setErrorMsg("PAN Number is required for tax & invoice compliance.");
    if (!draft.phone.trim()) return setErrorMsg("Official phone number is required.");
    if (!draft.address.trim()) return setErrorMsg("Station address is required.");
    if (!draft.city.trim()) return setErrorMsg("City is required.");

    setStep(3);
  };

  // Step 3 Validation: Station Admin Account
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!draft.ownerName.trim()) return setErrorMsg("Owner full name is required.");
    if (!draft.ownerEmail.trim()) return setErrorMsg("Owner email is required.");
    if (!draft.ownerUsername.trim()) return setErrorMsg("Owner username is required.");
    if (!draft.ownerPassword || draft.ownerPassword.length < 6) {
      return setErrorMsg("Password must be at least 6 characters.");
    }
    if (draft.ownerPassword !== draft.confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }

    setStep(4);
  };

  // Step 4 Final Submission: Review & Create
  const handleCreateStation = async () => {
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", draft.name.trim());
    formData.append("companyName", draft.companyName.trim() || `${draft.name.trim()} Pvt. Ltd.`);
    formData.append("address", `${draft.address.trim()}, ${draft.city.trim()}`);
    formData.append("phone", draft.phone.trim());
    formData.append("email", draft.email.trim() || draft.ownerEmail.trim());
    formData.append("slug", draft.stationCode.toLowerCase().trim());
    formData.append("databaseName", draft.databaseName.trim() || draft.stationCode.toLowerCase().trim().replace(/-/g, "_"));
    formData.append("panNo", draft.panNo.trim());
    formData.append("vatNo", draft.vatNo.trim() || draft.panNo.trim());
    formData.append("dealerCode", draft.dealerCode.trim());
    formData.append("logoDataUrl", draft.logoDataUrl || "");
    formData.append("ownerName", draft.ownerName.trim());
    formData.append("ownerUsername", draft.ownerUsername.toLowerCase().trim());
    formData.append("ownerPassword", draft.ownerPassword);
    formData.append("adminEmail", draft.ownerEmail.trim());
    formData.append("adminPhone", draft.phone.trim());

    startTransition(async () => {
      const res = await onboardStationAction({}, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setCreatedResult(res.invitationPacket || null);
        setStep(5);
      }
    });
  };

  const planRates = {
    Basic: { monthly: 2000, yearly: 20400 },
    Pro: { monthly: 4000, yearly: 40800 },
    Enterprise: { monthly: 7000, yearly: 71400 },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Link href="/admin/stations" className="hover:text-accent transition-colors">
              Stations
            </Link>
            <span>/</span>
            <span className="text-text font-medium">Add New Station</span>
          </div>
          <h1 className="font-display text-[22px] font-bold text-text">
            Add New Station (नयाँ पम्प दर्ता)
          </h1>
          <p className="text-[12.5px] text-text-muted">
            4-step setup: Station Details &rarr; Business Details & Logo &rarr; Admin Account &rarr; Review & Create.
          </p>
        </div>

        <Link href="/admin/stations">
          <GhostButton className="text-xs">
            Cancel & Return
          </GhostButton>
        </Link>
      </div>

      {/* 2. Step Stepper Progress (4 Steps) */}
      {step < 5 && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { num: 1, label: "1. Station Details", sub: "ID, Code & Key" },
            { num: 2, label: "2. Business Details", sub: "Logo, PAN/VAT & Address" },
            { num: 3, label: "3. Admin Account", sub: "Owner Credentials" },
            { num: 4, label: "4. Review & Create", sub: "Plan & Confirmation" },
          ].map((s) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div
                key={s.num}
                className={clsx(
                  "rounded-2xl border p-3 transition-all",
                  isCurrent
                    ? "border-accent bg-accent/10 shadow-xs"
                    : isDone
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-surface opacity-60"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={clsx(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      isCurrent
                        ? "bg-accent text-[#1A1306]"
                        : isDone
                        ? "bg-success text-white"
                        : "bg-surface-hi text-text-muted"
                    )}
                  >
                    {isDone ? <Check size={13} className="stroke-[3]" /> : s.num}
                  </div>
                  <div className="min-w-0">
                    <div
                      className={clsx(
                        "text-[12px] font-bold truncate",
                        isCurrent ? "text-accent" : isDone ? "text-success" : "text-text"
                      )}
                    >
                      {s.label}
                    </div>
                    <div className="text-[10px] text-text-muted truncate">{s.sub}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error font-medium">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: STATION DETAILS                                                  */}
      {/* ========================================================================= */}
      {step === 1 && (
        <form
          onSubmit={handleStep1Submit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in"
        >
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
              <Building2 size={18} className="text-accent" /> Step 1 — Station Details
            </h2>
            <p className="text-[12px] text-text-muted">
              Define the station display name, human-readable Station Code, and multi-tenant database key.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Station Name *" htmlFor="sName">
              <Input
                id="sName"
                value={draft.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoCode = generateStationCodeFromName(val, 1);
                  const autoTenantKey = val.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
                  updateDraft({
                    name: val,
                    companyName: draft.companyName ? draft.companyName : `${val} Pvt. Ltd.`,
                    stationCode: draft.stationCode ? draft.stationCode : autoCode,
                    databaseName: draft.databaseName ? draft.databaseName : autoTenantKey,
                  });
                }}
                placeholder="e.g. Shree Petrol Pump"
                required
              />
            </Field>

            <Field label="Station Code (Human-Readable) *" htmlFor="sCode">
              <Input
                id="sCode"
                value={draft.stationCode}
                onChange={(e) =>
                  updateDraft({
                    stationCode: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  })
                }
                placeholder="e.g. SHREE-001"
                required
              />
            </Field>

            {/* Station ID (System-Generated) & Tenant Key */}
            <div className="rounded-xl border border-border bg-bg p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-[11px] font-medium flex items-center gap-1">
                  <Lock size={12} className="text-accent" /> Station ID (System Auto-Generated)
                </span>
                <span className="text-[10px] text-text-muted uppercase">Immutable</span>
              </div>
              <div className="font-mono font-bold text-accent text-sm">
                {draft.stationId || "STN-000001"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-bg p-3.5 space-y-1">
              <label className="text-text-muted text-[11px] font-medium block">
                Tenant Key / Database Name *
              </label>
              <input
                type="text"
                value={draft.databaseName}
                onChange={(e) =>
                  updateDraft({
                    databaseName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  })
                }
                placeholder="e.g. shree_petroleum"
                required
                className="w-full font-mono text-xs bg-transparent text-text focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-[11.5px] text-text-muted">
              Auto-saved as Draft in browser storage.
            </span>

            <PrimaryButton type="submit" className="text-xs px-5 py-2.5">
              <span>Continue to Business Details</span>
              <ArrowRight size={14} />
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: BUSINESS DETAILS & LOGO                                          */}
      {/* ========================================================================= */}
      {step === 2 && (
        <form
          onSubmit={handleStep2Submit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in"
        >
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
              <Briefcase size={18} className="text-accent" /> Step 2 — Business Details & Logo
            </h2>
            <p className="text-[12px] text-text-muted">
              Upload the petrol pump logo and enter legal tax credentials used across invoices, sidebar, and receipts.
            </p>
          </div>

          {/* 1. Logo Upload Section */}
          <div className="rounded-2xl border border-border bg-bg p-4 space-y-3">
            <label className="text-xs font-bold text-text block">
              Petrol Pump Logo
            </label>

            <div className="flex flex-wrap items-center gap-4">
              {/* Logo Preview Box */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
                {draft.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.logoDataUrl}
                    alt="Station Logo Preview"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-text-muted">
                    <Fuel size={24} className="text-accent" />
                    <span className="text-[9px] font-mono mt-0.5">NO LOGO</span>
                  </div>
                )}

                {draft.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => updateDraft({ logoDataUrl: "" })}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white shadow-xs hover:bg-error/90 cursor-pointer"
                    title="Remove Logo"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Upload Action */}
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  className="hidden"
                />

                <GhostButton
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs py-2 px-3.5"
                >
                  <Upload size={14} className="text-accent" />
                  <span>{draft.logoDataUrl ? "Change Logo Image" : "Upload Logo"}</span>
                </GhostButton>

                <p className="text-[11px] text-text-muted">
                  Recommended: PNG / JPG with transparent background. Max file size: <strong>2 MB</strong>.
                  This logo is automatically reused on invoices, sidebar, and reports.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Legal Entity & Tax Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Legal / Business Name *" htmlFor="bComp">
                <Input
                  id="bComp"
                  value={draft.companyName}
                  onChange={(e) => updateDraft({ companyName: e.target.value })}
                  placeholder="e.g. Shree Petrol Pump Pvt. Ltd."
                  required
                />
              </Field>
            </div>

            <Field label="PAN / VAT Number *" htmlFor="bPan">
              <Input
                id="bPan"
                value={draft.panNo}
                onChange={(e) => updateDraft({ panNo: e.target.value })}
                placeholder="e.g. 300066034"
                required
              />
            </Field>

            <Field label="VAT Registration Number (Optional)" htmlFor="bVat">
              <Input
                id="bVat"
                value={draft.vatNo}
                onChange={(e) => updateDraft({ vatNo: e.target.value })}
                placeholder="Leave blank if same as PAN"
              />
            </Field>

            <Field label="Official Phone Number *" htmlFor="bPhone">
              <Input
                id="bPhone"
                value={draft.phone}
                onChange={(e) => updateDraft({ phone: e.target.value })}
                placeholder="e.g. 9851023941"
                required
              />
            </Field>

            <Field label="Official Email" htmlFor="bEmail">
              <Input
                id="bEmail"
                type="email"
                value={draft.email}
                onChange={(e) => updateDraft({ email: e.target.value })}
                placeholder="e.g. info@shreepump.com"
              />
            </Field>

            <Field label="Station Address *" htmlFor="bAddr">
              <Input
                id="bAddr"
                value={draft.address}
                onChange={(e) => updateDraft({ address: e.target.value })}
                placeholder="e.g. Maharajgunj Chowk"
                required
              />
            </Field>

            <Field label="City *" htmlFor="bCity">
              <Input
                id="bCity"
                value={draft.city}
                onChange={(e) => updateDraft({ city: e.target.value })}
                placeholder="e.g. Kathmandu"
                required
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="NOC Dealer Code (Optional)" htmlFor="bNoc">
                <Input
                  id="bNoc"
                  value={draft.dealerCode}
                  onChange={(e) => updateDraft({ dealerCode: e.target.value })}
                  placeholder="e.g. NOC-KTM-012"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <GhostButton type="button" onClick={() => setStep(1)} className="text-xs">
              <ArrowLeft size={14} /> Back
            </GhostButton>

            <PrimaryButton type="submit" className="text-xs px-5 py-2.5">
              <span>Continue to Admin Account</span>
              <ArrowRight size={14} />
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: STATION ADMIN ACCOUNT                                            */}
      {/* ========================================================================= */}
      {step === 3 && (
        <form
          onSubmit={handleStep3Submit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in"
        >
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
              <User size={18} className="text-accent" /> Step 3 — Station Admin Account
            </h2>
            <p className="text-[12px] text-text-muted">
              Owner login credentials given to your client to access the forecourt console.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Owner Full Name *" htmlFor="oName">
              <Input
                id="oName"
                value={draft.ownerName}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoUser = val.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
                  updateDraft({
                    ownerName: val,
                    ownerUsername: draft.ownerUsername ? draft.ownerUsername : autoUser,
                  });
                }}
                placeholder="e.g. Prakash Shrestha"
                required
              />
            </Field>

            <Field label="Owner Login Email *" htmlFor="oEmail">
              <Input
                id="oEmail"
                type="email"
                value={draft.ownerEmail}
                onChange={(e) => updateDraft({ ownerEmail: e.target.value })}
                placeholder="e.g. admin@shreepump.com"
                required
              />
            </Field>

            <Field label="Login Username *" htmlFor="oUser">
              <Input
                id="oUser"
                value={draft.ownerUsername}
                onChange={(e) =>
                  updateDraft({
                    ownerUsername: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
                  })
                }
                placeholder="e.g. shree_admin"
                required
              />
            </Field>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text">Password *</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                >
                  <Sparkles size={12} /> Generate Password
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={draft.ownerPassword}
                    onChange={(e) => updateDraft({ ownerPassword: e.target.value })}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                <Input
                  type={showPassword ? "text" : "password"}
                  value={draft.confirmPassword}
                  onChange={(e) => updateDraft({ confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <GhostButton type="button" onClick={() => setStep(2)} className="text-xs">
              <ArrowLeft size={14} /> Back
            </GhostButton>

            <PrimaryButton type="submit" className="text-xs px-5 py-2.5">
              <span>Review & Create</span>
              <ArrowRight size={14} />
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & CREATE                                                  */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5 animate-fade-in">
          <div className="border-b border-border pb-3">
            <h2 className="font-display text-[16px] font-bold text-text flex items-center gap-2">
              <CheckCircle2 size={18} className="text-accent" /> Step 4 — Review & Create Station
            </h2>
            <p className="text-[12px] text-text-muted">
              Verify all business identity details and assigned subscription before provisioning.
            </p>
          </div>

          {/* Review Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            {/* 1. Station & Business Profile Card */}
            <div className="rounded-xl border border-border bg-bg p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between font-data">
                <span className="flex items-center gap-1"><Building2 size={13} className="text-accent" /> Business Details</span>
                {draft.logoDataUrl && <span className="text-[10px] text-success">Logo Attached</span>}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-2xs">
                  {draft.logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Fuel size={20} className="text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-text text-[13px] truncate">{draft.name}</div>
                  <div className="text-text-muted text-[11px] truncate">{draft.companyName}</div>
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-t border-border/60 pt-2">
                <div><span className="text-text-muted">PAN/VAT: </span><strong className="font-mono text-text">{draft.panNo}</strong></div>
                <div><span className="text-text-muted">Code: </span><span className="font-mono font-bold text-accent">{draft.stationCode}</span> · ID: <span className="font-mono text-text">{draft.stationId}</span></div>
                <div><span className="text-text-muted">Location: </span><span className="text-text">{draft.address}, {draft.city}</span></div>
              </div>
            </div>

            {/* 2. Station Admin Card */}
            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1 font-data">
                <User size={13} className="text-accent" /> Station Admin
              </div>
              <div className="font-bold text-text text-sm">{draft.ownerName}</div>
              <div className="text-text-muted truncate">{draft.ownerEmail}</div>
              <div className="text-text font-mono text-[11px]">Username: {draft.ownerUsername}</div>
              <div className="text-success text-[10.5px]">Password configured & secure</div>
            </div>

            {/* 3. SaaS Plan Card */}
            <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1 font-data">
                <CreditCard size={13} className="text-accent" /> Assigned Plan
              </div>
              <div>
                <select
                  value={draft.plan}
                  onChange={(e) => updateDraft({ plan: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-surface p-1.5 text-xs text-text font-bold"
                >
                  <option value="Basic">Basic (Rs. 2,000/mo)</option>
                  <option value="Pro">Professional (Rs. 4,000/mo)</option>
                  <option value="Enterprise">Enterprise (Rs. 7,000/mo)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="billing"
                    checked={draft.billingCycle === "MONTHLY"}
                    onChange={() => updateDraft({ billingCycle: "MONTHLY" })}
                  />
                  <span>Monthly</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="billing"
                    checked={draft.billingCycle === "YEARLY"}
                    onChange={() => updateDraft({ billingCycle: "YEARLY" })}
                  />
                  <span>Yearly (-15%)</span>
                </label>
              </div>

              <div className="font-data font-bold text-accent text-[12px] pt-1">
                {draft.billingCycle === "YEARLY"
                  ? `${fmtRs(planRates[draft.plan].yearly)} / yr`
                  : `${fmtRs(planRates[draft.plan].monthly)} / mo`}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5 text-xs text-text-muted leading-relaxed">
            Automatic Deployment: The uploaded logo and PAN/VAT details will be automatically assigned to the station sidebar, sales invoice templates, and official reports without needing secondary setup.
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <GhostButton type="button" onClick={() => setStep(3)} className="text-xs">
              <ArrowLeft size={14} /> Back
            </GhostButton>

            <PrimaryButton
              type="button"
              onClick={handleCreateStation}
              disabled={isPending}
              className="text-xs px-6 py-2.5"
            >
              <ShieldCheck size={14} />
              <span>{isPending ? "Creating Station Tenant…" : "Create Station"}</span>
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: SUCCESS SCREEN                                                   */}
      {/* ========================================================================= */}
      {step === 5 && createdResult && (
        <div className="rounded-2xl border border-success/30 bg-surface p-8 shadow-xl space-y-6 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/20 text-success">
            <CheckCircle2 size={36} className="stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-[22px] font-bold text-text">
              Station Created Successfully
            </h2>
            <p className="text-xs text-text-muted">
              Business profile, station logo, and owner account are fully active.
            </p>
          </div>

          {/* Credentials Presentation Box */}
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-bg p-5 text-left space-y-3 text-xs">
            <div className="flex justify-between border-b border-border/80 pb-2">
              <span className="text-text-muted">Station Name:</span>
              <span className="font-bold text-text">{createdResult.stationName}</span>
            </div>

            <div className="flex justify-between border-b border-border/80 pb-2">
              <span className="text-text-muted">Station Code:</span>
              <span className="font-mono font-bold text-accent">{createdResult.stationSlug.toUpperCase()}</span>
            </div>

            <div className="flex justify-between border-b border-border/80 pb-2">
              <span className="text-text-muted">Tenant Key:</span>
              <span className="font-mono text-text">{createdResult.databaseName || createdResult.stationSlug}</span>
            </div>

            <div className="flex justify-between border-b border-border/80 pb-2">
              <span className="text-text-muted">Login Username:</span>
              <span className="font-mono font-bold text-text">{createdResult.adminUsername}</span>
            </div>

            <div className="flex justify-between border-b border-border/80 pb-2">
              <span className="text-text-muted">Login Email:</span>
              <span className="text-text">{createdResult.adminEmail || createdResult.email}</span>
            </div>

            <div className="flex justify-between pb-1">
              <span className="text-text-muted">Temporary Password:</span>
              <span className="font-mono font-bold text-accent">
                {createdResult.adminPassword}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <GhostButton
              onClick={() => {
                const text = `=========================================
⛽ PUMP-SAAS STATION LOGIN DETAILS
=========================================
Station: ${createdResult.stationName}
Station Code: ${createdResult.stationSlug.toUpperCase()}
Username: ${createdResult.adminUsername}
Password: ${createdResult.adminPassword}
Portal URL: ${window.location.origin}/login?station=${createdResult.stationSlug}
=========================================`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="text-xs px-4 py-2"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? "Copied Login Details!" : "Copy Login Details"}</span>
            </GhostButton>

            <Link href={`/admin/stations/${createdResult.stationSlug}`}>
              <PrimaryButton className="text-xs px-5 py-2">
                <span>Go to Station Details &rarr;</span>
              </PrimaryButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
