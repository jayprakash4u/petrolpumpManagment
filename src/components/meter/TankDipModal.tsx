"use client";

import { useState } from "react";
import { Plus, X, Ruler, Droplets, Check, Calculator } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { dipToVolumeLitres } from "@/lib/meter";
import { fmtL } from "@/lib/money";

const TANKS = [
  { id: "tank-petrol-1", name: "Underground Tank 1 (MS Petrol)", fuel: "PETROL", capacityL: 20000, currentBookL: 12460 },
  { id: "tank-diesel-1", name: "Underground Tank 2 (HSD Diesel)", fuel: "DIESEL", capacityL: 30000, currentBookL: 21835 },
  { id: "tank-cng-1", name: "Cascade Bank 3 (CNG)", fuel: "CNG", capacityL: 10000, currentBookL: 6425 },
];

export function TankDipModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [selectedTankId, setSelectedTankId] = useState(TANKS[0].id);
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [shift, setShift] = useState("Shift 1 (Morning)");
  const [dipCm, setDipCm] = useState("146.2");
  const [waterMm, setWaterMm] = useState("0");
  const [tempC, setTempC] = useState("24.5");
  const [density, setDensity] = useState("734.2");
  const [supervisor, setSupervisor] = useState("Anita Shrestha (Manager)");
  const [notes, setNotes] = useState("");

  const currentTank = TANKS.find((t) => t.id === selectedTankId)!;
  const dipNum = parseFloat(dipCm) || 0;
  const computedVolume = dipToVolumeLitres(dipNum, currentTank.capacityL);
  const varianceL = computedVolume - currentTank.currentBookL;
  const variancePct = currentTank.currentBookL > 0 ? (varianceL / currentTank.currentBookL) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
    }, 1200);
  };

  return (
    <>
      <PrimaryButton onClick={() => setOpen(true)} className="gap-2">
        <Plus size={16} />
        Record Tank Dip
      </PrimaryButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Ruler size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Record Physical Tank Dip</h3>
                  <p className="text-xs text-text-muted">Supervisory physical dipstick and water check</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Tank Dip Logged</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Physical stock of {fmtL(computedVolume)} recorded for {currentTank.name}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date (BS)">
                    <Input value={dateBS} onChange={(e) => setDateBS(e.target.value)} required />
                  </Field>
                  <Field label="Shift">
                    <Select value={shift} onChange={(e) => setShift(e.target.value)}>
                      <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
                      <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
                      <option value="Shift 3 (Night)">Shift 3 (Night)</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Select Underground Storage Tank">
                  <Select value={selectedTankId} onChange={(e) => setSelectedTankId(e.target.value)}>
                    {TANKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Cap: {fmtL(t.capacityL)})
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dip Height (cm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={dipCm}
                      onChange={(e) => setDipCm(e.target.value)}
                      placeholder="e.g. 146.2"
                      required
                    />
                  </Field>
                  <Field label="Water Dip (mm) - Finding Paste">
                    <Input
                      type="number"
                      step="1"
                      value={waterMm}
                      onChange={(e) => setWaterMm(e.target.value)}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Fuel Temperature (°C)">
                    <Input
                      type="number"
                      step="0.1"
                      value={tempC}
                      onChange={(e) => setTempC(e.target.value)}
                      placeholder="24.5"
                    />
                  </Field>
                  <Field label="Observed Density (kg/m³)">
                    <Input
                      type="number"
                      step="0.1"
                      value={density}
                      onChange={(e) => setDensity(e.target.value)}
                      placeholder="734.2"
                    />
                  </Field>
                </div>

                {/* Computed Result Box */}
                <div className="rounded-xl border border-accent/30 bg-accent/8 p-3.5">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5 font-medium text-text">
                      <Calculator size={14} className="text-accent" />
                      Calibrated Physical Volume:
                    </span>
                    <span className="font-data text-sm font-bold text-accent">{fmtL(computedVolume)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-text-muted">
                    <span>Book Stock: {fmtL(currentTank.currentBookL)}</span>
                    <span className="font-data font-semibold">
                      Variance:{" "}
                      <strong className={varianceL < 0 ? "text-error" : "text-success"}>
                        {varianceL > 0 ? `+${fmtL(varianceL)}` : fmtL(varianceL)} ({variancePct.toFixed(2)}%)
                      </strong>
                    </span>
                  </div>
                </div>

                <Field label="Supervisor / Inspector">
                  <Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} required />
                </Field>

                <Field label="Inspection Remarks">
                  <Input
                    placeholder="e.g. Kolor Kut water paste showed 0mm bottom water"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Tank Dip</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
