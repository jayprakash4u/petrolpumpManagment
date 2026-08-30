"use client";

import { useState } from "react";
import {
  Archive,
  Download,
  Calendar,
  Database,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Cloud,
  FileCheck,
  Lock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";

interface FiscalArchive {
  id: string;
  fiscalYearBS: string;
  periodDescription: string;
  recordsCount: number;
  totalSalesVolume: string;
  totalRevenue: string;
  archivedAt: string;
  fileSizeBytes: string;
  checksum: string;
}

export function LogArchiveView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [archives, setArchives] = useState<FiscalArchive[]>([
    {
      id: "arc-82-83",
      fiscalYearBS: "FY 2082/83",
      periodDescription: "Complete Fiscal Year (Shrawan 1, 2082 - Ashadh 31, 2083)",
      recordsCount: 42890,
      totalSalesVolume: "1,248,500 L",
      totalRevenue: "Rs 18,72,75,000",
      archivedAt: "2083-04-05",
      fileSizeBytes: "24.8 MB",
      checksum: "SHA256: 8f4b...392a",
    },
    {
      id: "arc-81-82",
      fiscalYearBS: "FY 2081/82",
      periodDescription: "Complete Fiscal Year (Shrawan 1, 2081 - Ashadh 31, 2082)",
      recordsCount: 38410,
      totalSalesVolume: "1,120,400 L",
      totalRevenue: "Rs 16,80,60,000",
      archivedAt: "2082-04-02",
      fileSizeBytes: "21.2 MB",
      checksum: "SHA256: 3c1e...991f",
    },
  ]);

  const handleCreateSnapshot = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSuccessMessage("Current month snapshot (Bhadra 2083) bundled and signed successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 1200);
  };

  const handleDownloadArchive = (arc: FiscalArchive) => {
    const textContent = `
============================================================
  SHREE PASHUPATI PETROLEUM CENTER — STATUTORY LOG ARCHIVE
  Maharajgunj, Kathmandu · PAN: 301928491
============================================================
Fiscal Period: ${arc.fiscalYearBS} (${arc.periodDescription})
Total Invoices & Transactions: ${arc.recordsCount}
Total Fuel Volume Dispensed: ${arc.totalSalesVolume}
Total Revenue Cleared: ${arc.totalRevenue}
Archive Date: ${arc.archivedAt}
Checksum: ${arc.checksum}
Status: VERIFIED & COMPLIANT WITH IRD & NOC ARCHIVAL RULES
============================================================
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `pashupati_station_archive_${arc.fiscalYearBS.replace(/\//g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Archive size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Log Archive & Period Retention (अभिलेख भण्डारण तथा बन्द खाता)
            </h2>
            <p className="text-[12px] text-text-muted">
              Closed fiscal year sales ledgers, statutory VAT tax registers, and immutable backup retention bundles.
            </p>
          </div>
        </div>

        <PrimaryButton
          type="button"
          onClick={handleCreateSnapshot}
          disabled={isGenerating}
          className="text-[12.5px] px-3.5 py-1.5"
        >
          {isGenerating ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Bundling...
            </>
          ) : (
            <>
              <Plus size={14} /> Generate Period Snapshot
            </>
          )}
        </PrimaryButton>
      </div>

      {successMessage && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[13px] text-success font-medium">
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Closed Fiscal Archives"
          value={`${archives.length} Fiscal Years`}
          icon={Calendar}
          tone="text"
        />
        <StatCard
          label="Total Retained Records"
          value="81,300+ Bills"
          icon={Database}
          tone="accent"
        />
        <StatCard
          label="Statutory Retention Policy"
          value="5 Years (Mandatory)"
          icon={ShieldCheck}
          tone="text"
        />
        <StatCard
          label="Backup Integrity"
          value="100% Cryptographic"
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Backup System Health Deck */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <HardDrive size={18} className="text-accent" />
            <h3 className="font-display text-[14.5px] font-bold text-text">
              Local Station Storage Backup
            </h3>
          </div>
          <p className="text-[12px] text-text-muted">
            Daily automated database snapshots are stored on the encrypted station server.
          </p>
          <div className="flex items-center justify-between pt-1 text-[12px]">
            <span className="text-text-muted">Last Local Backup:</span>
            <strong className="text-text font-data">Today at 04:00 AM (Verified)</strong>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Cloud size={18} className="text-success" />
            <h3 className="font-display text-[14.5px] font-bold text-text">
              Cloud Disaster Recovery Vault
            </h3>
          </div>
          <p className="text-[12px] text-text-muted">
            Encrypted end-of-day copies mirrored to off-site cloud storage for fire and disaster safety.
          </p>
          <div className="flex items-center justify-between pt-1 text-[12px]">
            <span className="text-text-muted">Cloud Mirror Status:</span>
            <Badge tone="success">ACTIVE & SECURED</Badge>
          </div>
        </div>
      </div>

      {/* Archived Fiscal Years Table */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Archive size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Permanent Closed Period Archives
            </h3>
          </div>
          <span className="text-[12px] text-text-muted font-data">
            {archives.length} Closed FY Bundles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[780px]">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-3 py-2.5">FISCAL YEAR (BS)</th>
                <th className="px-3 py-2.5">PERIOD DETAILS</th>
                <th className="px-3 py-2.5 text-right">TOTAL INVOICES</th>
                <th className="px-3 py-2.5 text-right">VOLUME (L)</th>
                <th className="px-3 py-2.5 text-right">TOTAL REVENUE</th>
                <th className="px-3 py-2.5 text-right">ARCHIVE BUNDLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {archives.map((arc) => (
                <tr key={arc.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="px-3 py-3 font-bold text-accent text-[13.5px]">
                    {arc.fiscalYearBS}
                  </td>
                  <td className="px-3 py-3 font-body text-text-muted text-[12px]">
                    {arc.periodDescription}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-text">
                    {arc.recordsCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    {arc.totalSalesVolume}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-text">
                    {arc.totalRevenue}
                  </td>
                  <td className="px-3 py-3 text-right font-body">
                    <GhostButton
                      type="button"
                      onClick={() => handleDownloadArchive(arc)}
                      className="px-2.5 py-1 text-[11.5px]"
                    >
                      <Download size={13} /> Download ({arc.fileSizeBytes})
                    </GhostButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
