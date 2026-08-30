/**
 * Seeds Database-Per-Tenant Architecture on Microsoft SQL Server:
 * 1. Master DB (FuelStationMasterDB):
 *    - Tenant Registry (Shree Petroleum -> FuelStation_shree_petroleum)
 *    - Platform Super Admin (operator & admin)
 * 2. Dedicated Station DB (FuelStation_shree_petroleum):
 *    - Station Info: Shree Petroleum
 *    - Station Admin / Owner with 100% access (prakash)
 *    - Station Manager (anita)
 *    - Shift Cashier (sita)
 *    - Accountant (sunil)
 *    - 2 Pump Operators (ramesh, bikash)
 *    - 3 Storage Tanks (Petrol, Diesel, CNG)
 *    - Credit customers & active morning shift sales
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const masterUrl = "sqlserver://localhost:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true";
const tenantUrl = "sqlserver://localhost:1435;database=FuelStation_shree_petroleum;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true";

const masterPrisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });
const tenantPrisma = new PrismaClient({ datasources: { db: { url: tenantUrl } } });

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

async function main() {
  console.log("==================================================");
  console.log("🚀 Seeding Database-Per-Tenant Architecture");
  console.log("==================================================");

  const passwordHash = await bcrypt.hash("password123", 10);
  const adminPasswordHash = await bcrypt.hash("SuperAdmin2026!", 10);

  // ----------------------------------------------------------------
  // 1. MASTER DB: FuelStationMasterDB
  // ----------------------------------------------------------------
  console.log("1. Seeding Master Database [FuelStationMasterDB]...");

  // Keep ONLY ONE Super Admin
  await masterPrisma.platformAuditLog.deleteMany();
  await masterPrisma.platformSession.deleteMany();
  await masterPrisma.platformAdmin.deleteMany();

  const superAdmin = await masterPrisma.platformAdmin.create({
    data: {
      username: "admin",
      email: "admin@fuelstation.platform",
      name: "SaaS Super Admin",
      passwordHash: adminPasswordHash,
      active: true,
    },
  });
  console.log(`✅ Single Super Admin Created: @${superAdmin.username}`);

  // Seed Tenant Registry
  const tenant = await masterPrisma.tenant.upsert({
    where: { slug: "shree-petroleum" },
    create: {
      slug: "shree-petroleum",
      name: "Shree Petroleum",
      companyName: "Shree Petroleum & Fuel Traders Pvt. Ltd.",
      databaseName: "FuelStation_shree_petroleum",
      databaseServer: "localhost:1435",
      status: "ACTIVE",
      phone: "+977 1 4455660",
      email: "info@shreepetroleum.test",
      address: "Ring Road, Sukedhara, Kathmandu, Nepal",
    },
    update: {
      name: "Shree Petroleum",
      companyName: "Shree Petroleum & Fuel Traders Pvt. Ltd.",
      databaseName: "FuelStation_shree_petroleum",
      databaseServer: "localhost:1435",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Registered Tenant in Master DB: ${tenant.name} -> DB [${tenant.databaseName}]`);

  // ----------------------------------------------------------------
  // 2. DEDICATED STATION DB: FuelStation_shree_petroleum
  // ----------------------------------------------------------------
  console.log("2. Seeding Station Database [FuelStation_shree_petroleum]...");

  // Clear existing station data
  await tenantPrisma.auditLog.deleteMany();
  await tenantPrisma.customerPayment.deleteMany();
  await tenantPrisma.sale.deleteMany();
  await tenantPrisma.purchase.deleteMany();
  await tenantPrisma.fuelRateHistory.deleteMany();
  await tenantPrisma.shift.deleteMany();
  await tenantPrisma.session.deleteMany();
  await tenantPrisma.customer.deleteMany();
  await tenantPrisma.tank.deleteMany();
  await tenantPrisma.user.deleteMany();
  await tenantPrisma.station.deleteMany();

  // Create Station
  const station = await tenantPrisma.station.create({
    data: {
      slug: "shree-petroleum",
      name: "Shree Petroleum",
      companyName: "Shree Petroleum & Fuel Traders Pvt. Ltd.",
      phone: "+977 1 4455660",
      email: "info@shreepetroleum.test",
      address: "Ring Road, Sukedhara, Kathmandu, Nepal",
      nextReceiptNo: 1,
    },
  });

  // Create Staff Roster
  console.log("   Creating Staff: Admin, Manager, Cashier, Accountant, Attendants...");
  const [owner, manager, cashier, accountant, attendant, attendant2] = await Promise.all([
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Prakash Shrestha",
        username: "prakash",
        email: "owner@shreepetroleum.test",
        phone: "98510 11223",
        employeeId: "EMP-001",
        role: "OWNER",
        permissions: null, // Full 100% access
        passwordHash,
        active: true,
      },
    }),
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Anita K.C.",
        username: "anita",
        email: "manager@shreepetroleum.test",
        phone: "98410 44556",
        employeeId: "EMP-002",
        role: "MANAGER",
        permissions: null,
        passwordHash,
        active: true,
      },
    }),
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Sita Gurung",
        username: "sita",
        email: "cashier@shreepetroleum.test",
        phone: "98610 77889",
        employeeId: "EMP-003",
        role: "CASHIER",
        permissions: JSON.stringify(["viewSales", "recordSale", "processPayment", "recordCustomerPayment", "manageOwnShift"]),
        passwordHash,
        active: true,
      },
    }),
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Sunil Shrestha",
        username: "sunil",
        email: "accountant@shreepetroleum.test",
        phone: "98012 33445",
        employeeId: "EMP-004",
        role: "ACCOUNTANT",
        permissions: JSON.stringify(["viewSales", "viewExpenses", "manageExpenses", "viewReports", "exportReports", "manageCustomers"]),
        passwordHash,
        active: true,
      },
    }),
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Ramesh Thapa",
        username: "ramesh",
        phone: "98123 55667",
        employeeId: "EMP-005",
        role: "ATTENDANT",
        permissions: JSON.stringify(["viewPumps", "recordMeterReadings", "recordSale", "manageOwnShift"]),
        passwordHash,
        active: true,
      },
    }),
    tenantPrisma.user.create({
      data: {
        stationId: station.id,
        name: "Bikash Rai",
        username: "bikash",
        phone: "98234 66778",
        employeeId: "EMP-006",
        role: "ATTENDANT",
        permissions: JSON.stringify(["viewPumps", "recordMeterReadings", "recordSale", "manageOwnShift"]),
        passwordHash,
        active: true,
      },
    }),
  ]);

  // Create Storage Tanks
  console.log("   Creating Tanks (Petrol, Diesel, CNG)...");
  const [petrol, diesel, cng] = await Promise.all([
    tenantPrisma.tank.create({
      data: {
        stationId: station.id,
        fuel: "PETROL",
        capacityL: D(12000),
        levelL: D(8214),
        openingL: D(8214),
        ratePerL: D("106.48"),
      },
    }),
    tenantPrisma.tank.create({
      data: {
        stationId: station.id,
        fuel: "DIESEL",
        capacityL: D(12000),
        levelL: D(9460),
        openingL: D(9460),
        ratePerL: D("92.34"),
      },
    }),
    tenantPrisma.tank.create({
      data: {
        stationId: station.id,
        fuel: "CNG",
        capacityL: D(6000),
        levelL: D(1180),
        openingL: D(1180),
        ratePerL: D("78.10"),
      },
    }),
  ]);

  // Create Credit Customers
  console.log("   Creating Credit Customers...");
  const [kathmanduCabs, everestLogistics] = await Promise.all([
    tenantPrisma.customer.create({
      data: {
        stationId: station.id,
        name: "Kathmandu Cabs Pvt. Ltd.",
        phone: "98410 22310",
        dueAmount: D(24500),
        creditLimit: D(50000),
      },
    }),
    tenantPrisma.customer.create({
      data: {
        stationId: station.id,
        name: "Everest Logistics",
        phone: "98510 88214",
        dueAmount: D(8200),
        creditLimit: D(30000),
      },
    }),
  ]);

  // Open Active Shifts
  console.log("   Opening Active Shifts...");
  await Promise.all([
    tenantPrisma.shift.create({ data: { userId: attendant.id, startedAt: hoursAgo(3) } }),
    tenantPrisma.shift.create({ data: { userId: cashier.id, startedAt: hoursAgo(3) } }),
    tenantPrisma.shift.create({ data: { userId: manager.id, startedAt: hoursAgo(6) } }),
  ]);
  await tenantPrisma.user.updateMany({
    where: { id: { in: [attendant.id, cashier.id, manager.id] } },
    data: { onShift: true, shiftStartedAt: hoursAgo(3) },
  });

  // Seed Sales
  console.log("   Recording Initial Morning Sales...");
  const seedSales = [
    { tank: petrol, liters: "40", payment: "CASH", soldBy: attendant.id, hoursAgo: 5.5, vehicleNo: "BA-2-PA 9876" },
    { tank: diesel, liters: "120", payment: "CREDIT", soldBy: cashier.id, customer: everestLogistics.id, hoursAgo: 4.3, vehicleNo: "NA-4-KHA 1234" },
    { tank: petrol, liters: "25", payment: "CASH", soldBy: attendant.id, hoursAgo: 3.8, vehicleNo: "BA-3-CHA 4521" },
    { tank: cng, liters: "15", payment: "CASH", soldBy: cashier.id, hoursAgo: 3, vehicleNo: "BA-1-JA 7744" },
    { tank: diesel, liters: "60", payment: "CASH", soldBy: attendant.id, hoursAgo: 2.2, vehicleNo: "LU-2-KHA 9901" },
    { tank: petrol, liters: "200", payment: "CREDIT", soldBy: attendant.id, customer: kathmanduCabs.id, hoursAgo: 1.1, vehicleNo: "BA-2-KA 3322" },
  ];

  for (const s of seedSales) {
    const liters = D(s.liters);
    const total = liters.mul(s.tank.ratePerL).toDecimalPlaces(2);
    const receiptNo = (await tenantPrisma.station.update({ where: { id: station.id }, data: { nextReceiptNo: { increment: 1 } } })).nextReceiptNo - 1;
    await tenantPrisma.sale.create({
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
        vehicleNo: s.vehicleNo,
        createdAt: hoursAgo(s.hoursAgo),
      },
    });
  }

  console.log("==================================================");
  console.log("🎉 Database-Per-Tenant Seed Completed Successfully!");
  console.log("==================================================");
  console.log("Master DB [FuelStationMasterDB]:");
  console.log("  - Super Admin: username = 'admin' (password: 'SuperAdmin2026!')");
  console.log("  - Tenant Registered: 'Shree Petroleum' -> DB [FuelStation_shree_petroleum]");
  console.log("\nStation DB [FuelStation_shree_petroleum]:");
  console.log("  - Station Code: shree-petroleum (Password: password123)");
  console.log(`  - Station Admin (Owner): @${owner.username} (100% full access)`);
  console.log(`  - Manager:               @${manager.username}`);
  console.log(`  - Cashier:               @${cashier.username}`);
  console.log(`  - Accountant:            @${accountant.username}`);
  console.log(`  - Pump Operators:        @${attendant.username}, @${attendant2.username}`);
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
    await tenantPrisma.$disconnect();
  });
