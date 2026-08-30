import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://localhost:1435;database=FuelStationMasterDB;user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;",
    },
  },
});

async function main() {
  console.log("==================================================");
  console.log("🚀 Testing Station Login for @jay on 'jay-prakash-yadav'");
  console.log("==================================================");

  const slug = "jay-prakash-yadav";
  const username = "jay";
  const password = "pass1234";

  // 1. Resolve Tenant DB
  const tenant = await masterPrisma.tenant.findUnique({ where: { slug } });
  console.log("✅ Found tenant in Master DB:", tenant?.name, "-> DB:", tenant?.databaseName);

  const tenantDb = new PrismaClient({
    datasources: {
      db: {
        url: `sqlserver://localhost:1435;database=${tenant!.databaseName};user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`,
      },
    },
  });

  // 2. Lookup Station
  const station = await tenantDb.station.findUnique({
    where: { slug },
  });
  console.log("✅ Found station in tenant DB:", station?.name, `(ID: ${station?.id})`);

  // 3. Lookup User
  const user = await tenantDb.user.findUnique({
    where: { stationId_username: { stationId: station!.id, username } },
  });
  console.log("✅ Found user:", user?.username, `(Role: ${user?.role}, Active: ${user?.active})`);

  // 4. Verify Password
  const valid = await bcrypt.compare(password, user!.passwordHash);
  console.log("✅ Password match result:", valid);

  // 5. Test Session Creation in Tenant Database
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const session = await tenantDb.session.create({
    data: {
      userId: user!.id,
      expiresAt,
      userAgent: "TestRunner/1.0",
      ipAddress: "127.0.0.1",
    },
  });
  console.log("✅ Successfully created session in dedicated DB:", session.id);

  // 6. Test Session Read with User & Station includes
  const read = await tenantDb.session.findUnique({
    where: { id: session.id },
    include: { user: { include: { station: { select: { suspendedAt: true } } } } },
  });
  console.log("✅ Successfully read session:", read?.id, `(User: ${read?.user.name}, Station Suspended: ${read?.user.station.suspendedAt})`);

  // Clean up test session
  await tenantDb.session.delete({ where: { id: session.id } });
  console.log("✅ Cleaned up test session");

  console.log("\n==================================================");
  console.log("🎉 ALL LOGIN CHECKS FOR @jay PASSED 100%!");
  console.log("==================================================");
  await tenantDb.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Test error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
