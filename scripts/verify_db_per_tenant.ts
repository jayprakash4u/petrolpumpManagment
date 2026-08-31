import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { applyMigrations } from "../src/lib/migrations/apply";

const masterUrl = "sqlserver://localhost:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;";
const shreeUrl = "sqlserver://localhost:1435;database=FuelStation_shree_petroleum;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;";

const masterPrisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });
const shreePrisma = new PrismaClient({ datasources: { db: { url: shreeUrl } } });

async function main() {
  console.log("==================================================");
  console.log("🚀 Testing Enterprise Database-Per-Tenant Architecture");
  console.log("==================================================");

  // 1. Verify Master Database
  const masterTenants = await masterPrisma.tenant.findMany();
  console.log(`✅ Master DB [FuelStationMasterDB] has ${masterTenants.length} registered tenant(s):`);
  masterTenants.forEach((t) => console.log(`   - ${t.name} (${t.slug}) -> DB [${t.databaseName}] | Status: ${t.status}`));

  // 2. Verify Shree Petroleum dedicated database
  const shreeTanks = await shreePrisma.tank.findMany();
  const shreeUsers = await shreePrisma.user.findMany();
  const shreeSalesCount = await shreePrisma.sale.count();
  console.log(`✅ Station DB [FuelStation_shree_petroleum]:`);
  console.log(`   - Tanks: ${shreeTanks.length}`);
  console.log(`   - Staff Users: ${shreeUsers.length}`);
  console.log(`   - Existing Sales: ${shreeSalesCount}`);

  // 3. Dynamically Provision a SECOND Independent Station
  const testSlug = "birgunj-fuel";
  const testDbName = "FuelStation_birgunj_fuel";
  console.log(`\n3. Dynamically Provisioning Station 2: 'Birgunj Fuel Center' -> [${testDbName}]...`);

  // Create Database
  await masterPrisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${testDbName}')
      CREATE DATABASE [${testDbName}];
  `);
  console.log(`   ✅ Created SQL Server Database [${testDbName}]`);

  // Apply DDL Tables
  const birgunjUrl = `sqlserver://localhost:1435;database=${testDbName};user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`;
  const birgunjPrisma = new PrismaClient({ datasources: { db: { url: birgunjUrl } } });

  const migrationResult = await applyMigrations(birgunjPrisma);
  if (migrationResult.status === "failed") {
    throw new Error(`Migration failed: ${migrationResult.error}`);
  }
  console.log(`   ✅ Applied tenant schema migrations to [${testDbName}] (${migrationResult.status})`);

  // Register in Master DB
  await masterPrisma.tenant.upsert({
    where: { slug: testSlug },
    create: {
      slug: testSlug,
      name: "Birgunj Fuel Center",
      companyName: "Birgunj Petroleum Pvt. Ltd.",
      databaseName: testDbName,
      databaseServer: "localhost:1435",
      status: "ACTIVE",
      address: "Main Road, Birgunj, Parsa, Nepal",
      phone: "+977 51 520001",
    },
    update: {},
  });
  console.log(`   ✅ Registered in FuelStationMasterDB Tenant registry`);

  // Seed Station Admin & Tanks for Birgunj
  const birgunjStation = await birgunjPrisma.station.create({
    data: {
      slug: testSlug,
      name: "Birgunj Fuel Center",
      companyName: "Birgunj Petroleum Pvt. Ltd.",
      address: "Main Road, Birgunj, Parsa, Nepal",
      nextReceiptNo: 1,
    },
  });

  const pwHash = await bcrypt.hash("BirgunjAdmin2026!", 10);
  const birgunjAdmin = await birgunjPrisma.user.create({
    data: {
      stationId: birgunjStation.id,
      name: "Birendra Sah",
      username: "birendra",
      passwordHash: pwHash,
      role: "OWNER",
      employeeId: "EMP-B01",
      active: true,
    },
  });

  const birgunjPetrolTank = await birgunjPrisma.tank.create({
    data: {
      stationId: birgunjStation.id,
      fuel: "PETROL",
      capacityL: 20000,
      levelL: 15000,
      openingL: 15000,
      ratePerL: 172.5,
    },
  });
  console.log(`   ✅ Station Admin @${birgunjAdmin.username} and Petrol Tank created in [${testDbName}]`);

  // 4. Test Physical Data Isolation
  console.log("\n4. Testing Absolute Multi-Tenant Isolation...");
  
  // Record sale in Birgunj
  await birgunjPrisma.sale.create({
    data: {
      receiptNo: 1,
      stationId: birgunjStation.id,
      tankId: birgunjPetrolTank.id,
      fuel: "PETROL",
      liters: 50,
      ratePerL: 172.5,
      totalAmount: 8625,
      paymentMethod: "CASH",
      soldById: birgunjAdmin.id,
    },
  });

  // Verify Shree Petroleum stats are unchanged
  const newShreeSalesCount = await shreePrisma.sale.count();
  const shreeUsersCount = await shreePrisma.user.count();
  const birgunjSalesCount = await birgunjPrisma.sale.count();

  console.log(`   - Sales in Station 1 (Shree Petroleum): ${newShreeSalesCount} (Should still be ${shreeSalesCount})`);
  console.log(`   - Sales in Station 2 (Birgunj Fuel):    ${birgunjSalesCount} (Should be 1)`);

  if (newShreeSalesCount !== shreeSalesCount || birgunjSalesCount !== 1) {
    throw new Error("Physical tenant isolation assertion failed!");
  }
  console.log("   ✅ Physical Tenant Isolation: PASSED! Zero data crossover!");

  // 5. Clean up temporary test database
  console.log("\n5. Cleaning up temporary test database...");
  await birgunjPrisma.$disconnect();
  await masterPrisma.tenant.delete({ where: { slug: testSlug } });
  await masterPrisma.$executeRawUnsafe(`
    IF EXISTS (SELECT * FROM sys.databases WHERE name = '${testDbName}')
    BEGIN
      ALTER DATABASE [${testDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${testDbName}];
    END;
  `);
  console.log(`   ✅ Cleaned up temporary test database [${testDbName}]`);

  console.log("\n==================================================");
  console.log("🎉 ALL DATABASE-PER-TENANT ARCHITECTURE CHECKS PASSED!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Multi-tenant test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
    await shreePrisma.$disconnect();
  });
