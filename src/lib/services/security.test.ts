import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { Role, FuelType } from "@/lib/permissions";
import { ImpersonationService } from "./impersonation-service";
import { AuditService } from "./audit-service";

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Own throwaway database.
 *
 * This suite clears every table in beforeEach. Pointed at the development
 * database — which is what it did — that silently destroyed the seeded
 * station, its staff and the platform operator on every `npm test`, leaving
 * nobody able to sign in. DATABASE_URL is redirected before the client is
 * constructed, so the wipes can only ever hit this temporary file.
 */
const testDir = mkdtempSync(path.join(tmpdir(), "fsm-security-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;
execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
  env: { ...process.env, DATABASE_URL: "file:" + testDbPath },
  stdio: "pipe",
  shell: process.platform === "win32",
});

const prisma = new PrismaClient();

describe("Enterprise Security & Immutable Audit Trail Tests", () => {
  let testStation: any;
  let testUser: any;
  let testAdmin: any;

  beforeEach(async () => {
    // Clear test data in correct FK order
    await prisma.platformAuditLog.deleteMany();
    await prisma.platformSession.deleteMany();
    await prisma.platformAdmin.deleteMany();
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
        name: "Shree Petroleum Test",
        address: "Ring Road, Kathmandu",
      },
    });

    testUser = await prisma.user.create({
      data: {
        stationId: testStation.id,
        name: "Prakash Shrestha",
        username: "prakash",
        passwordHash: "hash",
        role: Role.OWNER,
      },
    });

    testAdmin = await prisma.platformAdmin.create({
      data: {
        username: `test-op-${Date.now()}`,
        name: "Platform Operator",
        passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
      },
    });
  });

  it("records non-repudiable audit events with before and after state diffs", async () => {
    const log = await AuditService.logEvent({
      stationId: testStation.id,
      actorId: testUser.id,
      action: "FUEL_RATE_UPDATED",
      entityType: "Tank",
      entityId: "tank-ms-1",
      originalValue: { ratePerL: "170.00" },
      updatedValue: { ratePerL: "172.00" },
      metadata: { reason: "NOC Price Revision Circular #402" },
    });

    expect(log.action).toBe("FUEL_RATE_UPDATED");
    const meta = log.metadata as any;
    expect(meta.before.ratePerL).toBe("170.00");
    expect(meta.after.ratePerL).toBe("172.00");
    expect(meta.reason).toBe("NOC Price Revision Circular #402");

    const trail = await AuditService.getStationAuditTrail(testStation.id);
    expect(trail.length).toBe(1);
    expect(trail[0].actorName).toBe("Prakash Shrestha");
  });

  it("requires a mandatory support reason for Super Admin impersonation", async () => {
    await expect(
      ImpersonationService.startSupportSession({
        stationId: testStation.id,
        supportReason: "hi", // too short
      })
    ).rejects.toThrow(/mandatory/);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});
