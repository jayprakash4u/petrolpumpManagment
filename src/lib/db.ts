import "server-only";
import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton: hot-reload re-evaluates this module on
// every edit, which would otherwise open a fresh pool of Postgres
// connections each time and exhaust the connection limit. Stashing the
// client on `globalThis` survives the reload; in production each server
// instance gets exactly one client for its lifetime.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
