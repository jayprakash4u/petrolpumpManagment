import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getMasterDb, getTenantDb } from "@/lib/tenant-db";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim();

    if (!slug) {
      return NextResponse.json({ error: "Missing station slug." }, { status: 400 });
    }

    const master = getMasterDb();
    const tenant = await master.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: `Station "${slug}" not found.` }, { status: 404 });
    }

    if (tenant.status === "SUSPENDED") {
      return NextResponse.json(
        { error: `Station "${tenant.name}" is suspended. Activate it first before logging in.` },
        { status: 403 }
      );
    }

    const tenantDb = await getTenantDb(slug);
    // Find OWNER or primary active user for this station
    let user = await tenantDb.user.findFirst({
      where: { role: "OWNER", active: true },
    });
    if (!user) {
      user = await tenantDb.user.findFirst({
        where: { active: true },
        orderBy: { role: "asc" },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: `No active user accounts found for station "${tenant.name}".` },
        { status: 404 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const userAgent = req.headers.get("user-agent") || "Platform Admin Support";

    // Create session in tenant DB and set signed fsm_session cookie
    await createSession(user.id, slug, {
      userAgent: `[SUPPORT IMPERSONATION by @${admin.username}] ${userAgent}`,
      ipAddress: ip,
    });

    // Record in Platform Audit Log
    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_ADMIN_IMPERSONATION_STARTED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: JSON.stringify({
          stationSlug: slug,
          stationName: tenant.name,
          impersonatedUserId: user.id,
          impersonatedUsername: user.username,
          impersonatedRole: user.role,
        }),
      },
    });

    // Redirect to station dashboard / sales console
    const redirectUrl = new URL("/sales", req.url);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("GET /api/admin/impersonate failed:", err);
    return NextResponse.json(
      { error: "Could not log into station. Please ensure platform session is active." },
      { status: 500 }
    );
  }
}
