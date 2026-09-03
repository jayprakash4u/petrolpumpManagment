/**
 * Integration tests for the credit-account actions — the real Server Actions,
 * the real Prisma client, a real (throwaway) SQLite database. Same approach
 * as the other suites: only `requireUser()` and `revalidatePath()` are
 * stubbed.
 *
 * The payment path gets the most attention, because it's the one place where
 * the ledger (`CustomerPayment` rows) and the balance (`Customer.dueAmount`)
 * could drift apart and quietly misstate what a customer owes.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { User } from "@prisma/client";

/**
 * There's one real `Role` value now ("OWNER" — every login has full
 * access, see @/lib/permissions). These labels aren't roles in that
 * sense; they're just names for distinct test actors, each created with
 * the real `role: "OWNER"`.
 */
type ActorLabel = "OWNER" | "MANAGER" | "CASHIER" | "ATTENDANT";

const testDir = mkdtempSync(path.join(tmpdir(), "fsm-credit-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;

let currentUser: User;

vi.mock("@/lib/dal", () => ({
  requireUser: async () => currentUser,
  getCurrentUser: async () => currentUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const { prisma } = await import("@/lib/db");
const { createCustomerAction, recordPaymentAction, updateCreditLimitAction, setCustomerActiveAction } =
  await import("@/lib/actions/customers");
const { Prisma } = await import("@prisma/client");
const D = (v: string | number) => new Prisma.Decimal(v);

let stationId: string;
let customerId: string;
let tankId: string;
const users: Record<ActorLabel, User> = {} as Record<ActorLabel, User>;

beforeAll(() => {
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
    env: { ...process.env, DATABASE_URL: "file:" + testDbPath },
    stdio: "pipe",
    shell: process.platform === "win32",
  });
}, 120_000);

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.fuelRateHistory.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();

  const station = await prisma.station.create({ data: { slug: "test-station", name: "Test Station", address: "Test Rd" } });
  stationId = station.id;

  for (const label of ["OWNER", "MANAGER", "CASHIER", "ATTENDANT"] as ActorLabel[]) {
    users[label] = await prisma.user.create({
      data: { stationId, name: label + " Person", username: label.toLowerCase() + ".user", passwordHash: "x", role: "OWNER" },
    });
  }
  currentUser = users.CASHIER;

  const tank = await prisma.tank.create({
    data: { stationId, fuel: "PETROL", capacityL: D(10000), levelL: D(9000), openingL: D(9000), ratePerL: D("100") },
  });
  tankId = tank.id;

  // Owes 5 000 against a 20 000 line.
  const customer = await prisma.customer.create({
    data: { stationId, name: "Acme Transport", phone: "98410 00000", creditLimit: D(20000), dueAmount: D(5000) },
  });
  customerId = customer.id;
});

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const pay = (over: Record<string, string> = {}) =>
  form({ customerId, amount: "2000", expectedDue: "5000", ...over });

/* ------------------------------------------------------------------ */

describe("recordPaymentAction — the happy path", () => {
  it("reduces the balance and writes a ledger row", async () => {
    const result = await recordPaymentAction({}, pay());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/Rs 2,000 received from Acme Transport\. Rs 3,000 still outstanding/);

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("3000");

    const payment = await prisma.customerPayment.findFirstOrThrow();
    expect(payment.amount.toString()).toBe("2000");
    expect(payment.recordedById).toBe(users.CASHIER.id);
  });

  it("settles an account exactly and says so", async () => {
    const result = await recordPaymentAction({}, pay({ amount: "5000" }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/account is now settled/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("0");
  });

  it("keeps paisa exact across several part-payments", async () => {
    await prisma.customer.update({ where: { id: customerId }, data: { dueAmount: D("5000.55") } });

    await recordPaymentAction({}, pay({ amount: "1000.05", expectedDue: "5000.55" }));
    await recordPaymentAction({}, pay({ amount: "2000.25", expectedDue: "4000.5" }));

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("2000.25");

    // The ledger must reconcile to the balance exactly.
    const payments = await prisma.customerPayment.findMany({ where: { customerId } });
    const paid = payments.reduce((sum, p) => sum.add(p.amount), D(0));
    expect(paid.toString()).toBe("3000.3");
    expect(customer.dueAmount.add(paid).toString()).toBe("5000.55");
  });

  it("accepts a single paisa", async () => {
    const result = await recordPaymentAction({}, pay({ amount: "0.01" }));
    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("4999.99");
  });

  it("records the payment in the audit trail with the before and after balances", async () => {
    await recordPaymentAction({}, pay());
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "CUSTOMER_PAYMENT_RECORDED" } });
    expect(log.metadata).toMatchObject({ amount: "2000", dueBefore: "5000", dueAfter: "3000" });
  });

  it("is allowed for owner, manager and cashier", async () => {
    for (const role of ["OWNER", "MANAGER", "CASHIER"] as const) {
      await prisma.customer.update({ where: { id: customerId }, data: { dueAmount: D(5000) } });
      currentUser = users[role];
      const result = await recordPaymentAction({}, pay({ amount: "100" }));
      expect(result.error, role).toBeUndefined();
    }
  });
});

describe("recordPaymentAction — overpayment is refused, not trimmed", () => {
  it("refuses more than the outstanding balance and changes nothing", async () => {
    const result = await recordPaymentAction({}, pay({ amount: "8000" }));

    expect(result.error).toMatch(/more than Acme Transport owes/);
    expect(result.error).toMatch(/Rs 5,000/);

    // The critical assertion: no partial credit was silently applied.
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("5000");
    expect(await prisma.customerPayment.count()).toBe(0);
  });

  it("refuses a single paisa over", async () => {
    const result = await recordPaymentAction({}, pay({ amount: "5000.01" }));
    expect(result.error).toMatch(/more than/);
    expect(await prisma.customerPayment.count()).toBe(0);
  });

  it("refuses a payment against an account that owes nothing", async () => {
    await prisma.customer.update({ where: { id: customerId }, data: { dueAmount: D(0) } });
    const result = await recordPaymentAction({}, pay({ amount: "100", expectedDue: "0" }));

    expect(result.error).toMatch(/doesn't owe anything/);
    expect(await prisma.customerPayment.count()).toBe(0);
  });

  it("refuses zero and negative amounts", async () => {
    for (const bad of ["0", "-2000"]) {
      const result = await recordPaymentAction({}, pay({ amount: bad }));
      expect(result.error, bad).toMatch(/greater than zero/);
    }
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("5000");
  });

  it("refuses a non-numeric amount", async () => {
    const result = await recordPaymentAction({}, pay({ amount: "two thousand" }));
    expect(result.error).toBeTruthy();
    expect(await prisma.customerPayment.count()).toBe(0);
  });
});

describe("recordPaymentAction — stale balances and isolation", () => {
  it("refuses a payment computed against a balance that has since moved", async () => {
    // A credit sale lands after the form was rendered.
    await prisma.customer.update({ where: { id: customerId }, data: { dueAmount: D(7000) } });

    const result = await recordPaymentAction({}, pay({ amount: "5000", expectedDue: "5000" }));

    expect(result.error).toMatch(/balance changed to Rs 7,000/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("7000");
    expect(await prisma.customerPayment.count()).toBe(0);
  });

  it("will not take payment for a customer at another station", async () => {
    const other = await prisma.station.create({ data: { slug: "other-station", name: "Other", address: "Elsewhere" } });
    const foreign = await prisma.customer.create({
      data: { stationId: other.id, name: "Foreign Co", creditLimit: D(9999), dueAmount: D(5000) },
    });

    const result = await recordPaymentAction({}, pay({ customerId: foreign.id }));
    expect(result.error).toMatch(/isn't at this station/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: foreign.id } })).dueAmount.toString()).toBe("5000");
  });

  it("is refused for an attendant", async () => {
    currentUser = users.ATTENDANT;
    const result = await recordPaymentAction({}, pay());
    expect(result.error).toMatch(/can't record customer payments/);
    expect(await prisma.customerPayment.count()).toBe(0);
  });
});

describe("payments and credit sales together", () => {
  it("frees up headroom so a blocked credit sale can go through", async () => {
    const { recordSaleAction } = await import("@/lib/actions/sales");

    // Push the account to its limit.
    await prisma.customer.update({ where: { id: customerId }, data: { dueAmount: D(20000) } });
    currentUser = users.CASHIER;

    const blocked = await recordSaleAction(
      {},
      form({ tankId, mode: "LITERS", quantity: "10", paymentMethod: "CREDIT", customerId, expectedRate: "100" })
    );
    expect(blocked.error).toMatch(/of credit left/);

    // Take a payment, then the same sale should succeed.
    await recordPaymentAction({}, pay({ amount: "5000", expectedDue: "20000" }));

    const allowed = await recordSaleAction(
      {},
      form({ tankId, mode: "LITERS", quantity: "10", paymentMethod: "CREDIT", customerId, expectedRate: "100" })
    );
    expect(allowed.error).toBeUndefined();

    // 20 000 − 5 000 payment + 1 000 sale
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).dueAmount.toString()).toBe("16000");
  });
});

/* ------------------------------------------------------------------ */

describe("createCustomerAction", () => {
  const newCustomer = (over: Record<string, string> = {}) =>
    form({ name: "Everest Logistics", phone: "98510 88214", creditLimit: "30000", ...over });

  it("opens an account with a zero balance", async () => {
    const result = await createCustomerAction({}, newCustomer());

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/Everest Logistics added with a Rs 30,000 credit line/);

    const created = await prisma.customer.findFirstOrThrow({ where: { name: "Everest Logistics" } });
    expect(created.dueAmount.toString()).toBe("0");
    expect(created.stationId).toBe(stationId);
    expect(created.active).toBe(true);
  });

  it("allows a zero limit — an account that exists but can't be billed yet", async () => {
    const result = await createCustomerAction({}, newCustomer({ creditLimit: "0" }));
    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findFirstOrThrow({ where: { name: "Everest Logistics" } })).creditLimit.toString()).toBe("0");
  });

  it("stores a missing phone as null rather than an empty string", async () => {
    await createCustomerAction({}, newCustomer({ phone: "" }));
    expect((await prisma.customer.findFirstOrThrow({ where: { name: "Everest Logistics" } })).phone).toBeNull();
  });

  it("refuses a duplicate active account with the same name", async () => {
    const dupe = await createCustomerAction({}, newCustomer({ name: "Acme Transport" }));
    expect(dupe.error).toMatch(/already has an account/);
    expect(await prisma.customer.count({ where: { name: "Acme Transport" } })).toBe(1);
  });

  it("rejects a negative credit limit", async () => {
    const result = await createCustomerAction({}, newCustomer({ creditLimit: "-5000" }));
    expect(result.error).toMatch(/zero or more/);
    expect(await prisma.customer.count({ where: { name: "Everest Logistics" } })).toBe(0);
  });

  it("is refused for an attendant", async () => {
    currentUser = users.ATTENDANT;
    const result = await createCustomerAction({}, newCustomer());
    expect(result.error).toMatch(/can't add credit customers/);
    expect(await prisma.customer.count({ where: { name: "Everest Logistics" } })).toBe(0);
  });
});

describe("updateCreditLimitAction", () => {
  it("raises a limit", async () => {
    currentUser = users.MANAGER;
    const result = await updateCreditLimitAction({}, form({ customerId, creditLimit: "40000" }));

    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).creditLimit.toString()).toBe("40000");
  });

  it("allows cutting a limit below the current balance, and warns", async () => {
    currentUser = users.MANAGER;
    const result = await updateCreditLimitAction({}, form({ customerId, creditLimit: "1000" }));

    expect(result.error).toBeUndefined();
    expect(result.message).toMatch(/below their current balance/);

    // The debt stands — only future borrowing is blocked.
    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    expect(customer.dueAmount.toString()).toBe("5000");
    expect(customer.creditLimit.toString()).toBe("1000");
  });

  it("records the change with the balance at the time", async () => {
    currentUser = users.OWNER;
    await updateCreditLimitAction({}, form({ customerId, creditLimit: "35000" }));
    const log = await prisma.auditLog.findFirstOrThrow({ where: { action: "CREDIT_LIMIT_CHANGED" } });
    expect(log.metadata).toMatchObject({ oldLimit: "20000", newLimit: "35000", dueAtChange: "5000" });
  });

  it("rejects a negative limit and a no-op change", async () => {
    currentUser = users.MANAGER;
    expect((await updateCreditLimitAction({}, form({ customerId, creditLimit: "-1" }))).error).toMatch(/can't be negative/);
    expect((await updateCreditLimitAction({}, form({ customerId, creditLimit: "20000" }))).error).toMatch(/already the current limit/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).creditLimit.toString()).toBe("20000");
  });

  it("isn't restricted to an owner or manager — a cashier can raise a credit line too", async () => {
    currentUser = users.CASHIER;
    const result = await updateCreditLimitAction({}, form({ customerId, creditLimit: "999999" }));

    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).creditLimit.toString()).toBe("999999");
  });
});

describe("setCustomerActiveAction", () => {
  it("refuses to close an account with money outstanding", async () => {
    const result = await setCustomerActiveAction({}, form({ customerId, active: "false" }));

    expect(result.error).toMatch(/still owes Rs 5,000/);
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).active).toBe(true);
  });

  it("closes a settled account", async () => {
    await recordPaymentAction({}, pay({ amount: "5000" }));
    const result = await setCustomerActiveAction({}, form({ customerId, active: "false" }));

    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).active).toBe(false);
  });

  it("reopens a closed account", async () => {
    await recordPaymentAction({}, pay({ amount: "5000" }));
    await setCustomerActiveAction({}, form({ customerId, active: "false" }));
    const result = await setCustomerActiveAction({}, form({ customerId, active: "true" }));

    expect(result.error).toBeUndefined();
    expect((await prisma.customer.findUniqueOrThrow({ where: { id: customerId } })).active).toBe(true);
  });

  it("rejects a redundant change", async () => {
    const result = await setCustomerActiveAction({}, form({ customerId, active: "true" }));
    expect(result.error).toMatch(/already open/);
  });

  it("keeps a closed account out of the credit-sale picker", async () => {
    const { recordSaleAction } = await import("@/lib/actions/sales");

    await recordPaymentAction({}, pay({ amount: "5000" }));
    await setCustomerActiveAction({}, form({ customerId, active: "false" }));

    const result = await recordSaleAction(
      {},
      form({ tankId, mode: "LITERS", quantity: "10", paymentMethod: "CREDIT", customerId, expectedRate: "100" })
    );
    expect(result.error).toMatch(/no longer exists/);
  });

  it("is refused for an attendant", async () => {
    currentUser = users.ATTENDANT;
    const result = await setCustomerActiveAction({}, form({ customerId, active: "false" }));
    expect(result.error).toMatch(/can't close credit accounts/);
  });
});
