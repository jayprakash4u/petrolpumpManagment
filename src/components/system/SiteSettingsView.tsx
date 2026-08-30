"use client";

import { useState } from "react";
import {
  Cog,
  Building2,
  Printer,
  Fuel,
  BellRing,
  Save,
  CheckCircle2,
  Sliders,
  Store,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function SiteSettingsView() {
  const [stationName, setStationName] = useState("Shree Pashupati Petroleum Center");
  const [dealerCode, setDealerCode] = useState("KTM-DEALER-4091");
  const [panNumber, setPanNumber] = useState("301928491");
  const [location, setLocation] = useState("Maharajgunj, Ward 3, Kathmandu");
  const [phone, setPhone] = useState("+977-1-4412091 / 9851023941");
  const [receiptFooter, setReceiptFooter] = useState("Thank you for fueling with us! Safe Journey.");
  
  // Toggle states
  const [showBSDate, setShowBSDate] = useState(true);
  const [autoPrint, setAutoPrint] = useState(true);
  const [nocAutoSync, setNocAutoSync] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState("15");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Cog size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Site Settings & Station Configuration (पेट्रोल पम्प प्रणाली सेटिङ)
            </h2>
            <p className="text-[12px] text-text-muted">
              Station dealership profile, thermal receipt templates, forecourt alert thresholds, and defaults.
            </p>
          </div>
        </div>

        <PrimaryButton type="submit" className="text-[13px] px-4 py-2">
          <Save size={15} /> Save Settings
        </PrimaryButton>
      </div>

      {savedSuccess && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> Site configuration and station profile saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Station Legal Profile Card */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Store size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Station Dealership Profile
            </h3>
          </div>

          <Field label="Station Registered Business Name" htmlFor="stName">
            <Input
              id="stName"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="NOC Dealer Code" htmlFor="stDealer">
              <Input
                id="stDealer"
                value={dealerCode}
                onChange={(e) => setDealerCode(e.target.value)}
                required
              />
            </Field>

            <Field label="IRD PAN / VAT Number" htmlFor="stPan">
              <Input
                id="stPan"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Physical Station Address" htmlFor="stLoc">
            <Input
              id="stLoc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </Field>

          <Field label="Station Contact Phone" htmlFor="stPhone">
            <Input
              id="stPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Field>
        </div>

        {/* 2. Thermal Receipt & Invoice Print Template */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Printer size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Receipt & Invoice Print Layout
            </h3>
          </div>

          <Field label="Receipt Footer Greeting Text" htmlFor="rcptFooter">
            <Input
              id="rcptFooter"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </Field>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-border bg-bg hover:bg-surface-hi transition-colors">
              <input
                type="checkbox"
                checked={showBSDate}
                onChange={(e) => setShowBSDate(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <div className="text-[12.5px]">
                <div className="font-medium text-text">Print Bikram Sambat (BS) Dates</div>
                <div className="text-text-muted text-[11px]">
                  Displays Nepali date (e.g. २०८३-०५-०८) prominently on bills for IRD tax compliance.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-border bg-bg hover:bg-surface-hi transition-colors">
              <input
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <div className="text-[12.5px]">
                <div className="font-medium text-text">Quick Thermal Slip Preview</div>
                <div className="text-text-muted text-[11px]">
                  Automatically renders formatted printable slip upon recording a new fuel sale.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl border border-border bg-bg hover:bg-surface-hi transition-colors">
              <input
                type="checkbox"
                checked={nocAutoSync}
                onChange={(e) => setNocAutoSync(e.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <div className="text-[12.5px]">
                <div className="font-medium text-text">NOC Wholesale Price Auto-Sync</div>
                <div className="text-text-muted text-[11px]">
                  Automatically alerts the manager when Nepal Oil Corporation publishes a tariff revision.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Forecourt Safety & Fuel Inventory Alerts */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <BellRing size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Inventory & Credit Alert Thresholds
            </h3>
          </div>

          <Field label="Low Underground Tank Alert Level (% of Capacity)" htmlFor="tankThresh">
            <Input
              id="tankThresh"
              type="number"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              min="5"
              max="40"
            />
          </Field>

          <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Critical Low Stock Warning:</span>
              <span className="font-mono text-error font-bold">&lt; 15% (e.g. 3,000 L in 20KL Tank)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Credit Customer Headroom Alert:</span>
              <span className="font-mono text-accent font-bold">&gt; 90% Credit Utilized</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Shift Reconciliation Variance Tolerance:</span>
              <span className="font-mono text-text font-bold">± 0.20% Max (NOC Norm)</span>
            </div>
          </div>
        </div>

        {/* 4. Forecourt Hardware & Network Connectivity */}
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck size={18} className="text-success" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Station System Status & Integrity
            </h3>
          </div>

          <div className="space-y-2 text-[12.5px]">
            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <span className="text-text font-medium">IRD CBMS Electronic Invoice Sync:</span>
              <Badge tone="success">ONLINE · SYNCED</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <span className="text-text font-medium">Nepal Oil Corp Dealer Portal Link:</span>
              <Badge tone="success">ACTIVE · KTM-4091</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <span className="text-text font-medium">Fonepay / POS Terminal Network:</span>
              <Badge tone="accent">READY</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-bg p-2.5">
              <span className="text-text font-medium">Forecourt Dispenser Automation Controller:</span>
              <Badge tone="success">4 BAYS OPERATIONAL</Badge>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
