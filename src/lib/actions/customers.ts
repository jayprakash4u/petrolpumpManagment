"use server";

import * as z from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { can, type Role } from "@/lib/permissions";
import { checkPayment, checkCreditLimit, balanceAfter } from "@/lib/credit";
import { fmtRs } from "@/lib/money";

const D = Prisma.Decimal;

class CustomerError extends Error {}

function decimalOrNull(raw: FormDataEntryValue | null): Prisma.Decimal | null {
  if (raw === null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  try {
    const d = new D(s);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

export interface CustomerFormState {
  error?: string;
  message?: string;
}

/* ------------------------------------------------------------------ *
 * Create
 * ------------------------------------------------------------------ */

const CreateCustomerSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer's name").max(120),
  phone: z.string().trim().max(30).optional(),
  creditLimit: z.string().trim().min(1, "Enter a credit limit"),
});

export async function createCustomerAction(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageCustomers")) {
    return { error: "Your role can't add credit customers." };
  }

  const parsed = CreateCustomerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? undefined,
    creditLimit: formData.get("creditLimit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const creditLimit = decimalOrNull(parsed.data.creditLimit);
  if (!creditLimit || creditLimit.isNegative()) {
    return { error: "Enter a credit limit of zero or more." };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Names aren't unique in the schema (two "Ram Transport"s can legitimately
      // exist), but a same-name account at the same station is far more likely
      // to be a duplicate than a coincidence, so it's worth refusing.
      const existing = await tx.customer.findFirst({
        where: { stationId: actor.stationId, name: parsed.data.name, active: true },
      });
      if (existing) throw new CustomerError(`${parsed.data.name} already has an account at this station.`);

      const customer = await tx.customer.create({
        data: {
          stationId: actor.stationId,
          name: parsed.data.name,
          phone: parsed.data.phone || null,
          creditLimit,
          dueAmount: new D(0),
          active: true,
        },
      });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "CUSTOMER_CREATED",
          entityType: "Customer",
          entityId: customer.id,
          metadata: JSON.stringify({ name: customer.name, creditLimit: creditLimit.toString(), phone: customer.phone }),
        },
      });

      return customer;
    });

    revalidatePath("/credit");
    revalidatePath("/sales");
    return { message: `${created.name} added with a ${fmtRs(creditLimit)} credit line.` };
  } catch (err) {
    if (err instanceof CustomerError) return { error: err.message };
    console.error("createCustomerAction failed", err);
    return { error: "Could not add the customer. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Payment
 * ------------------------------------------------------------------ */

const PaymentSchema = z.object({
  customerId: z.string().min(1, "Choose a customer"),
  amount: z.string().trim().min(1, "Enter the amount received"),
  /** The balance shown to the operator, so a stale form can't pay against a figure that has moved. */
  expectedDue: z.string().min(1),
});

/**
 * Records money received against a credit account.
 *
 * Overpayment is refused rather than trimmed — see the reasoning on
 * `checkPayment`. The `CustomerPayment` row and the `Customer.dueAmount`
 * decrement happen in one transaction, so the ledger and the balance can
 * never disagree.
 */
export async function recordPaymentAction(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "recordCustomerPayment")) {
    return { error: "Your role can't record customer payments." };
  }

  const parsed = PaymentSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    expectedDue: formData.get("expectedDue"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const amount = decimalOrNull(parsed.data.amount);
  if (!amount || amount.lte(0)) return { error: "Enter an amount greater than zero." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: parsed.data.customerId, stationId: actor.stationId },
      });
      if (!customer) throw new CustomerError("That customer isn't at this station.");

      if (!customer.dueAmount.equals(new D(parsed.data.expectedDue))) {
        throw new CustomerError(
          `${customer.name}'s balance changed to ${fmtRs(customer.dueAmount)} while this was open — check it and enter the payment again.`
        );
      }

      const problem = checkPayment(amount, customer.dueAmount);
      if (problem === "NOTHING_OWED") throw new CustomerError(`${customer.name} doesn't owe anything.`);
      if (problem === "EXCEEDS_DUE") {
        throw new CustomerError(
          `That's more than ${customer.name} owes. The outstanding balance is ${fmtRs(customer.dueAmount)} — take that, or record the rest as a separate cash sale.`
        );
      }
      if (problem === "TOO_SMALL") throw new CustomerError("Enter an amount greater than zero.");
      if (problem === "TOO_LARGE") throw new CustomerError("That amount looks wrong — check for extra zeroes.");
      if (problem === "NOT_A_NUMBER") throw new CustomerError("Enter a valid amount.");

      const newDue = balanceAfter(customer.dueAmount, amount);

      // Compare-and-swap on the balance we read, so a credit sale landing in
      // the gap can't be wiped out by a payment computed against a stale figure.
      const settled = await tx.customer.updateMany({
        where: { id: customer.id, dueAmount: customer.dueAmount },
        data: { dueAmount: newDue },
      });
      if (settled.count === 0) {
        throw new CustomerError(`${customer.name}'s balance changed while saving. Try again.`);
      }

      const payment = await tx.customerPayment.create({
        data: { customerId: customer.id, amount, recordedById: actor.id },
      });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "CUSTOMER_PAYMENT_RECORDED",
          entityType: "CustomerPayment",
          entityId: payment.id,
          metadata: JSON.stringify({
            customerId: customer.id,
            customerName: customer.name,
            amount: amount.toString(),
            dueBefore: customer.dueAmount.toString(),
            dueAfter: newDue.toString(),
          }),
        },
      });

      return { name: customer.name, amount, newDue };
    });

    revalidatePath("/credit");
    revalidatePath("/sales");
    revalidatePath("/dashboard");
    return {
      message: result.newDue.isZero()
        ? `${fmtRs(result.amount)} received — ${result.name}'s account is now settled.`
        : `${fmtRs(result.amount)} received from ${result.name}. ${fmtRs(result.newDue)} still outstanding.`,
    };
  } catch (err) {
    if (err instanceof CustomerError) return { error: err.message };
    console.error("recordPaymentAction failed", err);
    return { error: "Could not record the payment. Nothing was changed — please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Credit limit
 * ------------------------------------------------------------------ */

const LimitSchema = z.object({
  customerId: z.string().min(1),
  creditLimit: z.string().trim().min(1, "Enter a credit limit"),
});

export async function updateCreditLimitAction(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const actor = await requireUser();
  // Raising a credit line is a commercial decision, not a till operation —
  // deliberately narrower than manageCustomers.
  if (!can(actor.role as Role, "viewReports")) {
    return { error: "Only an owner or manager can change a credit limit." };
  }

  const parsed = LimitSchema.safeParse({
    customerId: formData.get("customerId"),
    creditLimit: formData.get("creditLimit"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const newLimit = decimalOrNull(parsed.data.creditLimit);
  if (!newLimit) return { error: "Enter a valid credit limit." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: parsed.data.customerId, stationId: actor.stationId },
      });
      if (!customer) throw new CustomerError("That customer isn't at this station.");

      const problem = checkCreditLimit(newLimit, customer.creditLimit);
      if (problem === "UNCHANGED") throw new CustomerError("That's already the current limit.");
      if (problem === "NEGATIVE") throw new CustomerError("A credit limit can't be negative.");
      if (problem === "TOO_LARGE") throw new CustomerError("That limit looks wrong — check for extra zeroes.");
      if (problem === "NOT_A_NUMBER") throw new CustomerError("Enter a valid credit limit.");

      await tx.customer.update({ where: { id: customer.id }, data: { creditLimit: newLimit } });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: "CREDIT_LIMIT_CHANGED",
          entityType: "Customer",
          entityId: customer.id,
          metadata: JSON.stringify({
            name: customer.name,
            oldLimit: customer.creditLimit.toString(),
            newLimit: newLimit.toString(),
            dueAtChange: customer.dueAmount.toString(),
          }),
        },
      });

      // Cutting a limit below an existing balance is allowed — the debt stands,
      // they simply can't borrow more — but the operator should be told.
      return { name: customer.name, belowBalance: newLimit.lt(customer.dueAmount) };
    });

    revalidatePath("/credit");
    revalidatePath("/sales");
    return {
      message: result.belowBalance
        ? `${result.name}'s limit set to ${fmtRs(newLimit)} — below their current balance, so no further credit sales until they pay down.`
        : `${result.name}'s credit limit updated to ${fmtRs(newLimit)}.`,
    };
  } catch (err) {
    if (err instanceof CustomerError) return { error: err.message };
    console.error("updateCreditLimitAction failed", err);
    return { error: "Could not update the credit limit. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Deactivate / reactivate
 * ------------------------------------------------------------------ */

export async function setCustomerActiveAction(
  _prev: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const actor = await requireUser();
  if (!can(actor.role as Role, "manageCustomers")) {
    return { error: "Your role can't close credit accounts." };
  }

  const customerId = String(formData.get("customerId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!customerId) return { error: "Missing customer." };

  try {
    const name = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({ where: { id: customerId, stationId: actor.stationId } });
      if (!customer) throw new CustomerError("That customer isn't at this station.");
      if (customer.active === active) {
        throw new CustomerError(`${customer.name}'s account is already ${active ? "open" : "closed"}.`);
      }

      // Closing an account with money outstanding would hide the debt from
      // the credit page while leaving it on the books. Settle first.
      if (!active && customer.dueAmount.gt(0)) {
        throw new CustomerError(
          `${customer.name} still owes ${fmtRs(customer.dueAmount)}. Record the payment before closing the account.`
        );
      }

      await tx.customer.update({ where: { id: customer.id }, data: { active } });

      await tx.auditLog.create({
        data: {
          stationId: actor.stationId,
          actorId: actor.id,
          action: active ? "CUSTOMER_REOPENED" : "CUSTOMER_CLOSED",
          entityType: "Customer",
          entityId: customer.id,
          metadata: JSON.stringify({ name: customer.name }),
        },
      });

      return customer.name;
    });

    revalidatePath("/credit");
    revalidatePath("/sales");
    return { message: active ? `${name}'s account reopened.` : `${name}'s account closed.` };
  } catch (err) {
    if (err instanceof CustomerError) return { error: err.message };
    console.error("setCustomerActiveAction failed", err);
    return { error: "Could not update the account. Please try again." };
  }
}
