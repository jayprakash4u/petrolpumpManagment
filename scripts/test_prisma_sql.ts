import { PrismaClient } from "@prisma/client";

const p = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://localhost:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;",
    },
  },
});

async function run() {
  try {
    const res = await p.$queryRawUnsafe<Array<{ name: string }>>(
      "SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb');"
    );
    console.log("Current User Databases on SQL Server:");
    res.forEach((r) => console.log("  - " + r.name));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await p.$disconnect();
  }
}

run();
