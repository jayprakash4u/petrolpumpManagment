import { Prisma, type FuelType } from "@prisma/client";
import { toDecimal, fmtL, fmtRs, fmtRate } from "@/lib/money";

export type ShiftName = "Shift 1 (Morning)" | "Shift 2 (Evening)" | "Shift 3 (Night)";

export interface DispenserNozzle {
  id: string;
  dispenserId: string;
  dispenserName: string; // e.g. "Dispenser 01 (MPD)"
  nozzleNumber: number; // 1, 2
  fuel: FuelType;
  tankId: string;
  currentElectronicTotaliser: number; // In litres
  currentMechanicalTotaliser: number; // In litres
  ratePerL: number;
  lastReadingBS: string;
  assignedAttendant: string;
  status: "active" | "maintenance" | "idle";
}

export interface NozzleReadingEntry {
  id: string;
  dateBS: string;
  shift: ShiftName;
  dispenserId: string;
  dispenserName: string;
  nozzleId: string;
  fuel: FuelType;
  attendantId: string;
  attendantName: string;
  openingElectronic: number;
  closingElectronic: number;
  openingMechanical: number;
  closingMechanical: number;
  testMeasureL: number; // 5L calibration test poured back into tank
  netSoldL: number; // (Closing - Opening) - testMeasureL
  ratePerL: number;
  totalAmount: number;
  status: "verified" | "pending" | "reconciled";
  notes?: string;
}

export interface TankDipEntry {
  id: string;
  dateBS: string;
  time: string;
  shift: ShiftName;
  tankId: string;
  tankName: string;
  fuel: FuelType;
  capacityL: number;
  dipHeightCm: number;
  waterDipMm: number; // mm of water at tank bottom
  physicalVolumeL: number;
  bookStockL: number;
  varianceL: number; // Physical - Book
  variancePct: number; // (Variance / Book) * 100
  temperatureC: number;
  observedDensity: number; // kg/m³
  density15C: number; // standard density at 15°C
  recordedBy: string;
  status: "normal" | "tolerable" | "investigate";
  notes?: string;
}

export interface ShiftReconciliationData {
  id: string;
  dateBS: string;
  shift: ShiftName;
  supervisorName: string;
  attendants: string[];
  status: "reconciled" | "requires_review" | "open";
  fuels: {
    fuel: FuelType;
    openingDipL: number;
    receiptsL: number;
    closingDipL: number;
    physicalDepletionL: number; // Opening + Receipts - Closing
    nozzleTotaliserSoldL: number;
    posBilledL: number;
    volumeVarianceL: number; // Nozzle - Depletion
    variancePct: number;
    ratePerL: number;
    pumpRevenue: number;
    billedRevenue: number;
  }[];
  financials: {
    totalMeterRevenue: number;
    cashCollected: number;
    creditSlips: number;
    digitalPayments: number; // QR / Card
    totalCollected: number;
    shortageSurplus: number; // Total Collected - Total Meter Revenue
  };
  notes?: string;
}

/**
 * Standard horizontal cylindrical tank dip calculation with dished ends.
 * Converts dip height in cm to volume in litres for typical fuel storage tanks.
 * Height range: 0 cm to max tank diameter (~240 cm for 20kL tank, ~270 cm for 30kL tank).
 */
export function dipToVolumeLitres(dipCm: number, capacityL: number): number {
  if (dipCm <= 0) return 0;
  // Tank diameters approximated for standard Indian/Nepali petrol station underground tanks
  const maxDipCm = capacityL >= 30000 ? 270 : capacityL >= 20000 ? 240 : 180;
  if (dipCm >= maxDipCm) return capacityL;

  const h = dipCm;
  const D = maxDipCm;
  const r = D / 2;

  // Normalized height from 0 to 1
  const x = Math.min(1, Math.max(0, h / D));

  // Circular segment volume ratio: (theta - sin(theta)) / (2 * pi)
  // where cos(theta/2) = 1 - 2x
  const alpha = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 2 * x)));
  const areaRatio = (alpha - Math.sin(alpha)) / (2 * Math.PI);

  // Apply non-linear dished-end correction factor
  const volume = capacityL * areaRatio;
  return Math.round(volume * 10) / 10;
}

/**
 * Calculates stock loss / gain variance status based on standard petroleum operating tolerances (±0.20%).
 */
export function getVarianceStatus(varianceL: number, totalVolumeL: number): "normal" | "tolerable" | "investigate" {
  if (totalVolumeL === 0) return "normal";
  const pct = Math.abs((varianceL / totalVolumeL) * 100);
  if (pct <= 0.15) return "normal";
  if (pct <= 0.35) return "tolerable";
  return "investigate";
}
