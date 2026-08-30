"use client";

import { useState } from "react";
import {
  Radio,
  Printer,
  Download,
  Gauge,
  Activity,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Sliders,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { fmtRs, fmtL } from "@/lib/money";
import { MOCK_PUMP_BAYS } from "@/lib/mock/pumps";

export function NozzleStatusView() {
  const [bays] = useState(MOCK_PUMP_BAYS);

  const allNozzles = bays.flatMap((b) =>
    b.nozzles.map((n) => ({
      ...n,
      bayName: b.name,
      bayNumber: b.pumpNumber,
      bayState: b.state,
      attendant: b.assignedAttendantName,
    }))
  );

  const activeNozzleCount = allNozzles.filter((n) => n.state === "DISPENSING").length;
  const totalCumulativeLiters = allNozzles.reduce((sum, n) => sum + n.cumulativeTotalizerL, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "Dispenser Bay",
      "Nozzle Number",
      "Fuel Grade",
      "State",
      "Live Flow Rate (L/min)",
      "Current Rate (NPR/L)",
      "Current Session Liters",
      "Current Session Amount (NPR)",
      "Cumulative Totalizer (Liters)",
      "Attendant",
    ];

    const rows = allNozzles.map((n) => [
      `"${n.bayName}"`,
      `"Nozzle #${n.nozzleNumber}"`,
      `"${n.productName}"`,
      `"${n.state}"`,
      `"${n.flowRateLpm}"`,
      `"${n.currentRatePerL}"`,
      `"${n.sessionLiters}"`,
      `"${n.sessionAmountNpr}"`,
      `"${n.cumulativeTotalizerL}"`,
      `"${n.attendant || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `nozzle_telemetry_totalizer_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Radio size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">
              Nozzle Status & Totalizer Telemetry (नोजल स्थिति तथा मिटर विवरण)
            </h3>
            <p className="text-[12.5px] text-text-muted">
              Live dispenser totalizers, microswitch lift sensors, and flow rates across all station islands.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostButton onClick={handlePrint} className="text-[12.5px]">
            <Printer size={14} /> Print Readings
          </GhostButton>
          <GhostButton onClick={handleExportCSV} className="text-[12.5px]">
            <Download size={14} /> Export CSV
          </GhostButton>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Station Nozzles"
          value={`${allNozzles.length} Configured`}
          icon={Radio}
          tone="accent"
          small
        />
        <StatCard
          label="Nozzles Currently Flowing"
          value={`${activeNozzleCount} Active`}
          icon={Activity}
          tone="success"
          small
        />
        <StatCard
          label="Cumulative Totalizer Volume"
          value={fmtL(totalCumulativeLiters)}
          icon={Gauge}
          tone="text"
          small
        />
        <StatCard
          label="Electronic Sensor Health"
          value="100% Online"
          icon={CheckCircle2}
          tone="success"
          small
        />
      </div>

      {/* Nozzles Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border bg-surface-hi text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-3">Dispenser / Bay</th>
                <th className="px-3 py-3">Nozzle #</th>
                <th className="px-3 py-3">Fuel Grade</th>
                <th className="px-3 py-3 text-center">Switch State</th>
                <th className="px-3 py-3 text-right">Flow (L/min)</th>
                <th className="px-3 py-3 text-right">Active Price</th>
                <th className="px-3 py-3 text-right">Live Session</th>
                <th className="px-4 py-3 text-right font-bold">Cumulative Totalizer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {allNozzles.map((n) => (
                <tr key={n.id} className="hover:bg-surface-hi/60 transition-colors">
                  <td className="px-4 py-3 font-body">
                    <div className="font-semibold text-text">{n.bayName}</div>
                    <div className="text-[11px] text-text-muted">Attendant: {n.attendant || "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-accent font-bold">
                    Nozzle #{n.nozzleNumber}
                  </td>
                  <td className="px-3 py-3 font-body">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          n.fuelType === "PETROL"
                            ? "bg-amber-500"
                            : n.fuelType === "DIESEL"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-semibold text-text">{n.productName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-body">
                    {n.state === "DISPENSING" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                        LIFTED / FLOWING
                      </span>
                    ) : (
                      <span className="rounded bg-surface-hi px-2 py-0.5 text-[11px] text-text-muted">
                        HUNG UP (HOLSTER)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-text">
                    {n.flowRateLpm > 0 ? `${n.flowRateLpm.toFixed(1)} L/m` : "0.0"}
                  </td>
                  <td className="px-3 py-3 text-right text-text-muted">
                    Rs {n.currentRatePerL.toFixed(2)}/L
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-text">
                    {n.sessionLiters > 0 ? (
                      <div>
                        <span className="text-success font-bold">{n.sessionLiters.toFixed(2)} L</span>
                        <div className="text-[10.5px] text-text-muted">{fmtRs(n.sessionAmountNpr)}</div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-accent font-mono text-[13px]">
                    {n.cumulativeTotalizerL.toLocaleString("en-IN", { minimumFractionDigits: 1 })}{" "}
                    <span className="text-[11px] font-normal text-text-muted">L</span>
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
