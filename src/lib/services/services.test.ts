import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient, Role, FuelType, Prisma } from "@prisma/client";
import { SaleService } from "./sale-service";
import { CustomerService } from "./customer-service";
import { StockService } from "./stock-service";
import { ShiftService } from "./shift-service";

const prisma = new PrismaClient();
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

describe("Decoupled Enterprise Service Layer Tests", () => {
  let testStation: any;
  let testUser: any;
  let testTank: any;

  beforeEach(async () => {
    // Clear test data in correct FK order
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

    testStation = await prisma.station.create({
      data: {
        slug: `test-station-${Date.now()}`,
        name: "Test Station Services",
        address: "Kathmandu, Nepal",
      },
    });

    testUser = await prisma.user.create({
      data: {
        stationId: testStation.id,
        name: "Test Operator",
        username: "testop",
        passwordHash: "hash",
        role: Role.OWNER,
        onShift: true,
      },
    });

    testTank = await prisma.tank.create({
      data: {
        stationId: testStation.id,
        fuel: FuelType.PETROL,
        capacityL: D(10000),
        levelL: D(5000),
        openingL: D(5000),
        ratePerL: D("172.00"),
      },
    });
  });

  it("validates and records a sale via SaleService.createSale()", async () => {
    const receipt = await SaleService.createSale({
      stationId: testStation.id,
      soldById: testUser.id,
      soldByName: testUser.name,
      tankId: testTank.id,
      mode: "LITERS",
      quantity: "10",
      expectedRate: "172.00",
      paymentMethod: "CASH",
    });

    expect(receipt.receiptNo).toBe(1);
    expect(receipt.liters).toBe("10 L");
    expect(receipt.total).toBe("Rs 1,720");

    const tankAfter = await prisma.tank.findUniqueOrThrow({ where: { id: testTank.id } });
    expect(tankAfter.levelL.toString()).toBe("4990");
  });

  it("rejects invalid input schemas with Zod validation errors", async () => {
    await expect(
      SaleService.createSale({
        stationId: testStation.id,
        soldById: testUser.id,
        soldByName: testUser.name,
        tankId: testTank.id,
        mode: "LITERS",
        quantity: "-5", // negative quantity
        expectedRate: "172.00",
        paymentMethod: "CASH",
      })
    ).rejects.toThrow();
  });

  it("creates customer and records payment via CustomerService", async () => {
    const customer = await CustomerService.createCustomer({
      stationId: testStation.id,
      actorId: testUser.id,
      name: "Everest Fleet Transport",
      creditLimit: "50000",
    });

    expect(customer.name).toBe("Everest Fleet Transport");

    // Artificially set due
    await prisma.customer.update({
      where: { id: customer.id },
      data: { dueAmount: D(12000) },
    });

    const paymentRes = await CustomerService.recordPayment({
      stationId: testStation.id,
      recordedById: testUser.id,
      customerId: customer.id,
      amount: "5000",
    });

    expect(paymentRes.amountPaid).toBe("Rs 5,000");
    expect(paymentRes.remainingDue).toBe("Rs 7,000");
  });

  it("updates fuel rates and records deliveries via StockService", async () => {
    const rateRes = await StockService.updateFuelRate({
      stationId: testStation.id,
      actorId: testUser.id,
      tankId: testTank.id,
      newRate: "175.50",
    });

    expect(rateRes.newRate).toBe("Rs 175.50");

    const purchaseRes = await StockService.recordPurchase({
      stationId: testStation.id,
      recordedById: testUser.id,
      tankId: testTank.id,
      liters: "2000",
      totalCost: "340000",
      supplier: "Nepal Oil Corporation (NOC)",
      invoiceNo: "NOC-INV-8812",
    });

    expect(purchaseRes.litersAdded).toBe("2,000 L");
    expect(purchaseRes.newTankLevel).toBe("7,000 L");
  });

  it("enforces shift lifecycle, atomic concurrency, and handover locking via ShiftService", async () => {
    // 1. Take user off shift
    await prisma.user.update({
      where: { id: testUser.id },
      data: { onShift: false },
    });

    // 2. Start shift
    const startRes = await ShiftService.startShift({
      stationId: testStation.id,
      actorId: testUser.id,
      userId: testUser.id,
    });
    expect(startRes.operatorName).toBe("Test Operator");

    // 3. Double-click starting active shift is blocked
    await expect(
      ShiftService.startShift({
        stationId: testStation.id,
        actorId: testUser.id,
        userId: testUser.id,
      })
    ).rejects.toThrow(/already on an active shift/);

    // 4. Assert shift open passes
    const isOpen = await ShiftService.assertOperatorShiftOpen(testStation.id, testUser.id);
    expect(isOpen).toBe(true);

    // 5. Close shift
    const closeRes = await ShiftService.closeShift({
      stationId: testStation.id,
      actorId: testUser.id,
      shiftId: startRes.shiftId,
      cashHandedOver: "45000",
    });
    expect(closeRes.operatorName).toBe("Test Operator");

    // 6. Once closed, assertOperatorShiftOpen rejects backdated operations
    await expect(
      ShiftService.assertOperatorShiftOpen(testStation.id, testUser.id)
    ).rejects.toThrow(/Shift Handover Lock/);
  });
});
