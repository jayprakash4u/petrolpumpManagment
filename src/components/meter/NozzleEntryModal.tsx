"use client";

import { useState } from "react";
import { Plus, X, Gauge, Calculator, Check } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { MOCK_DISPENSERS_AND_NOZZLES } from "@/lib/mock/meter";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtL, fmtRs, fmtRate } from "@/lib/money";

export function NozzleEntryModal({ onAddReading }: { onAddReading?: (entry: unknown) => void }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [selectedNozzleId, setSelectedNozzleId] = useState(MOCK_DISPENSERS_AND_NOZZLES[0].id);
  const [shift, setShift] = useState("Shift 1 (Morning)");
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [attendant, setAttendant] = useState("Ramesh Thapa");
  
  const selectedNozzle = MOCK_DISPENSERS_AND_NOZZLES.find((n) => n.id === selectedNozzleId)!;
  
  const [openingMeter, setOpeningMeter] = useState(String(selectedNozzle.currentElectronicTotaliser - 1200));
  const [closingMeter, setClosingMeter] = useState(String(selectedNozzle.currentElectronicTotaliser));
  const [testMeasure, setTestMeasure] = useState("5.0");
  const [notes, setNotes] = useState("");

  const openingNum = parseFloat(openingMeter) || 0;
  const closingNum = parseFloat(closingMeter) || 0;
  const testNum = parseFloat(testMeasure) || 0;
  const netVolume = Math.max(0, closingNum - openingNum - testNum);
  const totalAmount = netVolume * selectedNozzle.ratePerL;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
    }, 1200);
  };

  const handleNozzleChange = (id: string) => {
    setSelectedNozzleId(id);
    const n = MOCK_DISPENSERS_AND_NOZZLES.find((item) => item.id === id);
    if (n) {
      setClosingMeter(String(n.currentElectronicTotaliser));
      setOpeningMeter(String(n.currentElectronicTotaliser - 1000));
    }
  };

  return (
    <>
      <PrimaryButton onClick={() => setOpen(true)} className="gap-2">
        <Plus size={16} />
        Record Nozzle Reading
      </PrimaryButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Gauge size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Record Nozzle Meter Reading</h3>
                  <p className="text-xs text-text-muted">Opening and closing totaliser for shift close</p>
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
                <h4 className="font-display text-base font-semibold text-text">Reading Logged Successfully</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Recorded {fmtL(netVolume)} ({fmtRs(totalAmount)}) for {selectedNozzle.dispenserName}.
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

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Dispenser & Nozzle">
                    <Select value={selectedNozzleId} onChange={(e) => handleNozzleChange(e.target.value)}>
                      {MOCK_DISPENSERS_AND_NOZZLES.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.dispenserName.split(" ")[0]} {n.dispenserName.split(" ")[1]} · Nozzle {n.nozzleNumber} (
                          {FUEL_LABEL[n.fuel]})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Assigned Attendant">
                    <Select value={attendant} onChange={(e) => setAttendant(e.target.value)}>
                      <option value="Ramesh Thapa">Ramesh Thapa</option>
                      <option value="Sita Sharma">Sita Sharma</option>
                      <option value="Bikash Adhikari">Bikash Adhikari</option>
                      <option value="Anita Shrestha">Anita Shrestha</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Opening Totaliser (L)">
                    <Input
                      type="number"
                      step="0.01"
                      value={openingMeter}
                      onChange={(e) => setOpeningMeter(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Closing Totaliser (L)">
                    <Input
                      type="number"
                      step="0.01"
                      value={closingMeter}
                      onChange={(e) => setClosingMeter(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Test Measure (L) - Calib. Can">
                    <Input
                      type="number"
                      step="0.1"
                      value={testMeasure}
                      onChange={(e) => setTestMeasure(e.target.value)}
                      placeholder="e.g. 5.0"
                    />
                  </Field>
                  <Field label="Pump Rate">
                    <div className="w-full rounded-lg border border-border bg-bg/50 px-3 py-2 font-data text-sm text-text-muted">
                      {fmtRate(selectedNozzle.ratePerL)}/L
                    </div>
                  </Field>
                </div>

                {/* Calculation Preview Banner */}
                <div className="rounded-xl border border-accent/30 bg-accent/8 p-3.5">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5 font-medium text-text">
                      <Calculator size={14} className="text-accent" />
                      Calculated Volume:
                    </span>
                    <span className="font-data text-sm font-bold text-text">{fmtL(netVolume)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between border-t border-border/40 pt-1.5 text-xs text-text-muted">
                    <span>Expected Total Amount:</span>
                    <span className="font-data text-base font-bold text-accent">{fmtRs(totalAmount)}</span>
                  </div>
                </div>

                <Field label="Operational Notes (Optional)">
                  <Input
                    placeholder="e.g. Morning 5L standard test verified"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Field>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Save Reading</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
