"use client";

import { useActionState, useState, useRef } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  KeyRound,
  User,
  Phone,
  Mail,
  MapPin,
  Send,
  Fuel,
  Lock,
  Eye,
  EyeOff,
  Database,
  HardDrive,
  FileText,
  UploadCloud,
  FileCheck,
  Layers,
  ArrowRight,
  ArrowLeft,
  Printer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  onboardStationAction,
  setStationSuspendedAction,
  type OnboardState,
  type SuspendState,
} from "@/lib/actions/platform";
import { slugFromName, normalizeSlug, generateStationCode } from "@/lib/tenant";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { clsx } from "clsx";

const onboardInitial: OnboardState = {};
const suspendInitial: SuspendState = {};

type OnboardStep = 1 | 2 | 3 | 4 | 5;

export function OnboardStationForm() {
  const [state, action, pending] = useActionState(onboardStationAction, onboardInitial);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<OnboardStep>(1);

  // -------------------------------------------------------------
  // Step 1: Basic Information
  // -------------------------------------------------------------
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [email, setEmail] = useState("");

  // -------------------------------------------------------------
  // Step 2: Business Details
  // -------------------------------------------------------------
  const [companyName, setCompanyName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [vatNo, setVatNo] = useState("");
  const [businessType, setBusinessType] = useState("Private Limited");

  // -------------------------------------------------------------
  // Step 3: Documents
  // -------------------------------------------------------------
  const [hasRegDoc, setHasRegDoc] = useState(false);
  const [hasPanDoc, setHasPanDoc] = useState(false);
  const [hasVatDoc, setHasVatDoc] = useState(false);
  const [hasOtherDoc, setHasOtherDoc] = useState(false);

  // -------------------------------------------------------------
  // Step 4: Configure Station
  // -------------------------------------------------------------
  const [templateId, setTemplateId] = useState<"A4_DETAILED" | "A4_STANDARD" | "THERMAL_80">("A4_DETAILED");
  const [paperSize, setPaperSize] = useState<"A4" | "80MM" | "58MM">("A4");
  const [fuelPetrol, setFuelPetrol] = useState(true);
  const [fuelDiesel, setFuelDiesel] = useState(true);
  const [fuelKerosene, setFuelKerosene] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // Step 5: Account & Credentials
  // -------------------------------------------------------------
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("X7kP-92mQ-L4");
  const [showPassword, setShowPassword] = useState(false);

  // Auto-calculated defaults
  const effectiveSlug = slugTouched ? slug : slugFromName(name);
  const effectiveUsername = usernameTouched
    ? ownerUsername
    : contactPerson
    ? normalizeSlug(contactPerson.split(" ")[0] || "")
    : effectiveSlug
    ? effectiveSlug.replace(/-/g, "")
    : "";

  const handleGenerateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const p1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const p2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    const p3 = Array.from({ length: 2 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    setOwnerPassword(`${p1}-${p2}-${p3}`);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const copyInvitation = () => {
    if (state.invitationPacket?.inviteText) {
      navigator.clipboard.writeText(state.invitationPacket.inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SUCCESS SCREEN — CREDENTIALS PACKET                                    */}
      {/* ========================================================================= */}
      {state.invitationPacket ? (
        <div className="animate-fade-in rounded-2xl border border-success/40 bg-success/5 p-6 shadow-lg space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-success/20 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/20 text-success shadow-inner">
                <CheckCircle2 size={26} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-text">
                  Station Created Successfully (नयाँ स्टेसन सफलतापूर्वक दर्ता भयो)
                </h3>
                <p className="text-xs text-text-muted">
                  The dedicated database partition is active and the owner account has been minted.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyInvitation}
                className="flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-xs font-bold text-[#1A1306] shadow-sm hover:bg-success/90 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} className="stroke-[3]" /> : <Copy size={14} />}
                {copied ? "Copied to Clipboard!" : "Copy Credentials"}
              </button>
            </div>
          </div>

          {/* Credentials Highlight Card */}
          <div className="rounded-xl border border-border bg-surface p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Station Name</span>
              <div className="font-bold text-text text-sm">{state.invitationPacket.stationName}</div>
            </div>

            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Station Handle Code</span>
              <div className="font-mono font-bold text-accent text-sm">{state.invitationPacket.stationSlug}</div>
            </div>

            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Station Admin Username</span>
              <div className="font-mono font-bold text-text text-sm">@{state.invitationPacket.adminUsername}</div>
            </div>

            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Temporary Password</span>
              <div className="font-mono font-bold text-success text-sm">{state.invitationPacket.adminPassword}</div>
            </div>

            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Dedicated Database</span>
              <div className="font-mono font-bold text-emerald-400">[{state.invitationPacket.databaseName}]</div>
            </div>

            <div>
              <span className="text-text-muted uppercase text-[10.5px] font-semibold tracking-wider">Portal Access</span>
              <div>
                <a
                  href={state.invitationPacket.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                >
                  Open Station Login <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp / SMS Ready Text Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-text-muted">Formatted WhatsApp / SMS / Email Message:</span>
            <pre className="font-mono text-xs leading-relaxed rounded-xl border border-border/80 bg-surface-hi p-4 text-text whitespace-pre-wrap select-all">
              {state.invitationPacket.inviteText}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link
              href="/admin"
              className="text-xs font-semibold text-text-muted hover:text-text hover:underline"
            >
              ← Return to All Stations Directory
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              + Add Another Station
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. THE 5-STEP ONBOARDING WIZARD                                            */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Step Progress Tracker Bar */}
          <div className="grid grid-cols-5 gap-2 border-b border-border pb-4">
            {[
              { num: 1, title: "1. Basic Info", sub: "सम्पर्क र ठेगाना" },
              { num: 2, title: "2. Business", sub: "दर्ता र प्यान/भ्याट" },
              { num: 3, title: "3. Documents", sub: "कागजात अपलोड" },
              { num: 4, title: "4. Configure", sub: "टेम्प्लेट र लोगो" },
              { num: 5, title: "5. Account", sub: "लगइन र पासवर्ड" },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPast = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num as OnboardStep)}
                  className={clsx(
                    "flex flex-col items-start rounded-xl p-2.5 text-left transition-all border",
                    isCurrent
                      ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent"
                      : isPast
                      ? "border-border bg-surface-hi opacity-90"
                      : "border-transparent bg-transparent opacity-50 cursor-not-allowed"
                  )}
                  disabled={s.num > step + 1}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={clsx(
                        "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                        isCurrent
                          ? "bg-accent text-[#1A1306]"
                          : isPast
                          ? "bg-success text-black"
                          : "bg-surface-hi text-text-muted"
                      )}
                    >
                      {isPast ? "✓" : s.num}
                    </span>
                    <span className={clsx("text-xs font-bold", isCurrent ? "text-accent" : "text-text")}>
                      {s.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted mt-0.5">{s.sub}</span>
                </button>
              );
            })}
          </div>

          {state.error && (
            <div className="animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3.5 text-xs text-error font-medium">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-6">
            {/* Hidden Inputs carry values across steps */}
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="address" value={address} />
            <input type="hidden" name="phone" value={phone} />
            <input type="hidden" name="contactPerson" value={contactPerson} />
            <input type="hidden" name="contactMobile" value={contactMobile} />
            <input type="hidden" name="email" value={email} />

            <input type="hidden" name="companyName" value={companyName || name} />
            <input type="hidden" name="registrationNo" value={registrationNo} />
            <input type="hidden" name="panNo" value={panNo} />
            <input type="hidden" name="vatNo" value={vatNo} />
            <input type="hidden" name="businessType" value={businessType} />

            <input type="hidden" name="templateId" value={templateId} />
            <input type="hidden" name="paperSize" value={paperSize} />

            <input type="hidden" name="slug" value={effectiveSlug} />
            <input type="hidden" name="ownerUsername" value={effectiveUsername} />
            <input type="hidden" name="ownerPassword" value={ownerPassword} />

            {/* ----------------------------------------------------------------- */}
            {/* STEP 1: BASIC INFORMATION                                         */}
            {/* ----------------------------------------------------------------- */}
            {step === 1 && (
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs animate-fade-in">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Step 1 — Basic Information (सम्पर्क तथा ठेगाना विवरण)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Enter the station name, location, and key contact person.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Station Name *" htmlFor="sName">
                      <Input
                        id="sName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Three Brothers Oil Store"
                        required
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Physical Address *" htmlFor="sAddr">
                      <Input
                        id="sAddr"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. New Baneshwor, Kathmandu"
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Station Landline / Phone *" htmlFor="sPh">
                    <Input
                      id="sPh"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01-4797257"
                      required
                    />
                  </Field>

                  <Field label="Official Email" htmlFor="sEm">
                    <Input
                      id="sEm"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. info@threebrothers.com"
                    />
                  </Field>

                  <Field label="Contact Person (Owner / Manager) *" htmlFor="sCp">
                    <Input
                      id="sCp"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Ram Bahadur Thapa"
                      required
                    />
                  </Field>

                  <Field label="Contact Mobile *" htmlFor="sCm">
                    <Input
                      id="sCm"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="e.g. 9851029384"
                      required
                    />
                  </Field>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      if (!name || !address || !phone || !contactPerson) {
                        alert("Please fill in Station Name, Address, Phone, and Contact Person.");
                        return;
                      }
                      setStep(2);
                    }}
                    className="px-6 py-2.5 text-xs font-bold"
                  >
                    Save & Continue <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* STEP 2: BUSINESS DETAILS                                          */}
            {/* ----------------------------------------------------------------- */}
            {step === 2 && (
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs animate-fade-in">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Step 2 — Business Details (व्यावसायिक तथा कर विवरण)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Collect only what your company actually needs for tax invoices and IRD records.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Registered Legal Business Name *" htmlFor="cName">
                      <Input
                        id="cName"
                        value={companyName || name}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Three Brothers Petroleum Pvt. Ltd."
                        required
                      />
                    </Field>
                  </div>

                  <Field label="Company Registration Number" htmlFor="rNo">
                    <Input
                      id="rNo"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      placeholder="e.g. 192837/078/079"
                    />
                  </Field>

                  <Field label="Business Entity Type" htmlFor="bType">
                    <Select
                      id="bType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      <option value="Private Limited">Private Limited (Pvt. Ltd.)</option>
                      <option value="Proprietorship">Proprietorship (एकलौटी)</option>
                      <option value="Partnership">Partnership (साझेदारी)</option>
                      <option value="Public Limited">Public Limited</option>
                    </Select>
                  </Field>

                  <Field label="PAN Number" htmlFor="pan">
                    <Input
                      id="pan"
                      value={panNo}
                      onChange={(e) => setPanNo(e.target.value)}
                      placeholder="e.g. 300066034"
                    />
                  </Field>

                  <Field label="VAT Number" htmlFor="vat">
                    <Input
                      id="vat"
                      value={vatNo}
                      onChange={(e) => setVatNo(e.target.value)}
                      placeholder="e.g. 300066034"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <GhostButton type="button" onClick={() => setStep(1)} className="text-xs">
                    <ArrowLeft size={14} /> Back
                  </GhostButton>
                  <PrimaryButton type="button" onClick={() => setStep(3)} className="px-6 py-2.5 text-xs font-bold">
                    Save & Continue <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* STEP 3: DOCUMENTS UPLOAD                                          */}
            {/* ----------------------------------------------------------------- */}
            {step === 3 && (
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs animate-fade-in">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Step 3 — Documents (कागजातहरू अपलोड)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Company admin uploads documents received via WhatsApp, Email, or in person.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text">Business Registration</span>
                      {hasRegDoc ? <Badge tone="success">Uploaded ✓</Badge> : <Badge tone="muted">Optional</Badge>}
                    </div>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-text-muted hover:text-text cursor-pointer hover:border-accent">
                      <FileCheck size={16} className="text-accent" />
                      <span>{hasRegDoc ? "Replace registration.pdf" : "📎 Upload registration document"}</span>
                      <input type="file" onChange={() => setHasRegDoc(true)} className="hidden" />
                    </label>
                  </div>

                  <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text">PAN Certificate</span>
                      {hasPanDoc ? <Badge tone="success">Uploaded ✓</Badge> : <Badge tone="muted">Optional</Badge>}
                    </div>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-text-muted hover:text-text cursor-pointer hover:border-accent">
                      <FileCheck size={16} className="text-accent" />
                      <span>{hasPanDoc ? "Replace pan_certificate.pdf" : "📎 Upload PAN certificate"}</span>
                      <input type="file" onChange={() => setHasPanDoc(true)} className="hidden" />
                    </label>
                  </div>

                  <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text">VAT Certificate</span>
                      {hasVatDoc ? <Badge tone="success">Uploaded ✓</Badge> : <Badge tone="muted">Optional</Badge>}
                    </div>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-text-muted hover:text-text cursor-pointer hover:border-accent">
                      <FileCheck size={16} className="text-accent" />
                      <span>{hasVatDoc ? "Replace vat_certificate.pdf" : "📎 Upload VAT certificate"}</span>
                      <input type="file" onChange={() => setHasVatDoc(true)} className="hidden" />
                    </label>
                  </div>

                  <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text">Other Supporting Document</span>
                      {hasOtherDoc ? <Badge tone="success">Uploaded ✓</Badge> : <Badge tone="muted">Optional</Badge>}
                    </div>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-text-muted hover:text-text cursor-pointer hover:border-accent">
                      <UploadCloud size={16} className="text-text-muted" />
                      <span>{hasOtherDoc ? "Document attached" : "📎 Upload additional document"}</span>
                      <input type="file" onChange={() => setHasOtherDoc(true)} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <GhostButton type="button" onClick={() => setStep(2)} className="text-xs">
                    <ArrowLeft size={14} /> Back
                  </GhostButton>
                  <PrimaryButton type="button" onClick={() => setStep(4)} className="px-6 py-2.5 text-xs font-bold">
                    Continue <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* STEP 4: CONFIGURE THE STATION                                     */}
            {/* ----------------------------------------------------------------- */}
            {step === 4 && (
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs animate-fade-in">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Step 4 — Station Configuration (सुरुवाती सेटअप र लोगो)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Pre-configure invoice templates, paper size, fuel products, and logo.
                  </p>
                </div>

                {/* Template Cards */}
                <div>
                  <label className="block text-xs font-bold text-text mb-2">
                    Choose Master Invoice Template
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { id: "A4_DETAILED", name: "A4 Detailed", desc: "Official IRD Tax Layout with HS Codes", defPaper: "A4" },
                      { id: "A4_STANDARD", name: "A4 Standard", desc: "Clean corporate invoice", defPaper: "A4" },
                      { id: "THERMAL_80", name: "Thermal 80mm", desc: "Fast continuous roll printer slip", defPaper: "80MM" },
                    ].map((t) => {
                      const isSel = templateId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTemplateId(t.id as any);
                            setPaperSize(t.defPaper as any);
                          }}
                          className={clsx(
                            "rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                            isSel
                              ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent"
                              : "border-border bg-bg hover:bg-surface-hi"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-text">{t.name}</span>
                            {isSel && <Check size={14} className="text-accent stroke-[3]" />}
                          </div>
                          <p className="text-[11px] text-text-muted">{t.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Default Paper Format" htmlFor="pSize">
                    <Select
                      id="pSize"
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as any)}
                    >
                      <option value="A4">A4 Full-Width Page</option>
                      <option value="80MM">80mm POS Thermal</option>
                      <option value="58MM">58mm Mini POS Thermal</option>
                    </Select>
                  </Field>

                  <Field label="System Currency" htmlFor="curr">
                    <Input id="curr" value="NPR (Nepali Rupees - रु)" disabled />
                  </Field>
                </div>

                {/* Fuel Products Selection */}
                <div>
                  <label className="block text-xs font-bold text-text mb-2">
                    Initial Fuel Products to Initialize
                  </label>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2 cursor-pointer hover:bg-surface-hi">
                      <input
                        type="checkbox"
                        checked={fuelPetrol}
                        onChange={(e) => setFuelPetrol(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="font-medium text-text">Petrol (MS)</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2 cursor-pointer hover:bg-surface-hi">
                      <input
                        type="checkbox"
                        checked={fuelDiesel}
                        onChange={(e) => setFuelDiesel(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="font-medium text-text">Diesel (HSD)</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2 cursor-pointer hover:bg-surface-hi">
                      <input
                        type="checkbox"
                        checked={fuelKerosene}
                        onChange={(e) => setFuelKerosene(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="font-medium text-text">Kerosene (SKO)</span>
                    </label>
                  </div>
                </div>

                {/* Logo Upload Box */}
                <div className="rounded-xl border border-border bg-bg p-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border bg-white overflow-hidden p-1.5 shadow-sm relative">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Printer size={22} className="text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <span className="text-xs font-bold text-text">Station Logo</span>
                    <p className="text-[11px] text-text-muted">
                      Attach client&apos;s logo emblem (PNG, JPG, WebP &le; 3MB)
                    </p>
                    <input
                      type="file"
                      name="logoFile"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="text-xs text-text-muted file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-[#1A1306] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <GhostButton type="button" onClick={() => setStep(3)} className="text-xs">
                    <ArrowLeft size={14} /> Back
                  </GhostButton>
                  <PrimaryButton type="button" onClick={() => setStep(5)} className="px-6 py-2.5 text-xs font-bold">
                    Continue <ArrowRight size={14} />
                  </PrimaryButton>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* STEP 5: CREATE LOGIN & PROVISION                                  */}
            {/* ----------------------------------------------------------------- */}
            {step === 5 && (
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs animate-fade-in">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-[16px] font-bold text-text">
                    Step 5 — Station Account & Provisioning (खाता र पासवर्ड)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Generate the station handle and temporary owner credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Station Identifier Code / Handle *" htmlFor="sSlug">
                    <Input
                      id="sSlug"
                      value={effectiveSlug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(normalizeSlug(e.target.value));
                      }}
                      placeholder="e.g. three-brothers"
                      required
                    />
                  </Field>

                  <Field label="Station Admin Username *" htmlFor="sUser">
                    <Input
                      id="sUser"
                      value={effectiveUsername}
                      onChange={(e) => {
                        setUsernameTouched(true);
                        setOwnerUsername(normalizeSlug(e.target.value));
                      }}
                      placeholder="e.g. threebrothers"
                      required
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Auto-Generated Temporary Password" htmlFor="sPass">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="sPass"
                            type={showPassword ? "text" : "password"}
                            value={ownerPassword}
                            onChange={(e) => setOwnerPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <GhostButton
                          type="button"
                          onClick={handleGenerateStrongPassword}
                          className="text-xs px-3 py-2 font-semibold"
                          title="Generate new temporary key"
                        >
                          <RefreshCw size={13} className="text-accent" /> Regenerate
                        </GhostButton>
                      </div>
                    </Field>
                  </div>

                  <Field label="Assigned Role" htmlFor="sRole">
                    <Input id="sRole" value="Station Admin (Owner)" disabled />
                  </Field>

                  <Field label="Account Status" htmlFor="sStat">
                    <Input id="sStat" value="● Active" disabled className="text-success font-bold" />
                  </Field>
                </div>

                <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-xs space-y-1 text-text">
                  <div className="font-bold flex items-center gap-1.5 text-success">
                    <Database size={15} /> Automated Tenant Provisioning Ready
                  </div>
                  <p className="text-text-muted">
                    Clicking &quot;Create Station&quot; will provision a dedicated SQL Server database partition, run DDL migrations, and generate the invitation packet with 1-click sharing.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <GhostButton type="button" onClick={() => setStep(4)} className="text-xs">
                    <ArrowLeft size={14} /> Back
                  </GhostButton>
                  <PrimaryButton
                    type="submit"
                    disabled={pending}
                    className="px-7 py-3 text-xs font-bold shadow-md shadow-accent/20 cursor-pointer"
                  >
                    <Building2 size={16} />
                    {pending ? "Provisioning Database & Minting Station…" : "Create Station & Generate Credentials"}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function SuspendControl({
  stationId,
  name,
  suspended,
}: {
  stationId: string;
  name: string;
  suspended: boolean;
}) {
  const [state, action, pending] = useActionState(setStationSuspendedAction, suspendInitial);
  const [open, setOpen] = useState(false);

  if (suspended) {
    return (
      <form action={action} className="flex flex-col items-end gap-1">
        <input type="hidden" name="stationId" value={stationId} />
        <input type="hidden" name="suspend" value="false" />
        <GhostButton type="submit" tone="success" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          <PlayCircle size={13} />
          {pending ? "…" : "Restore"}
        </GhostButton>
        {state.error && <span className="max-w-[260px] text-right text-[11px] text-error">{state.error}</span>}
      </form>
    );
  }

  if (!open) {
    return (
      <GhostButton type="button" tone="error" onClick={() => setOpen(true)} className="px-2.5 py-1.5 text-[12px]">
        <PauseCircle size={13} />
        Suspend
      </GhostButton>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="stationId" value={stationId} />
      <input type="hidden" name="suspend" value="true" />
      <span className="text-[11.5px] text-text-muted">Signs everyone at {name} out immediately.</span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Input name="reason" autoFocus required minLength={3} placeholder="Reason" className="w-44 px-2 py-1 text-[12px]" />
        <PrimaryButton type="submit" disabled={pending} className="px-2.5 py-1.5 text-[12px]">
          {pending ? "…" : "Confirm"}
        </PrimaryButton>
        <GhostButton type="button" onClick={() => setOpen(false)} className="px-2.5 py-1.5 text-[12px]">
          Cancel
        </GhostButton>
      </div>
      {state.error && <span className="max-w-[280px] text-right text-[11px] text-error">{state.error}</span>}
    </form>
  );
}

/* ------------------------------------------------------------------ */

export function AdminSignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <GhostButton type="submit" className="px-2.5 py-1.5 text-[12px]">
        <ShieldCheck size={13} />
        Sign out
      </GhostButton>
    </form>
  );
}
