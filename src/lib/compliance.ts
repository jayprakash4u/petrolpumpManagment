export type IrdSyncStatus = "SYNCED" | "PENDING" | "FAILED" | "OFFLINE_QUEUED";

export interface IrdCbmsEntry {
  id: string;
  invoiceNo: string;
  dateBS: string;
  dateAD: string;
  customerName: string;
  customerPan: string;
  taxableAmountNpr: number;
  vatAmountNpr: number;
  totalAmountNpr: number;
  syncStatus: IrdSyncStatus;
  syncedAtBS?: string;
  cbmsAckCode?: string; // e.g. "IRD-ACK-830508-49021"
  retryCount: number;
  errorMessage?: string;
}

export interface IrdApiConfig {
  sellerPan: string;
  stationName: string;
  apiUrl: string;
  environment: "PRODUCTION" | "SANDBOX_TEST";
  autoSyncEnabled: boolean;
  heartbeatStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  lastHeartbeatBS: string;
}

export type NocLoadingStatus =
  | "INDENT_PLACED"
  | "PAYMENT_CONFIRMED"
  | "LOADING_AT_DEPOT"
  | "IN_TRANSIT"
  | "DELIVERED_DECANTED"
  | "CANCELLED";

export interface NocIndentOrder {
  id: string;
  indentNumber: string; // e.g. "NOC-IND-8305-102"
  dateBS: string;
  depotName: string; // e.g. "Amlekhgunj Regional Depot"
  productType: "PETROL_MS" | "DIESEL_HSD" | "CNG";
  orderedLiters: number;
  ratePerL: number;
  totalCostNpr: number;
  tankerPlateNo: string;
  driverName: string;
  driverPhone: string;
  loadingStatus: NocLoadingStatus;
  estimatedArrivalBS: string;
  decantedLiters?: number;
  decantingLossLiters?: number; // Variance
}

export interface NocPricingNotice {
  id: string;
  circularNo: string;
  effectiveDateBS: string;
  product: string;
  oldWholesaleRateNpr: number;
  newWholesaleRateNpr: number;
  dealerMarginNpr: number;
  retailSellingPriceNpr: number;
}

export type VctsStatus = "ACTIVE_IN_TRANSIT" | "VERIFIED_CHECKPOINT" | "ARRIVED_DISCHARGED" | "FLAGGED_INSPECTION";

export interface VctsConsignment {
  id: string;
  consignmentNo: string; // e.g. "VCTS-DRI-8305-4921"
  dateBS: string;
  timeBS: string;
  tankerPlateNo: string; // e.g. "NA 4 KHA 8912"
  driverName: string;
  driverLicenseNo: string;
  originDepot: string; // "NOC Depot Amlekhgunj, Bara"
  destinationStation: string; // "Shree Pashupati Petroleum, Maharajgunj, KTM"
  productName: string;
  volumeLiters: number;
  declaredValueNpr: number;
  vctsQrPayload: string;
  status: VctsStatus;
  checkpointLogs: { checkpointName: string; timeBS: string; officerName: string }[];
}

/**
 * Calculates IRD sync health metrics.
 */
export function calculateIrdSyncStats(entries: IrdCbmsEntry[]) {
  const total = entries.length;
  const synced = entries.filter((e) => e.syncStatus === "SYNCED").length;
  const pending = entries.filter((e) => e.syncStatus === "PENDING" || e.syncStatus === "OFFLINE_QUEUED").length;
  const failed = entries.filter((e) => e.syncStatus === "FAILED").length;
  const syncRatePct = total > 0 ? Math.round((synced / total) * 100) : 100;

  return { total, synced, pending, failed, syncRatePct };
}

/**
 * Validates tanker decanting loss against allowable NOC tolerance (0.20%).
 */
export function evaluateDecantingLoss(orderedLiters: number, decantedLiters: number) {
  const lossLiters = Math.max(0, orderedLiters - decantedLiters);
  const lossPct = (lossLiters / orderedLiters) * 100;
  const maxAllowedLossLiters = orderedLiters * 0.002; // 0.20% standard tolerance
  const isClaimableLoss = lossLiters > maxAllowedLossLiters;
  const claimableLiters = isClaimableLoss ? lossLiters - maxAllowedLossLiters : 0;

  return {
    lossLiters: Math.round(lossLiters * 100) / 100,
    lossPct: Math.round(lossPct * 1000) / 1000,
    isClaimableLoss,
    claimableLiters: Math.round(claimableLiters * 100) / 100,
  };
}
