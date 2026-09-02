"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Trash2,
  FileText,
  Eye,
  Check,
  Building2,
  Layers,
  Sparkles,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { TaxInvoice } from "@/components/sales/TaxInvoice";
import type { ReceiptDTO } from "@/lib/actions/sales";
import {
  type MergedStationInvoiceConfig,
  type TemplateId,
  type PaperSize,
  INVOICE_TEMPLATES,
} from "@/lib/invoice-settings";
import {
  updateStationInvoiceSettingsAction,
  uploadStationLogoAction,
  deleteStationLogoAction,
} from "@/lib/actions/invoice-settings";
import { clsx } from "clsx";

/** Realistic sample receipt for live interactive invoice preview */
const SAMPLE_PREVIEW_RECEIPT: ReceiptDTO = {
  receiptNo: 4776,
  billNumber: "tb-4776-083/084",
  stationName: "Three Brothers Oil Store",
  fuelLabel: "MS - PETROL",
  liters: "30 Ltr",
  rate: "176.991",
  total: "5,309.73",
  grandTotal: "6,000.00",
  subtotal: "5,309.73",
  taxableAmount: "5,309.73",
  vatAmount: "690.27",
  discount: undefined,
  paymentMethod: "CASH",
  onlineProvider: null,
  paymentRef: null,
  customerName: "Yani International pvt ltd",
  customerPanNo: "610368343",
  customerPhone: "01-4481234",
  vehicleNo: "BA 2 KHA 8942",
  changeDue: null,
  soldBy: "SUPER ADMIN",
  at: "2083/05/15",
  dateBS: "2083/05/15",
};

export function InvoiceSettingsView({
  initialConfig,
}: {
  initialConfig: MergedStationInvoiceConfig;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Logo uploader state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Station Profile State
  const [stationName, setStationName] = useState(initialConfig.name || initialConfig.stationName);
  const [address, setAddress] = useState(initialConfig.address);
  const [phone, setPhone] = useState(initialConfig.phone || "");
  const [panNo, setPanNo] = useState(initialConfig.panNo || "");
  const [vatNo, setVatNo] = useState(initialConfig.vatNo || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialConfig.logoUrl || null);

  // 2. Invoice Template State
  const [templateId, setTemplateId] = useState<TemplateId>(initialConfig.templateId || "A4_DETAILED");
  const [paperSize, setPaperSize] = useState<PaperSize>(initialConfig.paperSize || "A4");

  // 3. Optional Invoice Settings (Field Toggles)
  const [showPan, setShowPan] = useState(initialConfig.showPan);
  const [showVat, setShowVat] = useState(initialConfig.showVat);
  const [showVehicle, setShowVehicle] = useState(initialConfig.showVehicle);
  const [showHsCode, setShowHsCode] = useState(initialConfig.showHsCode);
  const [showCustomerAddress, setShowCustomerAddress] = useState(initialConfig.showCustomerAddress);

  // Preview panel toggle
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadError(null);
    setIsUploadingLogo(true);

    const formData = new FormData();
    formData.append("logoFile", file);

    try {
      const res = await uploadStationLogoAction(formData);
      if (res.error) {
        setLogoUploadError(res.error);
      } else if (res.logoUrl) {
        setLogoUrl(res.logoUrl);
        router.refresh();
      }
    } catch {
      setLogoUploadError("An error occurred during logo upload.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Logo Delete
  const handleLogoDelete = async () => {
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const res = await deleteStationLogoAction();
      if (res.error) {
        setLogoUploadError(res.error);
      } else {
        setLogoUrl(null);
        router.refresh();
      }
    } catch {
      setLogoUploadError("Failed to delete logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle Template Selection
  const handleSelectTemplate = (t: typeof INVOICE_TEMPLATES[number]) => {
    setTemplateId(t.id);
    setPaperSize(t.defaultPaperSize);
  };

  // Handle Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const formData = new FormData();
    // 1. Station Profile
    formData.append("stationName", stationName);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("panNo", panNo);
    formData.append("vatNo", vatNo);
    formData.append("logoUrl", logoUrl || "");

    // 2. Invoice Template
    formData.append("templateId", templateId);
    formData.append("paperSize", paperSize);

    // 3. Invoice Settings (Field Toggles)
    formData.append("showPan", String(showPan));
    formData.append("showVat", String(showVat));
    formData.append("showVehicle", String(showVehicle));
    formData.append("showHsCode", String(showHsCode));
    formData.append("showCustomerAddress", String(showCustomerAddress));

    startTransition(async () => {
      const res = await updateStationInvoiceSettingsAction({}, formData);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess(true);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    });
  };

  // Current config representation for live preview
  const currentPreviewConfig: MergedStationInvoiceConfig = {
    stationName,
    name: stationName,
    address,
    phone,
    panNo,
    vatNo,
    logoUrl,
    templateId,
    paperSize,
    showPan,
    showVat,
    showVehicle,
    showHsCode,
    showCustomerAddress,
    showAmountInWords: true,
    showSignature: true,
    showLogo: true,
    footerGreeting: "Thank you for fueling with us! Safe Journey.",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-[#1A1306] shadow-sm">
            <Printer size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-display text-[18px] font-bold text-text">
              Invoice Settings (बिल तथा लोगो स्टुडियो)
            </h1>
            <p className="text-[12px] text-text-muted">
              Configure your station business profile, select a master invoice template, and toggle customer receipt fields.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <GhostButton
            type="button"
            onClick={() => setShowPreviewModal(!showPreviewModal)}
            className="text-xs px-3.5 py-2 font-semibold"
          >
            <Eye size={15} /> {showPreviewModal ? "Hide Preview" : "Preview Invoice"}
          </GhostButton>

          <PrimaryButton
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="text-xs px-5 py-2 font-bold"
          >
            <Save size={15} /> {isPending ? "Saving Changes…" : "Save Settings"}
          </PrimaryButton>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-4 text-xs font-semibold text-success shadow-xs">
          <CheckCircle2 size={18} /> Invoice settings and station profile saved successfully!
        </div>
      )}
      {saveError && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-4 text-xs font-semibold text-error shadow-xs">
          <AlertTriangle size={18} /> {saveError}
        </div>
      )}
      {logoUploadError && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-error/30 bg-error/10 p-4 text-xs font-semibold text-error shadow-xs">
          <AlertTriangle size={18} /> {logoUploadError}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form: The 3 Core Sections (7 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* ========================================================================= */}
          {/* 1. STATION PROFILE (BUSINESS INFORMATION)                                */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Building2 size={18} className="text-accent" />
              <div>
                <h2 className="font-display text-[15px] font-bold text-text">
                  1. Station Profile (कम्पनी तथा व्यवसाय विवरण)
                </h2>
                <p className="text-[11.5px] text-text-muted">
                  Your station&apos;s legal business identity printed on top of all tax invoices.
                </p>
              </div>
            </div>

            {/* Logo Dropzone / Manager */}
            <div className="rounded-xl border border-border bg-bg p-4 flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-white overflow-hidden p-2 shadow-sm relative">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Station Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Printer size={22} className="mx-auto text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-500 font-medium">No Logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <label className="text-[12.5px] font-bold text-text">Station Logo</label>
                  <p className="text-[11px] text-text-muted">
                    PNG, JPG, WebP or SVG (max 3MB). Renders cleanly on A4 and thermal receipts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <GhostButton
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="text-[11.5px] px-3 py-1.5 font-semibold"
                  >
                    <UploadCloud size={14} /> {isUploadingLogo ? "Uploading…" : "Upload Logo"}
                  </GhostButton>

                  {logoUrl && (
                    <GhostButton
                      type="button"
                      onClick={handleLogoDelete}
                      disabled={isUploadingLogo}
                      className="text-[11.5px] px-2.5 py-1.5 text-error hover:bg-error/10"
                    >
                      <Trash2 size={13} /> Remove
                    </GhostButton>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Business / Pump Name" htmlFor="sName">
                  <Input
                    id="sName"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    placeholder="e.g. Three Brothers Oil Store"
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Address" htmlFor="sAddress">
                  <Input
                    id="sAddress"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. New Baneshwor, Kathmandu"
                    required
                  />
                </Field>
              </div>

              <Field label="Phone / Tel. No" htmlFor="sPhone">
                <Input
                  id="sPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01-4797257"
                  required
                />
              </Field>

              <Field label="PAN Number" htmlFor="sPan">
                <Input
                  id="sPan"
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  placeholder="e.g. 300066034"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="VAT Number" htmlFor="sVat">
                  <Input
                    id="sVat"
                    value={vatNo}
                    onChange={(e) => setVatNo(e.target.value)}
                    placeholder="e.g. 300066034"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. CHOOSE INVOICE TEMPLATE                                                */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Layers size={18} className="text-accent" />
              <div>
                <h2 className="font-display text-[15px] font-bold text-text">
                  2. Choose Master Template (बीजक टेम्प्लेट छनोट)
                </h2>
                <p className="text-[11.5px] text-text-muted">
                  Select one of the curated professional invoice designs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {INVOICE_TEMPLATES.map((t) => {
                const isSelected = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t)}
                    className={clsx(
                      "flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer relative",
                      isSelected
                        ? "border-accent bg-accent/10 shadow-sm ring-1 ring-accent"
                        : "border-border bg-bg hover:bg-surface-hi"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[#1A1306]">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Badge tone={isSelected ? "accent" : "muted"} className="text-[10px]">
                        {t.type}
                      </Badge>
                      <h3 className="font-display text-sm font-bold text-text">
                        {t.name}
                      </h3>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/60 text-[10.5px] font-semibold text-accent">
                      {isSelected ? "● Active Template" : "Click to select"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. OPTIONAL INVOICE SETTINGS (FIELD TOGGLES)                              */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-xs">
            <div className="border-b border-border pb-3">
              <h2 className="font-display text-[15px] font-bold text-text">
                3. Invoice Field Toggles (देखाउने वा लुकाउने फिल्डहरू)
              </h2>
              <p className="text-[11.5px] text-text-muted">
                Only enable what genuinely applies to your forecourt and customer billing requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-[12.5px]">
              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-bg p-3 cursor-pointer hover:bg-surface-hi transition-colors">
                <input
                  type="checkbox"
                  checked={showPan}
                  onChange={(e) => setShowPan(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text">Show Station PAN</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-bg p-3 cursor-pointer hover:bg-surface-hi transition-colors">
                <input
                  type="checkbox"
                  checked={showVat}
                  onChange={(e) => setShowVat(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text">Show Station VAT 13%</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-bg p-3 cursor-pointer hover:bg-surface-hi transition-colors">
                <input
                  type="checkbox"
                  checked={showVehicle}
                  onChange={(e) => setShowVehicle(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text">Show Vehicle Number</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-bg p-3 cursor-pointer hover:bg-surface-hi transition-colors">
                <input
                  type="checkbox"
                  checked={showHsCode}
                  onChange={(e) => setShowHsCode(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text">Show HS Code (27101210)</span>
              </label>

              <label className="flex items-center gap-2.5 rounded-xl border border-border bg-bg p-3 cursor-pointer hover:bg-surface-hi transition-colors sm:col-span-2">
                <input
                  type="checkbox"
                  checked={showCustomerAddress}
                  onChange={(e) => setShowCustomerAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="font-medium text-text">Show Customer / Corporate Party Address</span>
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <GhostButton
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs font-semibold"
              >
                <Eye size={14} /> Preview Live Invoice
              </GhostButton>

              <PrimaryButton
                type="submit"
                disabled={isPending}
                className="text-xs px-6 py-2.5 font-bold"
              >
                <Save size={14} /> {isPending ? "Saving…" : "Save Invoice Settings"}
              </PrimaryButton>
            </div>
          </div>
        </form>

        {/* Right Column: Live Interactive Split-Screen Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-accent" />
                <h3 className="font-display text-[14px] font-bold text-text">
                  Live Preview ({paperSize} Master)
                </h3>
              </div>
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold text-accent">
                Real-Time Canvas
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface-hi p-4 overflow-x-auto shadow-2xl flex justify-center">
              <div
                className={clsx(
                  "bg-white text-black p-4 rounded-lg shadow-md transition-all",
                  paperSize === "A4" && "w-full max-w-[480px]",
                  paperSize === "80MM" && "w-[340px]",
                  paperSize === "58MM" && "w-[260px]",
                  paperSize === "A5" && "w-[400px]"
                )}
              >
                <TaxInvoice
                  receipt={SAMPLE_PREVIEW_RECEIPT}
                  business={{
                    name: stationName,
                    address,
                    phone,
                    panNo,
                    vatNo,
                    logoUrl,
                  }}
                  settings={currentPreviewConfig}
                  preview={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
