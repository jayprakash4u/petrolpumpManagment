import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { Role, FuelType } from "@/lib/permissions";
import { QueueService } from "./queue-service";
import { OfflineSyncService } from "./offline-sync-service";

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
const testDir = mkdtempSync(path.join(tmpdir(), "fsm-offline-"));
const testDbPath = path.join(testDir, "test.db");
process.env.DATABASE_URL = "file:" + testDbPath;
execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"], {
  env: { ...process.env, DATABASE_URL: "file:" + testDbPath },
  stdio: "pipe",
  shell: process.platform === "win32",
});

const prisma = new PrismaClient();
const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

describe("Offline Resiliency & Background Job Queue Tests", () => {
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
        slug: `test-station-offline-${Date.now()}`,
        name: "Offline Test Station",
        address: "Highway Outpost, Nepal",
      },
    });

    testUser = await prisma.user.create({
      data: {
        stationId: testStation.id,
        name: "Attendant Ramesh",
        username: "ramesh.off",
        passwordHash: "hash",
        role: Role.ATTENDANT,
        onShift: true,
      },
    });

    testTank = await prisma.tank.create({
      data: {
        stationId: testStation.id,
        fuel: FuelType.DIESEL,
        capacityL: D(15000),
        levelL: D(8000),
        openingL: D(8000),
        ratePerL: D("158.00"),
      },
    });
  });

  it("enqueues background jobs asynchronously and completes execution", async () => {
    const job = QueueService.enqueue({
      stationId: testStation.id,
      type: "GENERATE_MONTHLY_LEDGER_PDF",
      payload: { monthBS: "2083_05", fiscalYear: "2082/2083" },
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe("QUEUED");

    // Wait a brief tick for background processing microtask
    await new Promise((r) => setTimeout(r, 50));

    const updatedJob = QueueService.getJob(job.id);
    expect(updatedJob?.status).toBe("COMPLETED");
    expect(updatedJob?.result?.fileSizeKb).toBe(842);
  });

  it("ingests batches of offline sales idempotently upon network restoration", async () => {
    const syncRes = await OfflineSyncService.syncBatch({
      stationId: testStation.id,
      operatorId: testUser.id,
      operatorName: testUser.name,
      sales: [
        {
          clientTxId: "offline-uuid-001",
          tankId: testTank.id,
          mode: "LITERS",
          quantity: "20",
          expectedRate: "158.00",
          paymentMethod: "CASH",
          offlineRecordedAt: new Date().toISOString(),
        },
        {
          clientTxId: "offline-uuid-002",
          tankId: testTank.id,
          mode: "RUPEES",
          quantity: "1580", // 10 Liters
          expectedRate: "158.00",
          paymentMethod: "CASH",
          offlineRecordedAt: new Date().toISOString(),
        },
      ],
    });

    expect(syncRes.totalSynced).toBe(2);
    expect(syncRes.syncedReceipts[0].receiptNo).toBe(1);
    expect(syncRes.syncedReceipts[1].receiptNo).toBe(2);

    const tankAfter = await prisma.tank.findUniqueOrThrow({ where: { id: testTank.id } });
    expect(tankAfter.levelL.toString()).toBe("7970"); // 8000 - 20 - 10
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  rmSync(testDir, { recursive: true, force: true });
});
