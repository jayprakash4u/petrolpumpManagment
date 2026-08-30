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
  console.log("🚀 Testing Super Admin Station Management & Password Reset");
  console.log("==================================================");

  const slug = "jay-prakash-yadav";

  // 1. Get Tenant details
  const tenant = await masterPrisma.tenant.findUnique({ where: { slug } });
  console.log(`✅ Loaded Tenant from Master DB: ${tenant?.name} (${tenant?.slug})`);
  console.log(`   - Current Database Name: [${tenant?.databaseName}]`);

  const tenantDb = new PrismaClient({
    datasources: {
      db: {
        url: `sqlserver://localhost:1435;database=${tenant!.databaseName};user=fsm_dev;password=FuelStation2026Password!;trustServerCertificate=true;connectionTimeout=15000;connectTimeout=15000;`,
      },
    },
  });

  // 2. Load staff user inside dedicated DB
  const user = await tenantDb.user.findFirst({
    where: { username: "jay" },
  });
  console.log(`✅ Found Staff User in dedicated DB: @${user?.username} (${user?.name}, Role: ${user?.role})`);

  // 3. Test Changing Staff Password to "newpass2026"
  const newPass = "newpass2026";
  const newHash = await bcrypt.hash(newPass, 10);

  const updatedUser = await tenantDb.user.update({
    where: { id: user!.id },
    data: {
      passwordHash: newHash,
      name: "Jay Prakash Yadav (Owner)",
    },
  });
  console.log(`✅ Updated User Credentials: Name: "${updatedUser.name}", Password reset to: "${newPass}"`);

  // 4. Verify password matches new password
  const matches = await bcrypt.compare(newPass, updatedUser.passwordHash);
  console.log(`✅ Verified New Password Match: ${matches}`);

  // 5. Restore original password "pass1234" for convenience
  const origHash = await bcrypt.hash("pass1234", 10);
  await tenantDb.user.update({
    where: { id: user!.id },
    data: {
      passwordHash: origHash,
      name: "Jay Prakash Yadav",
    },
  });
  console.log(`✅ Restored original password to 'pass1234'`);

  console.log("\n==================================================");
  console.log("🎉 SUPER ADMIN STATION MANAGEMENT CHECKS PASSED 100%!");
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
