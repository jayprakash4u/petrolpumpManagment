import "server-only";
import { prisma } from "@/lib/db";
import { fmtBSDateTime } from "@/lib/bs-date";

export interface AuditEventParams {
  stationId: string;
  actorId?: string | null;
  action:
    | "FUEL_RATE_UPDATED"
    | "INVENTORY_DIP_OVERRIDE"
    | "SALE_RECORDED"
    | "SALE_VOIDED"
    | "CUSTOMER_PAYMENT_RECORDED"
    | "CUSTOMER_CREDIT_LIMIT_UPDATED"
    | "SUPER_ADMIN_IMPERSONATION_STARTED"
    | "SHIFT_STARTED"
    | "SHIFT_CLOSED";
  entityType: string;
  entityId: string;
  originalValue?: Record<string, unknown> | null;
  updatedValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Appends an immutable, non-repudiable audit log entry with before/after state diffs.
   */
  static async logEvent(params: AuditEventParams) {
    const payload = {
      ...params.metadata,
      before: params.originalValue ?? null,
      after: params.updatedValue ?? null,
    };

    return await prisma.auditLog.create({
      data: {
        stationId: params.stationId,
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: payload as any,
      },
    });
  }

  /**
   * Retrieves station audit trail with human-readable BS timestamps.
   */
  static async getStationAuditTrail(stationId: string, limit = 50) {
    const logs = await prisma.auditLog.findMany({
      where: { stationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: { name: true, username: true, role: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actorName: log.actor?.name ?? "System Daemon",
      actorUsername: log.actor?.username ?? "system",
      metadata: log.metadata,
      createdAtBS: fmtBSDateTime(log.createdAt),
      createdAtISO: log.createdAt.toISOString(),
    }));
  }
}
