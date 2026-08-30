import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { FUEL_LABELS, type FuelKey } from "@/lib/fuel";
import { fmtL, fmtRate, fmtRs } from "@/lib/money";
import { toVolumeDecimal } from "@/lib/precision";
import { ServiceError } from "./sale-service";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// ==========================================
// 1. Zod Schemas
// ==========================================

export const UpdateFuelRateSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  tankId: z.string().min(1, "Choose a fuel tank"),
  newRate: z
    .string()
    .min(1, "Enter a new fuel rate")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Rate must be greater than zero",
    }),
});

export const RecordPurchaseSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  recordedById: z.string().min(1, "Operator ID is required"),
  tankId: z.string().min(1, "Tank ID is required"),
  liters: z
    .string()
    .min(1, "Enter delivery volume")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Delivery volume must be greater than zero",
    }),
  totalCost: z
    .string()
    .min(1, "Enter total invoice cost")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Total invoice cost must be positive",
    }),
  supplier: z.string().trim().min(2, "Supplier name is required"),
  invoiceNo: z.string().trim().optional().nullable(),
});

// ==========================================
// 2. Standalone StockService
// ==========================================

export class StockService {
  static async updateFuelRate(rawInput: unknown) {
    const input = UpdateFuelRateSchema.parse(rawInput);
    const newRate = D(input.newRate);

    return await prisma.$transaction(async (tx) => {
      const tank = await tx.tank.findFirst({
        where: { id: input.tankId, stationId: input.stationId },
      });
      if (!tank) throw new ServiceError("Tank not found.");

      const oldRate = tank.ratePerL;

      // Update rate
      await tx.tank.update({
        where: { id: tank.id },
        data: { ratePerL: newRate },
      });

      // Record rate history
      await tx.fuelRateHistory.create({
        data: {
          tankId: tank.id,
          oldRate,
          newRate,
          changedById: input.actorId,
        },
      });

      // Record audit log
      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "FUEL_RATE_UPDATED",
          entityType: "Tank",
          entityId: tank.id,
          metadata: {
            fuel: tank.fuel,
            oldRate: oldRate.toString(),
            newRate: newRate.toString(),
          },
        },
      });

      return {
        tankId: tank.id,
        fuel: tank.fuel,
        oldRate: fmtRate(oldRate),
        newRate: fmtRate(newRate),
      };
    });
  }

  static async recordPurchase(rawInput: unknown) {
    const input = RecordPurchaseSchema.parse(rawInput);
    const liters = toVolumeDecimal(input.liters);
    const totalCost = D(input.totalCost);

    return await prisma.$transaction(async (tx) => {
      const tank = await tx.tank.findFirst({
        where: { id: input.tankId, stationId: input.stationId },
      });
      if (!tank) throw new ServiceError("Tank not found.");

      const newLevel = tank.levelL.add(liters);
      if (newLevel.gt(tank.capacityL)) {
        throw new ServiceError(
          `Delivery (${fmtL(liters)}) exceeds tank capacity (${fmtL(tank.capacityL)}). Current level: ${fmtL(tank.levelL)}.`
        );
      }

      // Add stock to tank
      await tx.tank.update({
        where: { id: tank.id },
        data: { levelL: newLevel },
      });

      // Insert purchase entry
      const purchase = await tx.purchase.create({
        data: {
          stationId: input.stationId,
          tankId: tank.id,
          fuel: tank.fuel,
          liters,
          totalCost,
          supplier: input.supplier,
          invoiceNo: input.invoiceNo || null,
          recordedById: input.recordedById,
        },
      });

      // Insert audit log
      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.recordedById,
          action: "PURCHASE_RECORDED",
          entityType: "Purchase",
          entityId: purchase.id,
          metadata: {
            fuel: tank.fuel,
            liters: liters.toString(),
            totalCost: totalCost.toString(),
            supplier: input.supplier,
            tankLevelAfter: newLevel.toString(),
          },
        },
      });

      return {
        purchaseId: purchase.id,
        fuel: tank.fuel,
        litersAdded: fmtL(liters),
        newTankLevel: fmtL(newLevel),
      };
    });
  }
}
