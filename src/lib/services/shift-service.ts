import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fmtRs, fmtL } from "@/lib/money";
import { toVolumeDecimal, toCurrencyDecimal } from "@/lib/precision";
import { ServiceError } from "./sale-service";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// ==========================================
// 1. Shift Lifecycle States & Zod Schemas
// ==========================================

export type ShiftStatus = "OPEN" | "CLOSING" | "RECONCILED" | "CLOSED";

export const StartShiftSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  userId: z.string().min(1, "Operator ID is required"),
});

export const InitiateCloseShiftSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  shiftId: z.string().min(1, "Shift ID is required"),
  cashHandedOver: z
    .string()
    .min(1, "Cash amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Cash handed over must be zero or positive",
    }),
  closingMeterReadingL: z
    .string()
    .optional()
    .nullable(),
});

export const ReconcileAndLockShiftSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  managerId: z.string().min(1, "Manager ID is required"),
  shiftId: z.string().min(1, "Shift ID is required"),
  notes: z.string().optional().nullable(),
  overrideVariance: z.boolean().default(false),
});

// ==========================================
// 2. Standalone ShiftService
// ==========================================

export class ShiftService {
  /**
   * Starts a shift with atomic state flipping to prevent race conditions.
   */
  static async startShift(rawInput: unknown) {
    const input = StartShiftSchema.parse(rawInput);

    return await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: input.userId, stationId: input.stationId },
      });
      if (!target) throw new ServiceError("Employee not found at this station.");
      if (!target.active) throw new ServiceError(`${target.name} is deactivated.`);

      const startedAt = new Date();

      // Guarded atomic compare-and-swap: only succeed if genuinely off shift
      const flipped = await tx.user.updateMany({
        where: { id: target.id, onShift: false },
        data: { onShift: true, shiftStartedAt: startedAt },
      });
      if (flipped.count === 0) {
        throw new ServiceError(`${target.name} is already on an active shift.`);
      }

      const shift = await tx.shift.create({
        data: {
          userId: target.id,
          startedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "SHIFT_STARTED",
          entityType: "Shift",
          entityId: shift.id,
          metadata: {
            operator: target.name,
            startedAt: startedAt.toISOString(),
          },
        },
      });

      return {
        shiftId: shift.id,
        operatorName: target.name,
        startedAt,
      };
    });
  }

  /**
   * Verifies if an operator has an active OPEN shift before permitting sale mutations.
   */
  static async assertOperatorShiftOpen(stationId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, stationId, active: true },
      select: { onShift: true, name: true },
    });

    if (!user) throw new ServiceError("Operator not found.");
    if (!user.onShift) {
      throw new ServiceError(
        `Shift Handover Lock: Operator ${user.name} is not on an active OPEN shift. Sales cannot be recorded on a closed shift.`
      );
    }
    return true;
  }

  /**
   * Closes a shift atomically and marks it closed.
   */
  static async closeShift(rawInput: unknown) {
    const input = InitiateCloseShiftSchema.parse(rawInput);

    return await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findFirst({
        where: { id: input.shiftId, endedAt: null },
        include: { user: true },
      });
      if (!shift) throw new ServiceError("Active shift record not found.");
      if (shift.user.stationId !== input.stationId) {
        throw new ServiceError("Shift does not belong to this station.");
      }

      const endedAt = new Date();

      // Guarded flip to take operator off shift
      await tx.user.updateMany({
        where: { id: shift.userId, onShift: true },
        data: { onShift: false, shiftStartedAt: null },
      });

      // Update shift endedAt
      const closedShift = await tx.shift.update({
        where: { id: shift.id },
        data: {
          endedAt,
          endedById: input.actorId,
        },
      });

      // Audit trail
      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "SHIFT_CLOSED",
          entityType: "Shift",
          entityId: closedShift.id,
          metadata: {
            operator: shift.user.name,
            cashHandedOver: input.cashHandedOver,
            endedAt: endedAt.toISOString(),
          },
        },
      });

      return {
        shiftId: closedShift.id,
        operatorName: shift.user.name,
        endedAt,
      };
    });
  }
}
