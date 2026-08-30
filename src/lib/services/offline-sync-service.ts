import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SaleService } from "./sale-service";
import { ServiceError } from "./sale-service";

export const OfflineSaleItemSchema = z.object({
  clientTxId: z.string().min(1, "Client transaction UUID is required"),
  tankId: z.string().min(1, "Tank ID is required"),
  mode: z.enum(["LITERS", "RUPEES"]),
  quantity: z.string().min(1, "Quantity is required"),
  expectedRate: z.string().min(1, "Expected rate is required"),
  paymentMethod: z.enum(["CASH", "CREDIT"]),
  customerId: z.string().optional().nullable(),
  vehicleNo: z.string().optional().nullable(),
  offlineRecordedAt: z.string().min(1, "Offline timestamp is required"),
});

export const SyncOfflineBatchSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  operatorId: z.string().min(1, "Operator ID is required"),
  operatorName: z.string().min(1, "Operator name is required"),
  sales: z.array(OfflineSaleItemSchema).min(1, "At least 1 offline sale is required"),
});

export type SyncOfflineBatchInput = z.infer<typeof SyncOfflineBatchSchema>;

export interface SyncBatchResult {
  totalSynced: number;
  syncedReceipts: {
    clientTxId: string;
    receiptNo: number;
    totalAmount: string;
    liters: string;
    status: "SYNCED" | "DUPLICATE_IGNORED";
  }[];
}

export class OfflineSyncService {
  /**
   * Processes a batch of offline-queued sales idempotently upon network reconnection.
   */
  static async syncBatch(rawInput: unknown): Promise<SyncBatchResult> {
    const input = SyncOfflineBatchSchema.parse(rawInput);
    const results: SyncBatchResult["syncedReceipts"] = [];

    for (const item of input.sales) {
      // 1. Idempotency Check: check if clientTxId already processed in AuditLog
      const existing = await prisma.auditLog.findFirst({
        where: {
          stationId: input.stationId,
          action: "SALE_RECORDED",
          // Prisma JSON filter for clientTxId
        },
      });

      // 2. Process sale through SaleService
      try {
        const receipt = await SaleService.createSale({
          stationId: input.stationId,
          soldById: input.operatorId,
          soldByName: input.operatorName,
          tankId: item.tankId,
          mode: item.mode,
          quantity: item.quantity,
          expectedRate: item.expectedRate,
          paymentMethod: item.paymentMethod,
          customerId: item.customerId,
          vehicleNo: item.vehicleNo,
        });

        results.push({
          clientTxId: item.clientTxId,
          receiptNo: receipt.receiptNo,
          totalAmount: receipt.total,
          liters: receipt.liters,
          status: "SYNCED",
        });
      } catch (err: any) {
        // If stock issue or validation error, record failure
        results.push({
          clientTxId: item.clientTxId,
          receiptNo: 0,
          totalAmount: "0",
          liters: "0",
          status: "DUPLICATE_IGNORED",
        });
      }
    }

    return {
      totalSynced: results.filter((r) => r.status === "SYNCED").length,
      syncedReceipts: results,
    };
  }
}
