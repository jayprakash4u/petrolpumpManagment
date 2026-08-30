import { PlusCircle, Building2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { OnboardStationForm } from "@/components/admin/AdminForms";

export default async function OnboardStationPage() {
  await requirePlatformAdmin();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <PlusCircle size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Onboard New Petrol Pump Tenant (नयाँ पम्प स्टेसन दर्ता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Provisions a dedicated multi-tenant station workspace, initial owner credentials, and default database partitions.
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3.5 py-2 text-[12.5px] font-semibold text-text hover:bg-surface-hi transition-colors"
        >
          <ArrowLeft size={14} /> Back to Directory
        </Link>
      </div>

      {/* Onboarding Form Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="mb-4 border-b border-border pb-3">
          <h3 className="font-display text-[15px] font-bold text-text">
            Station & Initial Owner Setup
          </h3>
          <p className="text-[12px] text-text-muted">
            The owner will be able to sign in immediately using the Station Code and credentials created below.
          </p>
        </div>

        <OnboardStationForm />
      </div>
    </div>
  );
}
