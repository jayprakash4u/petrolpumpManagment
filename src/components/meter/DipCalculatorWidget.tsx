"use client";

import { useState } from "react";
import { Calculator, Ruler, Fuel, ArrowRight } from "lucide-react";
import { dipToVolumeLitres } from "@/lib/meter";
import { fmtL } from "@/lib/money";
import { Field, Select, Input } from "@/components/ui/Field";

const TANKS = [
  { id: "tank-petrol-1", name: "Underground Tank 1 (Petrol)", capacityL: 20000, maxDipCm: 240 },
  { id: "tank-diesel-1", name: "Underground Tank 2 (Diesel)", capacityL: 30000, maxDipCm: 270 },
  { id: "tank-cng-1", name: "Cascade Bank 3 (CNG)", capacityL: 10000, maxDipCm: 180 },
];

export function DipCalculatorWidget() {
  const [tankId, setTankId] = useState(TANKS[0].id);
  const [dipCm, setDipCm] = useState<number>(146.2);

  const tank = TANKS.find((t) => t.id === tankId)!;
  const volumeL = dipToVolumeLitres(dipCm, tank.capacityL);
  const pct = Math.min(100, Math.max(0, (volumeL / tank.capacityL) * 100));
  const roomL = Math.max(0, tank.capacityL - volumeL);
  const safeUllage95 = Math.max(0, tank.capacityL * 0.95 - volumeL);

  return (
    <div className="rounded-xl border border-border bg-bg p-4.5">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Calculator size={15} />
          </div>
          <div>
            <h4 className="font-display text-[14px] font-bold text-text">Live Dip-to-Litre Calculator</h4>
            <p className="text-[11.5px] text-text-muted">Instant conversion using calibrated tank curves</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Field label="Select Storage Tank">
            <Select value={tankId} onChange={(e) => setTankId(e.target.value)}>
              {TANKS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Max {t.maxDipCm} cm)
                </option>
              ))}
            </Select>
          </Field>

          <Field label={`Dipstick Height (${dipCm.toFixed(1)} cm / max ${tank.maxDipCm} cm)`}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                max={tank.maxDipCm}
                value={dipCm}
                onChange={(e) => setDipCm(Math.max(0, Math.min(tank.maxDipCm, parseFloat(e.target.value) || 0)))}
                className="w-28 text-center font-bold text-accent"
              />
              <input
                type="range"
                min="0"
                max={tank.maxDipCm}
                step="0.5"
                value={dipCm}
                onChange={(e) => setDipCm(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-accent"
              />
            </div>
          </Field>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-surface/80 p-4">
          <div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Calibrated Fuel Volume</span>
              <span className="font-data font-semibold text-accent">{pct.toFixed(1)}% Full</span>
            </div>
            <div className="font-data mt-1 text-2xl font-extrabold tracking-tight text-text">
              {fmtL(volumeL)}
            </div>

            {/* Visual Gauge Bar */}
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-hi">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-[11px] text-text-muted">
            <div>
              <div>Total Ullage (Room)</div>
              <div className="font-data text-xs font-semibold text-text">{fmtL(roomL)}</div>
            </div>
            <div className="text-right">
              <div>Safe Delivery Room (95%)</div>
              <div className="font-data text-xs font-semibold text-success">{fmtL(safeUllage95)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
