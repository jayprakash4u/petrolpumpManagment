import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fmtRs } from "@/lib/money";
import { ServiceError } from "./sale-service";

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

// ==========================================
// 1. Zod Schemas
// ==========================================

export const CreateCustomerSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
  phone: z.string().trim().optional().nullable(),
  creditLimit: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Credit limit must be a positive number or zero",
    })
    .default("0"),
});

export const RecordPaymentSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  recordedById: z.string().min(1, "Operator ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  amount: z
    .string()
    .min(1, "Enter payment amount")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Payment amount must be greater than zero",
    }),
});

export const UpdateCreditLimitSchema = z.object({
  stationId: z.string().min(1, "Station ID is required"),
  actorId: z.string().min(1, "Actor ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  newCreditLimit: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
      message: "Credit limit must be zero or positive",
    }),
});

// ==========================================
// 2. Standalone CustomerService
// ==========================================

export class CustomerService {
  static async createCustomer(rawInput: unknown) {
    const input = CreateCustomerSchema.parse(rawInput);
    const limit = D(input.creditLimit);

    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          stationId: input.stationId,
          name: input.name,
          phone: input.phone || null,
          creditLimit: limit,
          dueAmount: D(0),
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "CUSTOMER_CREATED",
          entityType: "Customer",
          entityId: customer.id,
          metadata: JSON.stringify({
            name: customer.name,
            creditLimit: limit.toString(),
          }),
        },
      });

      return customer;
    });
  }

  static async recordPayment(rawInput: unknown) {
    const input = RecordPaymentSchema.parse(rawInput);
    const amount = D(input.amount);

    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: input.customerId, stationId: input.stationId, active: true },
      });
      if (!customer) throw new ServiceError("Customer account not found.");

      if (amount.gt(customer.dueAmount)) {
        throw new ServiceError(
          `Payment (${fmtRs(amount)}) exceeds outstanding due balance (${fmtRs(customer.dueAmount)}).`
        );
      }

      // Deduct due balance
      const updated = await tx.customer.update({
        where: { id: customer.id },
        data: { dueAmount: { decrement: amount } },
      });

      // Record payment log
      const payment = await tx.customerPayment.create({
        data: {
          customerId: customer.id,
          amount,
          recordedById: input.recordedById,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.recordedById,
          action: "CUSTOMER_PAYMENT_RECORDED",
          entityType: "CustomerPayment",
          entityId: payment.id,
          metadata: JSON.stringify({
            customerId: customer.id,
            amount: amount.toString(),
            dueRemaining: updated.dueAmount.toString(),
          }),
        },
      });

      return {
        paymentId: payment.id,
        customerName: customer.name,
        amountPaid: fmtRs(amount),
        remainingDue: fmtRs(updated.dueAmount),
      };
    });
  }

  static async updateCreditLimit(rawInput: unknown) {
    const input = UpdateCreditLimitSchema.parse(rawInput);
    const newLimit = D(input.newCreditLimit);

    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: input.customerId, stationId: input.stationId },
      });
      if (!customer) throw new ServiceError("Customer account not found.");

      const updated = await tx.customer.update({
        where: { id: customer.id },
        data: { creditLimit: newLimit },
      });

      await tx.auditLog.create({
        data: {
          stationId: input.stationId,
          actorId: input.actorId,
          action: "CUSTOMER_CREDIT_LIMIT_UPDATED",
          entityType: "Customer",
          entityId: customer.id,
          metadata: JSON.stringify({
            previousLimit: customer.creditLimit.toString(),
            newLimit: newLimit.toString(),
          }),
        },
      });

      return updated;
    });
  }
}
