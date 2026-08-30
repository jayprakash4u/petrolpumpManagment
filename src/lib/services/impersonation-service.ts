import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { SESSION_COOKIE } from "@/lib/session";
import { ServiceError } from "./sale-service";

const IMPERSONATION_MAX_TTL_SECONDS = 60 * 60; // Strict 1 Hour maximum expiry
const encodedSecret = new TextEncoder().encode(env.SESSION_SECRET);

export interface ImpersonationClaims {
  sub: string; // Target Station User ID
  tenantId: string; // Target Station ID
  stationSlug: string;
  role: string;
  isImpersonated: true;
  impersonatorAdminId: string;
  impersonatorUsername: string;
  supportReason: string;
  exp: number;
}

export class ImpersonationService {
  /**
   * Generates a time-bound, cryptographically signed Super Admin impersonation session.
   * Maximum 1 hour validity.
   */
  static async startSupportSession(params: {
    stationId: string;
    supportReason: string;
  }) {
    if (!params.supportReason || params.supportReason.trim().length < 5) {
      throw new ServiceError("A detailed support ticket / reason (min 5 chars) is mandatory for tenant impersonation.");
    }

    const admin = await requirePlatformAdmin();

    const station = await prisma.station.findUnique({
      where: { id: params.stationId },
      include: {
        users: {
          where: { active: true },
          take: 1,
        },
      },
    });

    if (!station) throw new ServiceError("Target station tenant not found.");
    const targetUser = station.users[0];
    if (!targetUser) throw new ServiceError("No active operator account available at this station.");

    const now = Math.floor(Date.now() / 1000);
    const expiresAtSec = now + IMPERSONATION_MAX_TTL_SECONDS;
    const expiresAtDate = new Date(expiresAtSec * 1000);

    // 1. Create a special DB session flagged as impersonated in metadata
    const dbSession = await prisma.session.create({
      data: {
        userId: targetUser.id,
        expiresAt: expiresAtDate,
        userAgent: `SuperAdmin-Support-Session (${admin.username})`,
      },
    });

    // 2. Sign JWT with embedded tenant claims and impersonation signature
    const token = await new SignJWT({
      sid: dbSession.id,
      sub: targetUser.id,
      tenantId: station.id,
      stationSlug: station.slug,
      role: targetUser.role,
      isImpersonated: true,
      impersonatorAdminId: admin.id,
      impersonatorUsername: admin.username,
      supportReason: params.supportReason.trim(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(expiresAtSec)
      .sign(encodedSecret);

    // 3. Record Immutable Audit Trail in PlatformAuditLog and Station AuditLog
    await prisma.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "SUPER_ADMIN_IMPERSONATION_STARTED",
        entityType: "Station",
        entityId: station.id,
        metadata: {
          stationName: station.name,
          stationSlug: station.slug,
          targetUser: targetUser.name,
          supportReason: params.supportReason.trim(),
          sessionId: dbSession.id,
          expiresAt: expiresAtDate.toISOString(),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        stationId: station.id,
        actorId: targetUser.id,
        action: "SUPER_ADMIN_IMPERSONATION_STARTED",
        entityType: "PlatformAdmin",
        entityId: admin.id,
        metadata: {
          impersonator: admin.name,
          impersonatorUsername: admin.username,
          supportReason: params.supportReason.trim(),
          maxDuration: "1 Hour",
        },
      },
    });

    // 4. Set the session cookie
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAtDate,
      path: "/",
    });

    return {
      stationName: station.name,
      stationSlug: station.slug,
      operatorName: targetUser.name,
      expiresAt: expiresAtDate,
      redirectUrl: "/dashboard",
    };
  }

  /**
   * Verifies if a given JWT token carries an active Super Admin impersonation claim.
   */
  static async verifyImpersonation(token: string): Promise<ImpersonationClaims | null> {
    try {
      const { payload } = await jwtVerify(token, encodedSecret, { algorithms: ["HS256"] });
      if (payload.isImpersonated === true) {
        return payload as unknown as ImpersonationClaims;
      }
      return null;
    } catch {
      return null;
    }
  }
}
