"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Upload,
  Fuel,
  X,
  Briefcase,
} from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { updateStationProfileAdminAction } from "@/lib/actions/platform";

interface EditStationFullPageProps {
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
  } | null;
}

export function EditStationFullPageView({ slug, tenant, station }: EditStationFullPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(tenant.name || "");
  const [companyName, setCompanyName] = useState(tenant.companyName || `${tenant.name} Pvt. Ltd.`);
  const [address, setAddress] = useState(tenant.address || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [email, setEmail] = useState(tenant.email || "");
  const [panNo, setPanNo] = useState(station?.panNo || "300066034");
  const [vatNo, setVatNo] = useState(station?.vatNo || "300066034");
  const [dealerCode, setDealerCode] = useState(station?.dealerCode || "NOC-KTM-104");
  const [logoDataUrl, setLogoDataUrl] = useState(station?.logoUrl || "");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Logo image size must be less than 2 MB.");
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) setLogoDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("name", name);
    formData.append("companyName", companyName);
    formData.append("address", address);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("panNo", panNo);
    formData.append("vatNo", vatNo);
    formData.append("dealerCode", dealerCode);
    formData.append("logoDataUrl", logoDataUrl);

    startTransition(async () => {
      const res = await updateStationProfileAdminAction({}, formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(res.message || `Station details for "${name}" updated successfully.`);
        setTimeout(() => {
          router.push(`/admin/stations/${slug}`);
        }, 1200);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <Link
            href={`/admin/stations/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-accent transition-colors mb-1"
          >
            <ArrowLeft size={14} /> Back to {tenant.name}
          </Link>
          <h1 className="font-display text-[22px] font-bold text-text">
            Edit Station & Business Details
          </h1>
          <p className="text-xs text-text-muted">
            Update station business profile, logo, contact details, and registered legal compliance info.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-xs text-success font-medium">
          <CheckCircle2 size={17} /> {successMsg} Redirecting back to station...
        </div>
      )}

      {errorMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 p-4 text-xs text-error font-medium">
          <AlertCircle size={17} /> {errorMsg}
        </div>
      )}

      {/* 2. Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-5"
      >
        <div className="border-b border-border pb-3">
          <h2 className="font-display text-[15px] font-bold text-text flex items-center gap-2">
            <Building2 size={16} className="text-accent" /> Station & Business Identity
          </h2>
        </div>

        {/* Logo Section */}
        <div className="rounded-2xl border border-border bg-bg p-4 space-y-3">
          <label className="text-xs font-bold text-text block">
            Petrol Pump Logo
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
              {logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoDataUrl}
                  alt="Station Logo Preview"
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-text-muted">
                  <Fuel size={24} className="text-accent" />
                  <span className="text-[9px] font-mono mt-0.5">NO LOGO</span>
                </div>
              )}

              {logoDataUrl && (
                <button
                  type="button"
                  onClick={() => setLogoDataUrl("")}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white shadow-xs hover:bg-error/90 cursor-pointer"
                  title="Remove Logo"
                >
                  <X size={11} />
                </button>
              )}
            </div>

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
                <span>{logoDataUrl ? "Change Logo Image" : "Upload Logo"}</span>
              </GhostButton>

              <p className="text-[11px] text-text-muted">
                Logo is automatically reused on the station sidebar, invoices, and reports.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <Field label="Station Display Name *" htmlFor="eName">
            <Input
              id="eName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shree Petrol Pump"
              required
            />
          </Field>

          <Field label="Station Code (Human-Readable)" htmlFor="eSlug">
            <Input
              id="eSlug"
              value={slug.toUpperCase()}
              disabled
              className="opacity-70 font-mono font-bold text-accent bg-bg cursor-not-allowed"
            />
          </Field>

          <Field label="Station ID (System-Generated)" htmlFor="eStnId">
            <Input
              id="eStnId"
              value={tenant.id.startsWith("st-") ? `STN-${tenant.id.replace("st-", "").padStart(6, "0")}` : "STN-000001"}
              disabled
              className="opacity-70 font-mono text-text bg-bg cursor-not-allowed"
            />
          </Field>

          <div className="sm:col-span-3">
            <Field label="Registered Legal / Business Name *" htmlFor="eComp">
              <Input
                id="eComp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Shree Petrol Pump Pvt. Ltd."
                required
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Station Address *" htmlFor="eAddr">
              <Input
                id="eAddr"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Maharajgunj Chowk, Kathmandu"
                required
              />
            </Field>
          </div>

          <Field label="Official Phone *" htmlFor="ePhone">
            <Input
              id="ePhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9851029384"
              required
            />
          </Field>

          <Field label="Official Email" htmlFor="eEmail">
            <Input
              id="eEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. accounts@shreepump.com"
            />
          </Field>

          <Field label="PAN / VAT Number *" htmlFor="ePan">
            <Input
              id="ePan"
              value={panNo}
              onChange={(e) => setPanNo(e.target.value)}
              placeholder="e.g. 300066034"
              required
            />
          </Field>

          <Field label="VAT Registration Number" htmlFor="eVat">
            <Input
              id="eVat"
              value={vatNo}
              onChange={(e) => setVatNo(e.target.value)}
              placeholder="e.g. 300066034"
            />
          </Field>

          <Field label="NOC Dealer Code" htmlFor="eNoc">
            <Input
              id="eNoc"
              value={dealerCode}
              onChange={(e) => setDealerCode(e.target.value)}
              placeholder="e.g. NOC-KTM-104"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link href={`/admin/stations/${slug}`}>
            <GhostButton type="button" className="text-xs">
              Cancel
            </GhostButton>
          </Link>

          <PrimaryButton type="submit" disabled={isPending} className="text-xs px-5 py-2.5">
            <Save size={14} />
            <span>{isPending ? "Saving Changes…" : "Save Changes"}</span>
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
