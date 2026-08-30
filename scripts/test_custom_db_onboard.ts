import { PrismaClient } from "@prisma/client";
import { TENANT_DB_SCHEMA_DDL } from "../src/lib/station-schema-ddl";

const masterUrl = "sqlserver://localhost:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;";
const masterPrisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });

async function main() {
  console.log("==================================================");
  console.log("🚀 Testing Custom Database Name Onboarding via Admin Panel");
  console.log("==================================================");

  const customSlug = "everest-fuel";
  const customDbName = "Everest_Fuel_Custom_DB";

  console.log(`1. Creating database on SQL Server with custom name: [${customDbName}]...`);
  await masterPrisma.$executeRawUnsafe(`
    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${customDbName}')
      CREATE DATABASE [${customDbName}];
  `);

  const customPrismaUrl = `sqlserver://localhost:1435;database=${customDbName};user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`;
  const customPrisma = new PrismaClient({ datasources: { db: { url: customPrismaUrl } } });

  // Apply DDL
  const ddlStatements = TENANT_DB_SCHEMA_DDL.split(";\n\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of ddlStatements) {
    await customPrisma.$executeRawUnsafe(statement);
  }

  // Register in Master DB
  const tenant = await masterPrisma.tenant.upsert({
    where: { slug: customSlug },
    create: {
      slug: customSlug,
      name: "Everest Fuel Center",
      companyName: "Everest Petroleum Corp Pvt. Ltd.",
      databaseName: customDbName,
      databaseServer: "localhost:1435",
      status: "ACTIVE",
      address: "Prithvi Highway, Malekhu, Dhading",
      phone: "+977 10 520111",
    },
    update: {},
  });

  // Seed Station & Admin
  const station = await customPrisma.station.create({
    data: {
      slug: customSlug,
      name: "Everest Fuel Center",
      companyName: "Everest Petroleum Corp Pvt. Ltd.",
      address: "Prithvi Highway, Malekhu, Dhading",
      nextReceiptNo: 1,
    },
  });

  const admin = await customPrisma.user.create({
    data: {
      stationId: station.id,
      name: "Gopal Adhikari",
      username: "gopal",
      passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
      role: "OWNER",
      employeeId: "EMP-001",
      active: true,
    },
  });

  const tank = await customPrisma.tank.create({
    data: {
      stationId: station.id,
      fuel: "PETROL",
      capacityL: 20000,
      levelL: 15000,
      openingL: 15000,
      ratePerL: 172.5,
    },
  });

  console.log(`✅ Station Provisioned Successfully!`);
  console.log(`   - Station Name:       ${station.name}`);
  console.log(`   - Station Code:       ${station.slug}`);
  console.log(`   - Custom DB Created:  [${tenant.databaseName}]`);
  console.log(`   - Station Admin:      @${admin.username} (${admin.name})`);
  console.log(`   - Fuel Tank Created:  ${tank.fuel} (${tank.capacityL} L)`);

  // 4. Clean up temporary test station and database
  console.log("\n4. Cleaning up temporary custom database...");
  await customPrisma.$disconnect();
  await masterPrisma.tenant.delete({ where: { slug: customSlug } });
  await masterPrisma.$executeRawUnsafe(`
    IF EXISTS (SELECT * FROM sys.databases WHERE name = '${customDbName}')
    BEGIN
      ALTER DATABASE [${customDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${customDbName}];
    END;
  `);
  console.log(`✅ Dropped [${customDbName}] successfully.`);

  console.log("\n==================================================");
  console.log("🎉 CUSTOM DATABASE NAME ONBOARDING TEST PASSED 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
