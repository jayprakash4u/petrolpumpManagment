"use client";

import { useState } from "react";
import {
  Ship,
  Printer,
  Download,
  Truck,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Building2,
  MapPin,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { MOCK_VCTS_CONSIGNMENTS } from "@/lib/mock/compliance";
import type { VctsConsignment, VctsStatus } from "@/lib/compliance";

export function VctsTrackingView() {
  const [consignments, setConsignments] = useState<VctsConsignment[]>(MOCK_VCTS_CONSIGNMENTS);
  const [selectedVcts, setSelectedVcts] = useState<VctsConsignment | null>(
    MOCK_VCTS_CONSIGNMENTS[0]
  );

  const activeInTransit = consignments.filter((c) => c.status === "ACTIVE_IN_TRANSIT").length;
  const dischargedCount = consignments.filter((c) => c.status === "ARRIVED_DISCHARGED").length;
  const totalVolumeInTransit = consignments
    .filter((c) => c.status === "ACTIVE_IN_TRANSIT")
    .reduce((sum, c) => sum + c.volumeLiters, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "VCTS Consignment No",
      "Date (BS)",
      "Time (BS)",
      "Tanker Plate No",
      "Driver Name",
      "Driver License No",
      "Cargo Product",
      "Volume (Liters)",
      "Declared Value (NPR)",
      "Origin Depot",
      "Destination",
      "Status",
    ];

    const rows = consignments.map((c) => [
      `"${c.consignmentNo}"`,
      `"${c.dateBS}"`,
      `"${c.timeBS}"`,
      `"${c.tankerPlateNo}"`,
      `"${c.driverName}"`,
      `"${c.driverLicenseNo}"`,
      `"${c.productName}"`,
      `"${c.volumeLiters}"`,
      `"${c.declaredValueNpr}"`,
      `"${c.originDepot}"`,
      `"${c.destinationStation}"`,
      `"${c.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `vcts_tanker_consignments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: VctsStatus) => {
    switch (status) {
      case "ACTIVE_IN_TRANSIT":
        return <Badge tone="accent">Active in Transit</Badge>;
      case "VERIFIED_CHECKPOINT":
        return <Badge tone="success">Checkpoint Cleared</Badge>;
      case "ARRIVED_DISCHARGED":
        return <Badge tone="success">Discharged at Tanks</Badge>;
      case "FLAGGED_INSPECTION":
        return <Badge tone="error">Flagged for Inspection</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Ship size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              VCTS Fuel Tanker Consignment Tracking (ढुवानी तथा साधन ट्र्याकिङ प्रणाली)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Statutory Department of Revenue Investigation (DRI / राजस्व अनुसन्धान विभाग) consignment tracking for inbound petroleum tankers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print VCTS e-Pass
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Tankers Currently In-Transit"
          value={`${activeInTransit} Active Tankers`}
          icon={Truck}
          tone="accent"
          small
        />
        <StatCard
          label="In-Transit Fuel Volume"
          value={fmtL(totalVolumeInTransit)}
          icon={Ship}
          tone="text"
          small
        />
        <StatCard
          label="Completed Discharges"
          value={`${dischargedCount} Consignments`}
          icon={CheckCircle2}
          tone="success"
          small
        />
        <StatCard
          label="DRI Portal Status"
          value="Connected & Active"
          icon={ShieldCheck}
          tone="success"
          small
        />
      </div>

      {/* Split View: Consignment Register (7 cols) + VCTS e-Pass & QR Preview (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Consignments List (7 cols) */}
        <div className="space-y-3 lg:col-span-7">
          <h4 className="font-display text-[14px] font-bold text-text">
            Inbound Consignment Register ({consignments.length} Tankers)
          </h4>

          <div className="space-y-3">
            {consignments.map((c) => {
              const isSelected = selectedVcts?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedVcts(c)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-border bg-surface hover:border-accent/30 hover:bg-surface-hi"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-accent text-[13.5px]">
                          {c.consignmentNo}
                        </span>
                        <span className="font-mono bg-surface-hi px-2 py-0.5 rounded text-[11px] font-semibold text-text">
                          {c.tankerPlateNo}
                        </span>
                      </div>
                      <div className="mt-1 font-semibold text-text text-[13px]">
                        {c.productName} · {fmtL(c.volumeLiters)}
                      </div>
                    </div>
                    <div>{getStatusBadge(c.status)}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] text-text-muted border-t border-border/80 pt-2.5">
                    <div>
                      <strong>Driver:</strong> {c.driverName} ({c.driverLicenseNo})
                    </div>
                    <div className="text-right">
                      <strong>Declared Value:</strong> {fmtRs(c.declaredValueNpr)}
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <MapPin size={13} className="text-accent shrink-0" />
                      <span>{c.originDepot} → {c.destinationStation}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Official DRI VCTS e-Pass Format (5 cols) */}
        <div className="lg:col-span-5">
          {selectedVcts ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="border-b border-border pb-3 text-center">
                <div className="font-display text-[14px] font-bold text-text uppercase">
                  Government of Nepal · Ministry of Finance
                </div>
                <div className="font-semibold text-text text-[13px]">
                  Department of Revenue Investigation (राजस्व अनुसन्धान विभाग)
                </div>
                <div className="mt-1 inline-block rounded bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                  VCTS e-Consignment Transit Pass (अनुसूची १)
                </div>
              </div>

              {/* QR Code Placeholder Box */}
              <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg p-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-white p-2 shadow-sm">
                  <QrCode size={80} className="text-black" />
                </div>
                <div className="mt-2 font-mono text-[11px] font-bold text-text">
                  {selectedVcts.consignmentNo}
                </div>
                <div className="text-[10.5px] text-text-muted">
                  Scan at Highway DRI Checkpoint to Verify
                </div>
              </div>

              {/* Transit Details */}
              <div className="space-y-2 text-[12px] text-text border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-text-muted">Tanker Plate No:</span>
                  <span className="font-mono font-bold text-text">{selectedVcts.tankerPlateNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Driver In-Charge:</span>
                  <span className="font-medium text-text">{selectedVcts.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Driver License:</span>
                  <span className="font-mono text-text">{selectedVcts.driverLicenseNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Consignment Cargo:</span>
                  <span className="font-semibold text-text">{selectedVcts.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Volume:</span>
                  <span className="font-data font-bold text-accent">{fmtL(selectedVcts.volumeLiters)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Declared Value:</span>
                  <span className="font-data font-bold text-text">{fmtRs(selectedVcts.declaredValueNpr)}</span>
                </div>
              </div>

              {/* Checkpoint Clearance Logs */}
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-[11.5px] font-semibold text-text mb-2">
                  DRI Highway Checkpoint Inspections:
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {selectedVcts.checkpointLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border border-border bg-bg px-2.5 py-1.5"
                    >
                      <div>
                        <div className="font-medium text-text">{log.checkpointName}</div>
                        <div className="text-[10px] text-text-muted">Officer: {log.officerName}</div>
                      </div>
                      <span className="font-mono font-semibold text-accent">{log.timeBS}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-text-muted">
              Select a consignment to view VCTS Transit Pass & QR Code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
