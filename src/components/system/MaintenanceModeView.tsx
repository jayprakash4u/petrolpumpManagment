"use client";

import { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  Power,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Fuel,
  Clock,
  Plus,
  FileCheck,
  Scale,
} from "lucide-react";
import { clsx } from "clsx";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Field } from "@/components/ui/Field";

interface MaintenanceLog {
  id: string;
  equipment: string;
  type: string;
  technician: string;
  dateBS: string;
  status: "COMPLETED" | "SCHEDULED" | "IN_PROGRESS";
  notes: string;
}

export function MaintenanceModeView() {
  const [stationFreeze, setStationFreeze] = useState(false);
  const [bayStatus, setBayStatus] = useState<Record<string, boolean>>({
    bay1: false,
    bay2: false,
    bay3: true, // Bay 3 in maintenance
    bay4: false,
  });

  const [logs, setLogs] = useState<MaintenanceLog[]>([
    {
      id: "m-1",
      equipment: "Dispenser Bay 03 — Diesel Nozzle 5 Flowmeter",
      type: "NBSM Metrology Stamping & Calibration",
      technician: "Department of Quality & Metrology (नापतौल विभाग)",
      dateBS: "2083-05-08",
      status: "IN_PROGRESS",
      notes: "Flow accuracy adjusted to 0.05% margin; awaiting official lead seal.",
    },
    {
      id: "m-2",
      equipment: "Underground Tank 01 (MS Petrol 20KL)",
      type: "Tank Hydrostatic & Sludge Dip Audit",
      technician: "Nepal Oil Corp Technical Team",
      dateBS: "2083-05-01",
      status: "COMPLETED",
      notes: "Water bottom dip 0.0mm; suction filter mesh cleaned.",
    },
    {
      id: "m-3",
      equipment: "Forecourt Emergency E-Stop Circuit & Generator",
      type: "Safety Relay Continuity Test",
      technician: "Mid-Valley Engineering Services",
      dateBS: "2083-04-20",
      status: "COMPLETED",
      notes: "Auto-cut response time 420ms (well under 1.0s safety requirement).",
    },
  ]);

  const [newLogEquipment, setNewLogEquipment] = useState("");
  const [newLogTech, setNewLogTech] = useState("");
  const [newLogNotes, setNewLogNotes] = useState("");
  const [isAddingLog, setIsAddingLog] = useState(false);

  const toggleBay = (bayKey: string) => {
    setBayStatus((prev) => ({
      ...prev,
      [bayKey]: !prev[bayKey],
    }));
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogEquipment.trim()) return;

    const newEntry: MaintenanceLog = {
      id: `m-${Date.now()}`,
      equipment: newLogEquipment,
      type: "Equipment Inspection & Maintenance",
      technician: newLogTech || "Authorized Technician",
      dateBS: "2083-05-08",
      status: "COMPLETED",
      notes: newLogNotes || "Routine maintenance inspection performed.",
    };

    setLogs([newEntry, ...logs]);
    setIsAddingLog(false);
    setNewLogEquipment("");
    setNewLogTech("");
    setNewLogNotes("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Wrench size={22} />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Maintenance Mode & Forecourt Safety (मर्मत तथा सुरक्षा व्यवस्थापन)
            </h2>
            <p className="text-[12px] text-text-muted">
              Dispenser lockout controls, metrology calibration records, and station maintenance scheduling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrimaryButton
            type="button"
            onClick={() => setIsAddingLog(true)}
            className="text-[12.5px] px-3.5 py-1.5"
          >
            <Plus size={14} /> Log Service Record
          </PrimaryButton>
        </div>
      </div>

      {/* 1. Master Station Freeze Warning Card */}
      <div
        className={clsx(
          "rounded-2xl border p-5 transition-all shadow-xs",
          stationFreeze
            ? "border-error bg-error/10 text-error"
            : "border-border bg-surface text-text"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={clsx(
                "flex h-11 w-11 items-center justify-center rounded-xl font-bold",
                stationFreeze ? "bg-error text-white" : "bg-surface-hi text-text-muted"
              )}
            >
              <Power size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] font-bold">
                  {stationFreeze ? "Station Forecourt is Frozen (HALTED)" : "Station Forecourt Sales: ACTIVE"}
                </h3>
                {stationFreeze ? (
                  <Badge tone="error">SALES LOCKED</Badge>
                ) : (
                  <Badge tone="success">ONLINE</Badge>
                )}
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">
                {stationFreeze
                  ? "All dispenser sales are currently blocked across the forecourt for tank decanting or dip audit."
                  : "Enable to temporarily freeze all pump transactions during fuel decanting or tank calibration."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStationFreeze(!stationFreeze)}
            className={clsx(
              "cursor-pointer rounded-xl px-4 py-2 text-[13px] font-bold transition-all shadow-sm",
              stationFreeze
                ? "bg-success text-white hover:bg-success/90"
                : "bg-error text-white hover:bg-error/90"
            )}
          >
            {stationFreeze ? "Resume Station Operations" : "Freeze Station (Maintenance)"}
          </button>
        </div>
      </div>

      {/* 2. Individual Dispenser Bay Status Grid */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Fuel size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Dispenser Bay Lockout Controls
            </h3>
          </div>
          <span className="text-[12px] text-text-muted">
            Lock out specific bays during nozzle repair or metrology testing
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "bay1", name: "Bay 01 — Island A", fuels: "Petrol MS 91 (Nozzle 1 & 2)" },
            { key: "bay2", name: "Bay 02 — Island A", fuels: "Diesel HSD (Nozzle 3 & 4)" },
            { key: "bay3", name: "Bay 03 — Island B", fuels: "Diesel HSD (Nozzle 5 & 6)" },
            { key: "bay4", name: "Bay 04 — Island C", fuels: "Auto CNG (Nozzle 7 & 8)" },
          ].map((bay) => {
            const isUnderMaintenance = bayStatus[bay.key];
            return (
              <div
                key={bay.key}
                className={clsx(
                  "rounded-xl border p-4 space-y-3 transition-colors",
                  isUnderMaintenance
                    ? "border-warning/50 bg-warning/5"
                    : "border-border bg-bg"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[13px] text-text">
                    {bay.name.split("—")[0]}
                  </span>
                  {isUnderMaintenance ? (
                    <Badge tone="error">MAINTENANCE</Badge>
                  ) : (
                    <Badge tone="success">OPERATIONAL</Badge>
                  )}
                </div>

                <div className="text-[11.5px] text-text-muted">{bay.fuels}</div>

                <button
                  type="button"
                  onClick={() => toggleBay(bay.key)}
                  className={clsx(
                    "w-full rounded-lg border py-1.5 text-center text-[12px] font-semibold transition-colors cursor-pointer",
                    isUnderMaintenance
                      ? "border-success/40 bg-success/15 text-success hover:bg-success/20"
                      : "border-warning/40 bg-warning/15 text-warning hover:bg-warning/20"
                  )}
                >
                  {isUnderMaintenance ? "Set Operational" : "Set Maintenance"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Add Service Log Modal */}
      {isAddingLog && (
        <form onSubmit={handleAddLog} className="rounded-2xl border border-accent/40 bg-surface p-5 space-y-4 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-display text-[15px] font-bold text-text flex items-center gap-2">
              <Wrench size={16} className="text-accent" /> Log Equipment Service Record
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingLog(false)}
              className="text-text-muted hover:text-text text-[12px]"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Equipment / Dispenser Component" htmlFor="eqName">
              <Input
                id="eqName"
                value={newLogEquipment}
                onChange={(e) => setNewLogEquipment(e.target.value)}
                placeholder="e.g. Bay 02 Diesel Flowmeter"
                required
                autoFocus
              />
            </Field>

            <Field label="Service Technician / Agency" htmlFor="eqTech">
              <Input
                id="eqTech"
                value={newLogTech}
                onChange={(e) => setNewLogTech(e.target.value)}
                placeholder="e.g. NBSM Metrology Inspector / Mid-Valley"
                required
              />
            </Field>
          </div>

          <Field label="Service Notes & Calibration Outcome" htmlFor="eqNotes">
            <Input
              id="eqNotes"
              value={newLogNotes}
              onChange={(e) => setNewLogNotes(e.target.value)}
              placeholder="e.g. Lead seal inspected and verified 100% accurate."
            />
          </Field>

          <div className="flex justify-end gap-2">
            <GhostButton type="button" onClick={() => setIsAddingLog(false)}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit">
              Save Service Record
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* 4. Equipment Service History Table */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-accent" />
            <h3 className="font-display text-[15px] font-bold text-text">
              Equipment Calibration & Inspection Log
            </h3>
          </div>
          <span className="text-[12px] text-text-muted font-data">
            {logs.length} Recorded Inspections
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-3 py-2.5">Date (BS)</th>
                <th className="px-3 py-2.5">Equipment / Component</th>
                <th className="px-3 py-2.5">Inspection Type</th>
                <th className="px-3 py-2.5">Technician / Agency</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5">Service Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hi/40">
                  <td className="px-3 py-3 text-accent font-semibold">{log.dateBS}</td>
                  <td className="px-3 py-3 font-medium text-text">{log.equipment}</td>
                  <td className="px-3 py-3 text-text-muted">{log.type}</td>
                  <td className="px-3 py-3 text-text-muted font-body">{log.technician}</td>
                  <td className="px-3 py-3 text-center">
                    {log.status === "COMPLETED" ? (
                      <Badge tone="success">COMPLETED</Badge>
                    ) : (
                      <Badge tone="error">IN PROGRESS</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 font-body text-text-muted max-w-xs truncate text-[12px]">
                    {log.notes}
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
