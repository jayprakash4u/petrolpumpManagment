import type { FuelType } from "@/lib/permissions";

export type QuotaFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface CorporateAccount {
  id: string;
  accountCode: string; // e.g. "CORP-KMC"
  companyName: string;
  panVatNo: string;
  billingContactPerson: string;
  phone: string;
  email: string;
  officeAddress: string;
  monthlyCreditLimitNpr: number;
  currentDueBalanceNpr: number;
  securityDepositNpr: number;
  billingCycleDay: number; // e.g. 1st or 30th of BS month
  totalRegisteredVehicles: number;
  active: boolean;
  status: "ACTIVE" | "CREDIT_HOLD" | "SUSPENDED";
}

export interface FleetVehicle {
  id: string;
  vehiclePlateNo: string; // e.g. "Ba 1 Gha 2891"
  accountId: string;
  companyName: string;
  vehicleType: "Heavy Bus / Truck" | "Light Commercial Pickup" | "Patrol SUV / Jeep" | "Motorcycle / Scooter" | "Generator Set";
  fuelAllowed: FuelType | "ANY";
  assignedDriverName: string;
  driverPhone: string;
  driverLicenseNo: string;
  dailyQuotaL: number; // Max litres allowed per day
  monthlyQuotaL: number; // Max litres allowed per month
  currentMonthConsumedL: number;
  lastOdometerKm: number;
  rfidTagId?: string;
  status: "AUTHORIZED" | "QUOTA_LOCKED" | "BLOCKED";
}

export interface FleetDispenseLog {
  id: string;
  dateBS: string;
  time: string;
  receiptNo: number;
  vehiclePlateNo: string;
  accountId: string;
  companyName: string;
  fuel: FuelType;
  litresDispensed: number;
  ratePerL: number;
  totalAmountNpr: number;
  driverName: string;
  odometerKm: number;
  attendantName: string;
  dispenserBay: string;
  status: "APPROVED" | "OVERRIDE_APPROVED" | "FLAGGED";
}

export interface CorporateStatement {
  id: string;
  statementNo: string; // e.g. "STMT-2083-05-KMC"
  accountId: string;
  companyName: string;
  panVatNo: string;
  periodBS: string; // e.g. "2083-04-01 to 2083-04-30"
  openingBalanceNpr: number;
  totalFuelVolumeL: number;
  totalFuelAmountNpr: number;
  lubricantsAmountNpr: number;
  paymentsReceivedNpr: number;
  closingBalanceDueNpr: number;
  dueDateBS: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "SETTLED";
  totalFillsCount: number;
}

export interface CorporateSummaryTotals {
  totalCorporateReceivablesNpr: number;
  monthlyFleetVolumeL: number;
  totalRegisteredVehiclesCount: number;
  activeCorporateAccountsCount: number;
  totalFleetSpendThisMonthNpr: number;
}

/**
 * Validates whether a fleet vehicle is authorized to dispense fuel.
 */
export function validateFleetDispense(
  vehicle: FleetVehicle,
  account: CorporateAccount,
  requestedL: number,
  fuelRequested: FuelType
): { allowed: boolean; reason?: string } {
  if (!account.active || account.status !== "ACTIVE") {
    return { allowed: false, reason: `Corporate account ${account.companyName} is in ${account.status} status.` };
  }

  if (vehicle.status !== "AUTHORIZED") {
    return { allowed: false, reason: `Vehicle ${vehicle.vehiclePlateNo} is ${vehicle.status}. Contact station manager.` };
  }

  if (vehicle.fuelAllowed !== "ANY" && vehicle.fuelAllowed !== fuelRequested) {
    return { allowed: false, reason: `Vehicle is restricted to ${vehicle.fuelAllowed} only (requested ${fuelRequested}).` };
  }

  if (requestedL > vehicle.dailyQuotaL) {
    return { allowed: false, reason: `Requested ${requestedL}L exceeds daily vehicle quota limit of ${vehicle.dailyQuotaL}L.` };
  }

  if (vehicle.currentMonthConsumedL + requestedL > vehicle.monthlyQuotaL) {
    return {
      allowed: false,
      reason: `Exceeds monthly vehicle quota limit (${vehicle.currentMonthConsumedL + requestedL}L / max ${vehicle.monthlyQuotaL}L).`,
    };
  }

  return { allowed: true };
}
