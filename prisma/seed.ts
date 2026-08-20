/**
 * Seeds a demo station so the app is meaningful the first time it runs:
 * one station, three tanks, four staff logins (one per role), a couple of
 * credit customers, and a morning's worth of sales so the Dashboard has
 * real numbers to chart instead of an empty state.
 *
 * Run with `npm run db:seed`. Safe to re-run: it wipes and recreates.
 */
import { PrismaClient, Prisma, Role, FuelType, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

async function main() {
  console.log("Clearing existing data...");
  // Order matters: children before parents (Restrict FKs would otherwise block this).
  await prisma.auditLog.deleteMany();
  await prisma.customerPayment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.fuelRateHistory.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.session.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();
  await prisma.platformAuditLog.deleteMany();
  await prisma.platformSession.deleteMany();
  await prisma.platformAdmin.deleteMany();

  const station = await prisma.station.create({
    data: {
      slug: "shree-petroleum",
      name: "Shree Petroleum",
      address: "Ring Road, Kathmandu, Nepal",
      nextReceiptNo: 1,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  // A platform operator, for the /admin console. Lives in its own table with
  // its own login — see the PlatformAdmin comment in schema.prisma.
  await prisma.platformAdmin.create({
    data: { username: "operator", email: "admin@fuelstation.platform", name: "Platform Operator", passwordHash },
  });
  const [owner, manager, cashier, attendant, attendant2] = await Promise.all(
    [
      { name: "Prakash Shrestha", username: "prakash", email: "owner@shreepetroleum.test", role: Role.OWNER },
      { name: "Anita K.C.", username: "anita", email: "manager@shreepetroleum.test", role: Role.MANAGER },
      { name: "Sita Gurung", username: "sita", email: "cashier@shreepetroleum.test", role: Role.CASHIER },
      { name: "Ramesh Thapa", username: "ramesh", email: null, role: Role.ATTENDANT },
      { name: "Bikash Rai", username: "bikash", email: null, role: Role.ATTENDANT },
    ].map((u) =>
      prisma.user.create({
        data: { ...u, stationId: station.id, passwordHash, active: true },
      })
    )
  );

  const [petrol, diesel, cng] = await Promise.all([
    prisma.tank.create({
      data: {
        stationId: station.id,
        fuel: FuelType.PETROL,
        capacityL: D(12000),
        levelL: D(8214),
        openingL: D(8214),
        ratePerL: D("106.48"),
      },
    }),
    prisma.tank.create({
      data: {
        stationId: station.id,
        fuel: FuelType.DIESEL,
        capacityL: D(12000),
        levelL: D(9460),
        openingL: D(9460),
        ratePerL: D("92.34"),
      },
    }),
    prisma.tank.create({
      data: {
        stationId: station.id,
        fuel: FuelType.CNG,
        capacityL: D(6000),
        levelL: D(1180),
        openingL: D(1180),
        ratePerL: D("78.10"),
      },
    }),
  ]);

  const [kathmanduCabs, everestLogistics] = await Promise.all([
    prisma.customer.create({
      data: { stationId: station.id, name: "Kathmandu Cabs Pvt. Ltd.", phone: "98410 22310", dueAmount: D(24500), creditLimit: D(50000) },
    }),
    prisma.customer.create({
      data: { stationId: station.id, name: "Everest Logistics", phone: "98510 88214", dueAmount: D(8200), creditLimit: D(30000) },
    }),
    prisma.customer.create({
      data: { stationId: station.id, name: "Dr. Prakash Shrestha", phone: "98023 41190", dueAmount: D(0), creditLimit: D(10000) },
    }),
  ]);

  await Promise.all([
    prisma.shift.create({ data: { userId: attendant.id, startedAt: hoursAgo(3) } }),
    prisma.shift.create({ data: { userId: cashier.id, startedAt: hoursAgo(3) } }),
    prisma.shift.create({ data: { userId: manager.id, startedAt: hoursAgo(6) } }),
  ]);
  await prisma.user.updateMany({
    where: { id: { in: [attendant.id, cashier.id, manager.id] } },
    data: { onShift: true, shiftStartedAt: hoursAgo(3) },
  });

  type SeedSale = {
    tank: typeof petrol;
    liters: string;
    payment: PaymentMethod;
    soldBy: string;
    customer?: string;
    hoursAgo: number;
  };
  const seedSales: SeedSale[] = [
    { tank: petrol, liters: "40", payment: PaymentMethod.CASH, soldBy: attendant.id, hoursAgo: 5.5 },
    { tank: diesel, liters: "120", payment: PaymentMethod.CREDIT, soldBy: cashier.id, customer: everestLogistics.id, hoursAgo: 4.3 },
    { tank: petrol, liters: "25", payment: PaymentMethod.CASH, soldBy: attendant.id, hoursAgo: 3.8 },
    { tank: cng, liters: "15", payment: PaymentMethod.CASH, soldBy: cashier.id, hoursAgo: 3 },
    { tank: diesel, liters: "60", payment: PaymentMethod.CASH, soldBy: attendant.id, hoursAgo: 2.2 },
    { tank: petrol, liters: "200", payment: PaymentMethod.CREDIT, soldBy: attendant.id, customer: kathmanduCabs.id, hoursAgo: 1.1 },
  ];

  for (const s of seedSales) {
    const liters = D(s.liters);
    const total = liters.mul(s.tank.ratePerL).toDecimalPlaces(2);
    const receiptNo = (await prisma.station.update({ where: { id: station.id }, data: { nextReceiptNo: { increment: 1 } } })).nextReceiptNo - 1;
    await prisma.sale.create({
      data: {
        receiptNo,
        stationId: station.id,
        tankId: s.tank.id,
        fuel: s.tank.fuel,
        liters,
        ratePerL: s.tank.ratePerL,
        totalAmount: total,
        paymentMethod: s.payment,
        soldById: s.soldBy,
        customerId: s.customer,
        createdAt: hoursAgo(s.hoursAgo),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with any of:");
  for (const u of [owner, manager, cashier, attendant, attendant2]) {
    console.log(`  ${u.role.padEnd(10)} ${u.username.padEnd(10)} (station: shree-petroleum, password: password123)`);
  }
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
