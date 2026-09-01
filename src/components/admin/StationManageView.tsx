"use client";

import { useState, useActionState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import {
  Building2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Fuel,
  Users,
  HardDrive,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Clock,
  Check,
  Copy,
  Edit3,
  Phone,
  Mail,
  MapPin,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  Printer,
  UploadCloud,
  Trash2,
  FileText,
  Sliders,
  Palette,
  CheckSquare,
  Square,
  Receipt,
  HelpCircle,
  Layers,
} from "lucide-react";
import {
  updateStationProfileAdminAction,
  updateStationAdminCredentialsAction,
  updateStationStaffProfileAdminAction,
  updateStationInvoiceByAdminAction,
  uploadStationLogoByAdminAction,
  type UpdateStationProfileState,
  type StationAdminCredentialState,
  type StationStaffProfileState,
  type StationInvoiceAdminState,
} from "@/lib/actions/platform";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SuspendControl } from "@/components/admin/AdminForms";
import { fmtBSLong } from "@/lib/bs-date";
import { FUEL_LABEL, type FuelId } from "@/lib/fuel";
import { TaxInvoice } from "@/components/sales/TaxInvoice";
import type { MergedStationInvoiceConfig } from "@/lib/invoice-settings";
import type { ReceiptDTO } from "@/lib/actions/sales";

interface StationManageProps {
  slug: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    companyName: string | null;
    address: string;
    phone: string | null;
    email: string | null;
    databaseName: string;
    databaseServer: string;
    status: string;
    createdAt: Date;
    suspendedAt: Date | null;
    suspendedReason: string | null;
  };
  station: {
    id: string;
    name: string;
    companyName: string | null;
    address: string;
    phone: string | null;
    email: string | null;
    panNo?: string | null;
    vatNo?: string | null;
    dealerCode?: string | null;
    logoUrl?: string | null;
    tanks: Array<{
      id: string;
      fuel: string;
      capacityL: number;
      levelL: number;
      ratePerL: number;
    }>;
    users: Array<{
      id: string;
      name: string;
      username: string;
      role: string;
      employeeId: string | null;
      active: boolean;
      createdAt: Date;
      onShift: boolean;
      phone: string | null;
      email: string | null;
    }>;
  } | null;
  invoiceConfig?: MergedStationInvoiceConfig | null;
  stats: {
    tanksCount: number;
    staffCount: number;
    salesCount: number;
    customersCount: number;
  };
}

type StationUser = NonNullable<StationManageProps["station"]>["users"][number];
type SetupTab = "REGISTRATION" | "INVOICE" | "TANKS" | "STAFF";

export function StationManageView({ slug, tenant, station, invoiceConfig, stats }: StationManageProps) {
  const [activeTab, setActiveTab] = useState<SetupTab>("REGISTRATION");

  // Part 1: Registration Profile State
  const [profileState, profileAction, profilePending] = useActionState(
    updateStationProfileAdminAction,
    {} as UpdateStationProfileState
  );

  // Part 2: Invoice & Branding Studio State
  const [invoiceState, invoiceAction, invoicePending] = useActionState(
    updateStationInvoiceByAdminAction,
    {} as StationInvoiceAdminState
  );

  // Local Form state for interactive real-time invoice preview
  const [liveConfig, setLiveConfig] = useState<MergedStationInvoiceConfig>(
    invoiceConfig || {
      stationName: tenant.name,
      companyName: tenant.companyName || "",
      address: tenant.address,
      phone: tenant.phone || "",
      email: tenant.email || "",
      panNo: station?.panNo || "",
      vatNo: station?.vatNo || "",
      dealerCode: station?.dealerCode || "",
      logoUrl: station?.logoUrl || null,

      showLogo: true,
      logoPosition: "CENTER",
      logoSize: "MEDIUM",
      showPan: true,
      showVat: true,
      showVehicle: true,
      showCustomerAddress: true,
      showCustomerPan: true,
      showCustomerPhone: true,
      showSignature: true,
      showAmountInWords: true,
      showPaymentMode: true,
      showDiscount: true,
      showQrCode: false,
      showRate: true,
      primaryColor: "#000000",
      accentColor: "#000000",
      paperSize: "A4",
      headerTitle: "Invoice",
      footerGreeting: "Thank you for fueling with us! Safe Journey.",
      termsNotes: "Subject to Kathmandu jurisdiction. Goods once sold will not be taken back.",
    }
  );

  const router = useRouter();

  // Logo upload state
  const [isLogoPending, startLogoTransition] = useTransition();
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Part 4: User Credential Reset State
  const [credState, credAction, credPending] = useActionState(
    updateStationAdminCredentialsAction,
    {} as StationAdminCredentialState
  );

  // Staff Profile Edit State
  const [staffProfileState, staffProfileAction, staffProfilePending] = useActionState(
    updateStationStaffProfileAdminAction,
    {} as StationStaffProfileState
  );

  const [selectedUser, setSelectedUser] = useState<StationUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [viewingUser, setViewingUser] = useState<StationUser | null>(null);
  const [editingUser, setEditingUser] = useState<StationUser | null>(null);

  const handleGenerateKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(gen);
  };

  const handleCopyCredentials = (uname: string, pass: string) => {
    const text = `Station Code: ${slug}\nUsername: ${uname}\nPassword: ${pass}\nPortal: ${window.location.origin}/login?station=${slug}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setLogoMessage(null);

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("logoFile", file);

    startLogoTransition(async () => {
      const res = await uploadStationLogoByAdminAction(formData);
      if (res.error) {
        setLogoError(res.error);
      } else if (res.logoUrl) {
        setLogoMessage(res.message || "Station logo uploaded successfully!");
        setLiveConfig((prev) => ({ ...prev, logoUrl: res.logoUrl || null, showLogo: true }));
        router.refresh();
      }
    });
  };

  // Mock Receipt for Live Invoice Preview
  const sampleReceipt: ReceiptDTO = {
    receiptNo: 1042,
    billNumber: "INV-2081-0142",
    stationName: liveConfig.stationName || tenant.name,
    fuelLabel: "MS - PETROL",
    liters: "45.00 Ltr",
    rate: "172.00",
    total: "7,740.00",
    grandTotal: "7,740.00",
    subtotal: "6,849.56",
    taxableAmount: "6,849.56",
    vatAmount: "890.44",
    discount: undefined,
    customerName: "Apex Logistics & Transport Pvt. Ltd.",
    customerPanNo: "601928374",
    customerPhone: "9851029384",
    vehicleNo: "BA 2 KHA 8942",
    paymentMethod: "CASH",
    onlineProvider: null,
    paymentRef: null,
    changeDue: null,
    soldBy: "Ramesh Sharma (Senior Operator)",
    at: new Date().toISOString(),
    dateBS: "२०८१/०५/१७",
  };

  const isSuspended = tenant.status === "SUSPENDED";

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg hover:bg-surface-hi transition-colors text-text-muted hover:text-text"
            title="Back to Stations Directory"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-[19px] font-bold text-text">
                {tenant.name}
              </h2>
              <span className="font-mono rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                {tenant.slug}
              </span>
              <Badge tone={isSuspended ? "error" : "success"}>
                {tenant.status}
              </Badge>
            </div>
            <p className="text-[12px] text-text-muted">
              Dedicated Database: <code className="font-mono text-success font-bold">[{tenant.databaseName}]</code> on <code className="font-mono text-text">{tenant.databaseServer}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/login?station=${slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-bold text-accent hover:bg-accent/20 transition-all"
          >
            <ExternalLink size={13} /> Open Station Portal
          </a>
          <SuspendControl
            stationId={tenant.id}
            name={tenant.name}
            suspended={isSuspended}
          />
        </div>
      </div>

      {/* 2. Structured Part-Wise Setup Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("REGISTRATION")}
          className={clsx(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
            activeTab === "REGISTRATION"
              ? "border border-accent bg-accent text-[#1A1306] shadow-sm"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Building2 size={15} />
          <span>Part 1: Registration & Legal Profile</span>
          <span className={clsx("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "REGISTRATION" ? "bg-black/20 text-[#1A1306]" : "bg-bg text-text-muted")}>
            दर्ता विवरण
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("INVOICE")}
          className={clsx(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
            activeTab === "INVOICE"
              ? "border border-accent bg-accent text-[#1A1306] shadow-sm"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Printer size={15} />
          <span>Part 2: Invoice & Branding Studio</span>
          <span className={clsx("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "INVOICE" ? "bg-black/20 text-[#1A1306]" : "bg-bg text-text-muted")}>
            लोगो र बिल
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TANKS")}
          className={clsx(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
            activeTab === "TANKS"
              ? "border border-accent bg-accent text-[#1A1306] shadow-sm"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <Fuel size={15} />
          <span>Part 3: Fuel Tanks & Rates</span>
          <span className={clsx("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "TANKS" ? "bg-black/20 text-[#1A1306]" : "bg-bg text-text-muted")}>
            {stats.tanksCount} Tanks
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STAFF")}
          className={clsx(
            "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all",
            activeTab === "STAFF"
              ? "border border-accent bg-accent text-[#1A1306] shadow-sm"
              : "border border-border bg-surface text-text hover:bg-surface-hi"
          )}
        >
          <KeyRound size={15} />
          <span>Part 4: Staff & Account Access</span>
          <span className={clsx("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === "STAFF" ? "bg-black/20 text-[#1A1306]" : "bg-bg text-text-muted")}>
            {stats.staffCount} Accounts
          </span>
        </button>
      </div>

      {/* Global Prominent Status Alert Banners */}
      {profileState?.message && activeTab === "REGISTRATION" && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-success/40 bg-success/15 p-4 text-xs text-success font-bold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" /> {profileState.message}
        </div>
      )}
      {profileState?.error && activeTab === "REGISTRATION" && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-error/40 bg-error/15 p-4 text-xs text-error font-bold shadow-sm">
          <AlertCircle size={18} className="shrink-0" /> {profileState.error}
        </div>
      )}

      {invoiceState?.message && activeTab === "INVOICE" && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-success/40 bg-success/15 p-4 text-xs text-success font-bold shadow-sm">
          <CheckCircle2 size={18} className="shrink-0" /> {invoiceState.message}
        </div>
      )}
      {invoiceState?.error && activeTab === "INVOICE" && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-error/40 bg-error/15 p-4 text-xs text-error font-bold shadow-sm">
          <AlertCircle size={18} className="shrink-0" /> {invoiceState.error}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 1: REGISTRATION & LEGAL PROFILE SETUP                                */}
      {/* ========================================================================= */}
      {activeTab === "REGISTRATION" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-fade-in">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-accent" />
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Part 1: Station Legal Profile (पम्प दर्ता विवरण सम्पादन)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-text-muted">Super Admin Master Setup</span>
              </div>

              <form action={profileAction} className="space-y-4">
                <input type="hidden" name="slug" value={slug} />

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="Station / Pump Display Name" htmlFor="pName">
                    <Input
                      id="pName"
                      name="name"
                      defaultValue={tenant.name}
                      placeholder="e.g. Three Brothers Oil Store"
                      required
                    />
                  </Field>

                  <Field label="Registered Company / Legal Name" htmlFor="pComp">
                    <Input
                      id="pComp"
                      name="companyName"
                      defaultValue={tenant.companyName || ""}
                      placeholder="e.g. Three Brothers Petroleum Pvt. Ltd."
                    />
                  </Field>

                  <Field label="Contact Phone / Tel No." htmlFor="pPhone">
                    <Input
                      id="pPhone"
                      name="phone"
                      defaultValue={tenant.phone || ""}
                      placeholder="e.g. 01-4797257 / 9851000000"
                    />
                  </Field>

                  <Field label="Official Billing Email" htmlFor="pEmail">
                    <Input
                      id="pEmail"
                      name="email"
                      type="email"
                      defaultValue={tenant.email || ""}
                      placeholder="e.g. accounts@station.com"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Physical Location / Address" htmlFor="pAddress">
                      <Input
                        id="pAddress"
                        name="address"
                        defaultValue={tenant.address}
                        placeholder="e.g. New Baneshwor-31, Kathmandu"
                        required
                      />
                    </Field>
                  </div>
                </div>

                {/* Technical DB Connection Overview */}
                <div className="rounded-xl border border-border/80 bg-surface-hi p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={15} className="text-success" />
                      <span className="text-xs font-bold text-text">Dedicated Database Partition</span>
                    </div>
                    <span className="rounded-md bg-border/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      Physical Isolation Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border bg-bg px-3 py-2.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted">Database:</span>
                      <code className="font-mono font-bold text-success">[{tenant.databaseName}]</code>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-text-muted">Server:</span>
                      <code className="font-mono text-text">{tenant.databaseServer}</code>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <PrimaryButton type="submit" disabled={profilePending} className="px-5 py-2.5 text-xs font-bold">
                    {profilePending ? "Saving Station Profile…" : "Save Registration Profile"}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-accent" /> Multi-Tenant Legal Identity
              </h4>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Updating this legal registration profile synchronizes across the Central Master Database and the dedicated tenant database.
              </p>
              <div className="rounded-xl border border-border bg-bg p-3 space-y-2 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Station Code:</span>
                  <span className="font-mono font-bold text-accent">{slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Tenant ID:</span>
                  <span className="font-mono text-text-muted text-[10px]">{tenant.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Registered Date:</span>
                  <span className="text-text">{fmtBSLong(tenant.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2: INVOICE & BRANDING STUDIO SETUP                                    */}
      {/* ========================================================================= */}
      {activeTab === "INVOICE" && (
        <div className="space-y-6 animate-fade-in">
          {/* Logo Status Banners */}
          {logoMessage && (
            <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-success/40 bg-success/15 p-4 text-xs text-success font-bold shadow-sm">
              <CheckCircle2 size={18} className="shrink-0" /> {logoMessage}
            </div>
          )}
          {logoError && (
            <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-error/40 bg-error/15 p-4 text-xs text-error font-bold shadow-sm">
              <AlertCircle size={18} className="shrink-0" /> {logoError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Setup Controls (6 Cols) */}
            <div className="lg:col-span-6 space-y-6">
              {/* 1. Logo Management Box */}
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <UploadCloud size={18} className="text-accent" />
                    <h3 className="font-display text-[15px] font-bold text-text">
                      Station Official Logo (पम्प लोगो व्यवस्थापन)
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-text-muted">Super Admin Uploader</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-bg overflow-hidden p-1 relative shadow-inner">
                    {liveConfig.logoUrl ? (
                      <img
                        src={liveConfig.logoUrl}
                        alt="Station Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Printer size={20} className="mx-auto text-text-muted mb-1" />
                        <span className="text-[9.5px] text-text-muted">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <p className="text-[12px] text-text">
                      Upload station emblem/logo (PNG, JPG, WebP, SVG &le; 3MB). Renders automatically at top of A4 tax bills and thermal receipts.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <PrimaryButton
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLogoPending}
                        className="text-[11.5px] px-3 py-1.5"
                      >
                        {isLogoPending ? "Uploading…" : "Upload New Logo"}
                      </PrimaryButton>

                      {liveConfig.logoUrl && (
                        <GhostButton
                          type="button"
                          onClick={() => {
                            setLiveConfig((prev) => ({ ...prev, logoUrl: null }));
                          }}
                          className="text-[11.5px] px-2.5 py-1.5 text-error hover:bg-error/10"
                        >
                          <Trash2 size={13} /> Remove
                        </GhostButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Main Invoice Form */}
              <form action={invoiceAction} className="space-y-6">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="logoUrl" value={liveConfig.logoUrl || ""} />

                {/* Tax & Business Identification Card */}
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-display text-[15px] font-bold text-text">
                      Legal Tax & IRD Identification
                    </h3>
                    <p className="text-[11.5px] text-text-muted">
                      Printed on top box of the official VAT/PAN tax invoice
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Station Name (on bill)" htmlFor="iName">
                      <Input
                        id="iName"
                        name="stationName"
                        value={liveConfig.stationName}
                        onChange={(e) => setLiveConfig({ ...liveConfig, stationName: e.target.value })}
                        required
                      />
                    </Field>

                    <Field label="VAT Registration No." htmlFor="iVat">
                      <Input
                        id="iVat"
                        name="vatNo"
                        value={liveConfig.vatNo || ""}
                        onChange={(e) => setLiveConfig({ ...liveConfig, vatNo: e.target.value })}
                        placeholder="e.g. 300066034"
                      />
                    </Field>

                    <Field label="PAN Registration No." htmlFor="iPan">
                      <Input
                        id="iPan"
                        name="panNo"
                        value={liveConfig.panNo || ""}
                        onChange={(e) => setLiveConfig({ ...liveConfig, panNo: e.target.value })}
                        placeholder="e.g. 300066034"
                      />
                    </Field>

                    <Field label="NOC Dealer License Code" htmlFor="iDealer">
                      <Input
                        id="iDealer"
                        name="dealerCode"
                        value={liveConfig.dealerCode || ""}
                        onChange={(e) => setLiveConfig({ ...liveConfig, dealerCode: e.target.value })}
                        placeholder="e.g. NOC-KTM-104"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Station Address (on bill)" htmlFor="iAddr">
                        <Input
                          id="iAddr"
                          name="address"
                          value={liveConfig.address}
                          onChange={(e) => setLiveConfig({ ...liveConfig, address: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <Field label="Telephone / Contact" htmlFor="iTel">
                      <Input
                        id="iTel"
                        name="phone"
                        value={liveConfig.phone || ""}
                        onChange={(e) => setLiveConfig({ ...liveConfig, phone: e.target.value })}
                        placeholder="01-4797257"
                      />
                    </Field>

                    <Field label="Master Invoice Template" htmlFor="iTemplate">
                      <Select
                        id="iTemplate"
                        name="templateId"
                        value={liveConfig.templateId || "A4_DETAILED"}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const pSize = val === "THERMAL_80" ? "80MM" : "A4";
                          setLiveConfig({ ...liveConfig, templateId: val, paperSize: pSize });
                        }}
                      >
                        <option value="A4_DETAILED">A4 Detailed (Official IRD Tax Invoice)</option>
                        <option value="A4_STANDARD">A4 Standard (Minimalist Modern)</option>
                        <option value="THERMAL_80">Thermal 80mm (Continuous Pump Roll)</option>
                      </Select>
                    </Field>

                    <Field label="Paper Format" htmlFor="iPaper">
                      <Select
                        id="iPaper"
                        name="paperSize"
                        value={liveConfig.paperSize}
                        onChange={(e) => setLiveConfig({ ...liveConfig, paperSize: e.target.value as any })}
                      >
                        <option value="A4">A4 Full-Width Page</option>
                        <option value="80MM">80mm POS Thermal</option>
                        <option value="58MM">58mm Mini POS Thermal</option>
                        <option value="A5">A5 Half-Page Bill</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                {/* Field Visibility Toggles Card */}
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
                  <div className="border-b border-border pb-3">
                    <h3 className="font-display text-[15px] font-bold text-text">
                      Tax Invoice Field Toggles (देखाउने / लुकाउने फिल्डहरू)
                    </h3>
                    <p className="text-[11.5px] text-text-muted">
                      Enable or disable optional fields on printed customer receipts
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-[12px]">
                    {[
                      { key: "showLogo", label: "Show Station Logo / Emblem" },
                      { key: "showPan", label: "Show Station PAN" },
                      { key: "showVat", label: "Show Station VAT 13%" },
                      { key: "showVehicle", label: "Show Vehicle Number Plate" },
                      { key: "showHsCode", label: "Show HS Code (27101210)" },
                      { key: "showCustomerAddress", label: "Show Customer Address" },
                      { key: "showSignature", label: "Show Signature Boxes" },
                      { key: "showAmountInWords", label: "Show Amount in Words" },
                    ].map(({ key, label }) => {
                      const checked = Boolean((liveConfig as any)[key]);
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 rounded-xl border border-border bg-bg p-2.5 cursor-pointer hover:bg-surface-hi transition-colors"
                        >
                          <input
                            type="checkbox"
                            name={key}
                            checked={checked}
                            onChange={(e) =>
                              setLiveConfig({ ...liveConfig, [key]: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                          />
                          <span className="font-medium text-text">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Notes Card */}
                <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 shadow-xs">
                  <Field label="Footer Greeting / Safe Journey Note" htmlFor="iFooter">
                    <Input
                      id="iFooter"
                      name="footerGreeting"
                      value={liveConfig.footerGreeting || ""}
                      onChange={(e) => setLiveConfig({ ...liveConfig, footerGreeting: e.target.value })}
                      placeholder="Thank you for fueling with us! Safe Journey."
                    />
                  </Field>

                  <div className="flex justify-end pt-3">
                    <PrimaryButton
                      type="submit"
                      disabled={invoicePending}
                      className="px-6 py-2.5 text-xs font-bold"
                    >
                      {invoicePending ? "Saving Invoice Template…" : "Save Invoice & Branding Config"}
                    </PrimaryButton>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Interactive Live Preview Canvas (6 Cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-accent" />
                  <h3 className="font-display text-[14px] font-bold text-text">
                    Live Tax Invoice Preview ({liveConfig.paperSize} Format)
                  </h3>
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                  Interactive Canvas
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-surface-hi p-4 overflow-x-auto shadow-2xl flex justify-center">
                <div
                  className={clsx(
                    "bg-white text-black p-4 rounded-lg shadow-md transition-all",
                    liveConfig.paperSize === "A4" && "w-full max-w-[550px]",
                    liveConfig.paperSize === "80MM" && "w-[360px]",
                    liveConfig.paperSize === "58MM" && "w-[280px]",
                    liveConfig.paperSize === "A5" && "w-[440px]"
                  )}
                >
                  <TaxInvoice
                    receipt={sampleReceipt}
                    business={{
                      name: liveConfig.stationName,
                      companyName: liveConfig.companyName || undefined,
                      address: liveConfig.address,
                      phone: liveConfig.phone || undefined,
                      email: liveConfig.email || undefined,
                      panNo: liveConfig.panNo || undefined,
                      vatNo: liveConfig.vatNo || undefined,
                      dealerCode: liveConfig.dealerCode || undefined,
                      logoUrl: liveConfig.logoUrl || undefined,
                    }}
                    settings={liveConfig}
                    preview={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3: FUEL TANKS & HARDWARE SETUP                                       */}
      {/* ========================================================================= */}
      {activeTab === "TANKS" && (
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Fuel size={18} className="text-accent" />
                <h3 className="font-display text-[15px] font-bold text-text">
                  Part 3: Tank Hardware & Fuel Pricing (इन्धन भण्डारण तथा दर)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-text-muted">
                {station?.tanks.length || 0} Tanks Initialized
              </span>
            </div>

            {(!station?.tanks || station.tanks.length === 0) ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-text-muted">
                <Fuel size={32} className="mx-auto text-text-muted mb-2" />
                <p className="text-sm">No fuel tanks initialized in dedicated database partition yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {station.tanks.map((tank) => {
                  const pct = tank.capacityL > 0 ? (tank.levelL / tank.capacityL) * 100 : 0;
                  return (
                    <div
                      key={tank.id}
                      className="rounded-xl border border-border bg-bg p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-accent" />
                          <h4 className="font-display text-sm font-bold text-text">
                            {FUEL_LABEL[tank.fuel as FuelId] || tank.fuel}
                          </h4>
                        </div>
                        <Badge tone={pct < 20 ? "error" : "success"}>
                          {pct.toFixed(0)}% Stock
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">Current Dip Level:</span>
                          <span className="font-data font-bold text-text">
                            {tank.levelL.toLocaleString("en-IN")} / {tank.capacityL.toLocaleString("en-IN")} L
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-hi overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all", pct < 20 ? "bg-error" : "bg-success")}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-2 flex justify-between text-xs">
                        <span className="text-text-muted">Selling Rate:</span>
                        <span className="font-bold text-accent font-data">
                          Rs {tank.ratePerL.toFixed(2)} / Ltr
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4: STAFF & ACCOUNT ACCESS SETUP                                      */}
      {/* ========================================================================= */}
      {activeTab === "STAFF" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-fade-in">
          {/* Left: Staff Accounts List (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-accent" />
                  <h3 className="font-display text-[15px] font-bold text-text">
                    Part 4: Station Accounts & Staff Roster
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-text-muted">
                  {station?.users.length || 0} Registered User(s)
                </span>
              </div>

              {(!station?.users || station.users.length === 0) ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-text-muted">
                  No staff accounts registered.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {station.users.map((u) => {
                    const isOwner = u.role === "OWNER";
                    return (
                      <div
                        key={u.id}
                        className={clsx(
                          "flex items-center justify-between rounded-xl border p-3.5 transition-all",
                          isOwner
                            ? "border-accent/40 bg-accent/5"
                            : "border-border bg-bg"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={clsx(
                              "flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs",
                              isOwner ? "bg-accent text-[#1A1306]" : "bg-surface-hi text-text"
                            )}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-text text-sm">{u.name}</span>
                              <Badge tone={isOwner ? "accent" : "neutral"}>
                                {u.role}
                              </Badge>
                              {!u.active && <Badge tone="error">INACTIVE</Badge>}
                            </div>
                            <div className="text-[11.5px] text-text-muted font-mono">
                              @{u.username} {u.phone ? `· ${u.phone}` : ""}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isOwner && (
                            <PrimaryButton
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setNewPassword("");
                              }}
                              className="text-[11px] px-3 py-1.5"
                            >
                              <KeyRound size={12} /> Reset Password
                            </PrimaryButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Owner Account Recovery Box (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
              <div className="border-b border-border pb-3">
                <h3 className="font-display text-[15px] font-bold text-text flex items-center gap-2">
                  <ShieldCheck size={18} className="text-accent" /> Station Owner Account Recovery
                </h3>
                <p className="text-[11.5px] text-text-muted">
                  Super Admin can generate new password credentials for the station Owner in case of lockout.
                </p>
              </div>

              {credState?.message && (
                <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success font-medium">
                  <CheckCircle2 size={16} /> {credState.message}
                </div>
              )}
              {credState?.error && (
                <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error font-medium">
                  <AlertCircle size={16} /> {credState.error}
                </div>
              )}

              {selectedUser ? (
                <form action={credAction} className="space-y-3.5">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="userId" value={selectedUser.id} />

                  <Field label="Owner Name" htmlFor="rName">
                    <Input id="rName" name="name" defaultValue={selectedUser.name} required />
                  </Field>

                  <Field label="Username" htmlFor="rUser">
                    <Input id="rUser" name="username" defaultValue={selectedUser.username} required />
                  </Field>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-text">
                      New Password
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter or generate password"
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
                        onClick={handleGenerateKey}
                        className="text-xs px-2.5 py-1"
                        title="Generate strong random password"
                      >
                        <Sparkles size={14} className="text-accent" />
                      </GhostButton>
                    </div>
                  </div>

                  <Field label="Reason for Reset (Audit Logged)" htmlFor="rReason">
                    <Input
                      id="rReason"
                      name="reason"
                      placeholder="e.g. Owner requested password reset via phone"
                      required
                      minLength={3}
                    />
                  </Field>

                  <div className="flex items-center justify-between pt-2">
                    {newPassword && (
                      <GhostButton
                        type="button"
                        onClick={() => handleCopyCredentials(selectedUser.username, newPassword)}
                        className="text-xs px-2.5 py-1"
                      >
                        {copiedKey ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        {copiedKey ? "Copied" : "Copy Login Packet"}
                      </GhostButton>
                    )}
                    <PrimaryButton type="submit" disabled={credPending} className="px-4 py-2 text-xs font-bold">
                      {credPending ? "Resetting…" : "Update Owner Password"}
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-text-muted text-xs">
                  Select a station Owner from the list on the left to reset credentials.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
