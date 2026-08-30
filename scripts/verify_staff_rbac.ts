import { PrismaClient } from "@prisma/client";
import { hasUserPermission } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🚀 Verifying RBAC & Microsoft SQL Server Integration");
  console.log("==================================================");

  // 1. Verify Station
  const station = await prisma.station.findUnique({
    where: { slug: "shree-petroleum" },
    include: { users: true, tanks: true },
  });

  if (!station) {
    throw new Error("Station 'shree-petroleum' not found in SQL Server database!");
  }

  console.log(`✅ Connected to SQL Server DB: Station '${station.name}' (${station.slug})`);
  console.log(`   Found ${station.users.length} seeded staff and ${station.tanks.length} tanks.`);

  // 2. Verify Station Admin (Owner)
  const owner = station.users.find((u) => u.role === "OWNER");
  if (!owner) throw new Error("Station Admin owner not found!");
  console.log(`✅ Station Admin Verified: ${owner.name} (@${owner.username})`);
  console.log(`   Admin full access check (viewReports): ${hasUserPermission(owner, "viewReports")}`);
  console.log(`   Admin full access check (manageUsers): ${hasUserPermission(owner, "manageUsers")}`);

  // 3. Verify Seeded Staff with Roles
  console.log(`✅ Seeded Staff Roster in SQL Server:`);
  station.users.forEach((s) => {
    console.log(`   - [${s.role}] ${s.name} (@${s.username}) | Phone: ${s.phone ?? "N/A"} | ID: ${s.employeeId ?? "N/A"}`);
  });

  // 4. Test User Creation with Custom Permissions in SQL Server
  const testUsername = `test_operator_${Date.now().toString().slice(-4)}`;
  const customPerms = ["viewPumps", "recordMeterReadings", "recordSale", "manageOwnShift", "viewReports"];

  const createdUser = await prisma.user.create({
    data: {
      stationId: station.id,
      name: "Bikash TEST Operator",
      username: testUsername,
      passwordHash: "dummyHash123",
      role: "ATTENDANT",
      phone: "9841999888",
      employeeId: "EMP-TEST-99",
      permissions: JSON.stringify(customPerms),
      active: true,
    },
  });

  console.log(`✅ Created test staff member: ${createdUser.name} (@${createdUser.username}) with custom perms.`);
  console.log(`   - Stored permissions in SQL Server: ${createdUser.permissions}`);

  // 5. Test Permission Evaluation
  const canViewReports = hasUserPermission(createdUser, "viewReports");
  const canEditRates = hasUserPermission(createdUser, "editFuelRate");
  const canViewPumps = hasUserPermission(createdUser, "viewPumps");

  console.log(`   - hasUserPermission(createdUser, 'viewReports') -> ${canViewReports} (Expected: true)`);
  console.log(`   - hasUserPermission(createdUser, 'viewPumps')   -> ${canViewPumps} (Expected: true)`);
  console.log(`   - hasUserPermission(createdUser, 'editFuelRate')-> ${canEditRates} (Expected: false)`);

  if (!canViewReports || !canViewPumps || canEditRates) {
    throw new Error("RBAC custom permission evaluation failed!");
  }

  // 6. Clean up test record
  await prisma.user.delete({ where: { id: createdUser.id } });
  console.log(`✅ Cleaned up temporary test user.`);

  console.log("==================================================");
  console.log("🎉 ALL RBAC & SQL SERVER DATABASE CHECKS PASSED 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
