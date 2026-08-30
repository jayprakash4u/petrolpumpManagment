import "server-only";
import { z } from "zod";
import { Prisma, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deriveSale, checkLiters, type SaleMode } from "@/lib/sale-math";
import { creditHeadroom } from "@/lib/credit";
import { FUEL_LABELS, type FuelKey } from "@/lib/fuel";
import { fmtL, fmtRate, fmtRs } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { toVolumeDecimal, toCurrencyDecimal } from "@/lib/precision";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// ==========================================
// 1. Zod Schemas for Runtime Validation
// ==========================================

export const CreateSaleSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  soldById: z.string().min(1, "Operator ID is required"),
  soldByName: z.string().min(1, "Operator name is required"),
  tankId: z.string().min(1, "Choose a fuel tank"),
  mode: z.enum(["LITERS", "RUPEES"]),
  quantity: z
    .string()
    .min(1, "Enter a quantity")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be a positive number",
    }),
  expectedRate: z
    .string()
    .min(1, "Expected rate is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Expected rate must be a valid rate",
    }),
  paymentMethod: z.enum(["CASH", "CREDIT"]),
  onlineProvider: z.string().optional().nullable(),
  paymentRef: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  cashTendered: z.string().optional().nullable(),
  vehicleNo: z.string().optional().nullable(),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;

export const VoidSaleSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  saleId: z.string().min(1, "Sale ID is required"),
  reason: z.string().min(3, "Give a reason for the void — minimum 3 characters"),
});

export type VoidSaleInput = z.infer<typeof VoidSaleSchema>;

export interface ReceiptResult {
  receiptNo: number;
  stationName: string;
  fuel: FuelKey;
  liters: string;
  ratePerL: string;
  total: string;
  paymentMethod: PaymentMethod;
  onlineProvider: string | null;
  paymentRef: string | null;
  customerName: string | null;
  changeDue: string | null;
  soldBy: string;
  at: string;
}

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceError";
  }
}

// ==========================================
// 2. Standalone SaleService
// ==========================================

export class SaleService {
  /**
   * Records a sale inside an atomic ACID transaction with Zod validation.
   */
  static async createSale(rawInput: unknown): Promise<ReceiptResult> {
    const input = CreateSaleSchema.parse(rawInput);
    const quantity = D(input.quantity);
    const expectedRate = D(input.expectedRate);
    const tendered = input.cashTendered ? D(input.cashTendered) : null;

    return await prisma.$transaction(async (tx) => {
      // 1. Read and verify tank inside transaction
      const tank = await tx.tank.findFirst({
        where: { id: input.tankId, stationId: input.stationId },
      });
      if (!tank) {
        throw new ServiceError("That fuel isn't available at this station.");
      }

      if (!tank.ratePerL.equals(expectedRate)) {
        throw new ServiceError(
          `The ${FUEL_LABELS[tank.fuel]} rate changed to ${fmtRate(tank.ratePerL)} while you were entering this sale. Check the amount and record it again.`
        );
      }

      // 2. Derive volume & amount with fixed-point accuracy
      const { liters, totalAmount } = deriveSale(
        input.mode as SaleMode,
        quantity,
        tank.ratePerL
      );

      const problem = checkLiters(liters);
      if (problem === "TOO_SMALL") throw new ServiceError("That works out to less than 0.01 L — check the amount.");
      if (problem === "TOO_LARGE") throw new ServiceError("That volume looks wrong. Split it into separate sales.");
      if (problem === "NOT_A_NUMBER") throw new ServiceError("Enter a valid quantity.");

      // 3. Deduct stock atomically with guard predicate
      const deducted = await tx.tank.updateMany({
        where: { id: tank.id, levelL: { gte: liters } },
        data: { levelL: { decrement: liters } },
      });
      if (deducted.count === 0) {
        throw new ServiceError(
          `Not enough ${FUEL_LABELS[tank.fuel]} in the tank — ${fmtL(tank.levelL)} left. Record a delivery first.`
        );
      }

      // 4. Handle credit customer balance if applicable
      let customerName: string | null = null;
      if (input.paymentMethod === "CREDIT") {
        if (!input.customerId) {
          throw new ServiceError("Choose the credit customer this sale is billed to.");
        }

        const customer = await tx.customer.findFirst({
          where: { id: input.customerId, stationId: input.stationId, active: true },
        });
        if (!customer) throw new ServiceError("That credit customer no longer exists.");

        const headroom = creditHeadroom(customer.creditLimit, customer.dueAmount);
        if (totalAmount.gt(headroom)) {
          throw new ServiceError(
            `${customer.name} has only ${fmtRs(headroom)} of credit left (limit ${fmtRs(customer.creditLimit)}, owes ${fmtRs(customer.dueAmount)}). Take cash or record a payment first.`
          );
        }

        // Compare-and-swap balance update
        const charged = await tx.customer.updateMany({
          where: { id: customer.id, dueAmount: customer.dueAmount },
          data: { dueAmount: customer.dueAmount.add(totalAmount) },
        });
        if (charged.count === 0) {
          throw new ServiceError(`${customer.name}'s balance changed while you were entering this. Try again.`);
        }
        customerName = customer.name;
      }

      // 5. Mint gap-free sequential receipt number
      const station = await tx.station.update({
        where: { id: input.stationId },
        data: { nextReceiptNo: { increment: 1 } },
        select: { nextReceiptNo: true, name: true },
      });
      const receiptNo = station.nextReceiptNo - 1;

      // 6. Insert Sale Row
      const sale = await tx.sale.create({
        data: {
          receiptNo,
          stationId: input.stationId,
          tankId: tank.id,
          fuel: tank.fuel,
          liters,
          ratePerL: tank.ratePerL,
          totalAmount,
          paymentMethod: input.paymentMethod,
          customerId: input.paymentMethod === "CREDIT" ? input.customerId : null,
          soldById: input.soldById,
          vehicleNo: input.vehicleNo ? input.vehicleNo.trim().toUpperCase() : null,
        },
      });

      // 7. Write Immutable Audit Log
      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.soldById,
          action: "SALE_RECORDED",
          entityType: "Sale",
          entityId: sale.id,
          metadata: {
            receiptNo,
            fuel: tank.fuel,
            liters: liters.toString(),
            ratePerL: tank.ratePerL.toString(),
            totalAmount: totalAmount.toString(),
            paymentMethod: input.paymentMethod,
            onlineProvider: input.onlineProvider ?? null,
            paymentRef: input.paymentRef ?? null,
            customerId: input.customerId ?? null,
            vehicleNo: input.vehicleNo ?? null,
            tankLevelAfter: tank.levelL.sub(liters).toString(),
          },
        },
      });

      return {
        receiptNo,
        stationName: station.name,
        fuel: tank.fuel as FuelKey,
        liters: fmtL(liters),
        ratePerL: fmtRate(tank.ratePerL),
        total: fmtRs(totalAmount),
        paymentMethod: input.paymentMethod,
        onlineProvider: input.onlineProvider ?? null,
        paymentRef: input.paymentRef ?? null,
        customerName,
        changeDue: tendered && tendered.gte(totalAmount) ? fmtRs(tendered.sub(totalAmount)) : null,
        soldBy: input.soldByName,
        at: fmtBSDateTime(sale.createdAt),
      };
    });
  }

  /**
   * Voids a sale inside an atomic ACID transaction with Zod validation.
   */
  static async voidSale(rawInput: unknown): Promise<{ receiptNo: number; litersRefunded: string }> {
    const input = VoidSaleSchema.parse(rawInput);

    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: input.saleId, stationId: input.stationId },
      });
      if (!sale) throw new ServiceError("Sale not found.");
      if (sale.voided) throw new ServiceError("This sale is already voided.");

      // 1. Mark Sale voided
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          voided: true,
          voidedAt: new Date(),
          voidReason: input.reason,
        },
      });

      // 2. Return fuel stock to tank
      await tx.tank.update({
        where: { id: sale.tankId },
        data: { levelL: { increment: sale.liters } },
      });

      // 3. Reverse customer credit balance if applicable
      if (sale.paymentMethod === "CREDIT" && sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { dueAmount: { decrement: sale.totalAmount } },
        });
      }

      // 4. Record Immutable Audit Log
      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "SALE_VOIDED",
          entityType: "Sale",
          entityId: sale.id,
          metadata: {
            receiptNo: sale.receiptNo,
            reason: input.reason,
            litersReturned: sale.liters.toString(),
            amountReversed: sale.totalAmount.toString(),
          },
        },
      });

      return {
        receiptNo: sale.receiptNo,
        litersRefunded: fmtL(sale.liters),
      };
    });
  }
}
