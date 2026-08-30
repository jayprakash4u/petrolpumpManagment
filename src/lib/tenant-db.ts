import "server-only";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";

/**
 * Tenant-Scoped Database Client.
 *
 * Implements strict Multi-Tenant Boundary Isolation.
 * Automatically injects the stationId filter on all tenant-specific queries,
 * preventing cross-tenant data leakage by design.
 */
export async function getScopedDb() {
  const user = await requireUser();
  const stationId = user.stationId;

  return {
    stationId,
    user,
    // Direct scoped query helpers
    tanks: {
      findMany: (args?: any) =>
        prisma.tank.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) =>
        prisma.tank.findFirst({ ...args, where: { ...args?.where, stationId } }),
      findUnique: (args: any) =>
        prisma.tank.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    customers: {
      findMany: (args?: any) =>
        prisma.customer.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) =>
        prisma.customer.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    sales: {
      findMany: (args?: any) =>
        prisma.sale.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) =>
        prisma.sale.findFirst({ ...args, where: { ...args?.where, stationId } }),
      count: (args?: any) =>
        prisma.sale.count({ ...args, where: { ...args?.where, stationId } }),
    },
    purchases: {
      findMany: (args?: any) =>
        prisma.purchase.findMany({ ...args, where: { ...args?.where, stationId } }),
      findFirst: (args?: any) =>
        prisma.purchase.findFirst({ ...args, where: { ...args?.where, stationId } }),
    },
    auditLogs: {
      findMany: (args?: any) =>
        prisma.auditLog.findMany({ ...args, where: { ...args?.where, stationId } }),
    },
    // Raw prisma handle for custom atomic transactions
    raw: prisma,
  };
}
