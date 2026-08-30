export type PumpState = "IDLE" | "AUTHORIZING" | "DISPENSING" | "PAUSED" | "OFFLINE" | "ESTOP_LOCKED";

export type NozzleState = "HUNG_UP" | "LIFTED" | "DISPENSING" | "LATCH_ERROR";

export interface NozzleTelemetry {
  id: string;
  nozzleNumber: number; // 1, 2, 3...
  fuelType: "PETROL" | "DIESEL" | "CNG";
  productName: string;
  state: NozzleState;
  currentRatePerL: number;
  flowRateLpm: number; // Liters per minute (0 when idle, ~28-45 when dispensing)
  sessionLiters: number;
  sessionAmountNpr: number;
  cumulativeTotalizerL: number;
}

export interface PumpBay {
  id: string;
  pumpNumber: number; // Pump 1, Pump 2, etc.
  name: string;
  model: string; // e.g. "Wayne Helix 5000 MPD" or "Tatsuno Ultra Flow"
  ipAddress: string;
  state: PumpState;
  assignedAttendantName?: string;
  currentVehicleNo?: string;
  currentCustomerName?: string;
  nozzles: NozzleTelemetry[];
  lastHeartbeatBS: string;
  todayLiters: number;
  todaySalesNpr: number;
  isEstopActive: boolean;
}

export interface ForecourtStats {
  totalPumps: number;
  activeDispensing: number;
  idleReady: number;
  offlineOrLocked: number;
  totalFlowRateLpm: number;
  todayTotalLiters: number;
  todayTotalRevenueNpr: number;
  isStationEstopActive: boolean;
}
