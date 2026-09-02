"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getMasterDb, getTenantDb, provisionTenantDatabase, invalidateTenantCache } from "@/lib/tenant-db";
import { runMigrationsForTenant, runPendingForAllTenants } from "@/lib/migrations/runner";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { createAdminSession, destroyAdminSession } from "@/lib/platform-session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { normalizeSlug, checkSlug, SLUG_PROBLEM_MESSAGE } from "@/lib/tenant";
import { normalizeUsername, checkUsername, USERNAME_PROBLEM_MESSAGE } from "@/lib/username";

const BCRYPT_ROUNDS = 10;

/** Same purpose as the tenant login's: keep a miss as slow as a hit. */
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

class PlatformError extends Error {}

/* ------------------------------------------------------------------ *
 * Operator login
 * ------------------------------------------------------------------ */

export interface AdminLoginState {
  error?: string;
}

const AdminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = AdminLoginSchema.safeParse({
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const username = normalizeUsername(parsed.data.username);
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  const rl = checkLoginRateLimit(`platform:${ip}:${username}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterSec ?? 60) / 60)} minute(s).` };
  }

  try {
    const master = getMasterDb();
    const admin = await master.platformAdmin.findUnique({ where: { username } });

    if (!admin || !admin.active) {
      await bcrypt.compare(parsed.data.password, DUMMY_HASH);
      return { error: "Invalid username or password." };
    }

    if (!(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
      return { error: "Invalid username or password." };
    }

    resetLoginRateLimit(`platform:${ip}:${username}`);
    await createAdminSession(admin.id, {
      userAgent: headerList.get("user-agent") ?? undefined,
      ipAddress: ip,
    });

    await master.platformAuditLog.create({
      data: { actorId: admin.id, action: "ADMIN_SIGNED_IN", entityType: "PlatformAdmin", entityId: admin.id },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("does not exist")) {
      return {
        error:
          "Platform database is not set up yet. Stop the dev server, run npm run db:setup:mssql from the project root, then restart.",
      };
    }
    console.error("adminLoginAction failed:", err);
    return { error: "Could not reach the platform database. Check SQL Server is running and .env settings." };
  }

  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ *
 * Onboard a tenant (Database-Per-Tenant Provisioning)
 * ------------------------------------------------------------------ */

export interface OnboardState {
  error?: string;
  message?: string;
  invitationPacket?: {
    stationName: string;
    stationSlug: string;
    databaseName?: string;
    companyName?: string;
    phone?: string;
    email?: string;
    address: string;
    adminName: string;
    adminUsername: string;
    adminPassword?: string;
    adminEmail?: string;
    adminPhone?: string;
    loginUrl: string;
    inviteText: string;
  };
}

const OnboardSchema = z.object({
  name: z.string().trim().min(2, "Enter the station/pump name").max(120),
  companyName: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(100).optional(),
  address: z.string().trim().min(2, "Enter the station address").max(200),
  registrationNo: z.string().trim().max(50).optional(),
  businessType: z.string().trim().max(50).optional(),
  panNo: z.string().trim().max(30).optional(),
  vatNo: z.string().trim().max(30).optional(),
  dealerCode: z.string().trim().max(50).optional(),
  templateId: z.enum(["A4_DETAILED", "A4_STANDARD", "THERMAL_80"]).default("A4_DETAILED"),
  paperSize: z.enum(["A4", "80MM", "58MM", "A5"]).default("A4"),
  slug: z.string().trim().min(1, "Enter a station code / ID"),
  databaseName: z.string().trim().optional(),
  ownerName: z.string().trim().min(2, "Enter the Contact Person's name").max(80),
  adminPhone: z.string().trim().max(30).optional(),
  adminEmail: z.string().trim().max(100).optional(),
  ownerUsername: z.string().trim().min(1, "Station Admin username is required"),
  ownerPassword: z.string().min(6, "Password must be at least 6 characters").max(200),
});

/**
 * Creates a dedicated SQL Server database for the station, applies DDL tables,
 * registers the tenant in FuelStationMasterDB, and creates the Station Admin account.
 */
export async function onboardStationAction(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  const admin = await requirePlatformAdmin();

  const parsed = OnboardSchema.safeParse({
    name: formData.get("name") ?? "",
    companyName: formData.get("companyName") ?? formData.get("name") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    address: formData.get("address") ?? "",
    registrationNo: formData.get("registrationNo") ?? undefined,
    businessType: formData.get("businessType") ?? undefined,
    panNo: formData.get("panNo") ?? undefined,
    vatNo: formData.get("vatNo") ?? undefined,
    dealerCode: formData.get("dealerCode") ?? undefined,
    templateId: formData.get("templateId") ?? "A4_DETAILED",
    paperSize: formData.get("paperSize") ?? "A4",
    slug: formData.get("slug") ?? "",
    databaseName: formData.get("databaseName") ?? undefined,
    ownerName: formData.get("ownerName") ?? formData.get("contactPerson") ?? formData.get("adminName") ?? "",
    adminPhone: formData.get("adminPhone") ?? formData.get("contactMobile") ?? undefined,
    adminEmail: formData.get("adminEmail") ?? formData.get("email") ?? undefined,
    ownerUsername: formData.get("ownerUsername") ?? "",
    ownerPassword: formData.get("ownerPassword") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const slug = normalizeSlug(parsed.data.slug);
  const slugProblem = checkSlug(slug);
  if (slugProblem) return { error: SLUG_PROBLEM_MESSAGE[slugProblem] };

  const ownerUsername = normalizeUsername(parsed.data.ownerUsername);
  const usernameProblem = checkUsername(ownerUsername);
  if (usernameProblem) return { error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  // Handle Logo Upload if provided in FormData
  let logoUrl: string | null = null;
  const logoFile = formData.get("logoFile") as File | null;
  if (logoFile && logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size <= 3 * 1024 * 1024) {
      try {
        const path = (await import("node:path")).default;
        const fs = (await import("node:fs/promises")).default;
        const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
        const relativeDir = path.join("uploads", "tenants", cleanSlug);
        const targetDir = path.join(process.cwd(), "public", relativeDir);
        await fs.mkdir(targetDir, { recursive: true });
        const fileName = `logo_${Date.now()}.${ext}`;
        const filePath = path.join(targetDir, fileName);
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        await fs.writeFile(filePath, buffer);
        logoUrl = `/uploads/tenants/${cleanSlug}/${fileName}`;
      } catch (err) {
        console.warn("Could not save initial logo during onboarding:", err);
      }
    }
  }

  try {
    const master = getMasterDb();
    const clash = await master.tenant.findUnique({ where: { slug } });
    if (clash) throw new PlatformError(`Station code "${slug}" is already taken.`);

    const passwordHash = await bcrypt.hash(parsed.data.ownerPassword, BCRYPT_ROUNDS);

    // Automated Database-Per-Tenant Provisioning
    const { tenant, station, adminUser, databaseName } = await provisionTenantDatabase({
      slug,
      name: parsed.data.name,
      companyName: parsed.data.companyName?.trim(),
      databaseName: parsed.data.databaseName?.trim(),
      phone: parsed.data.phone?.trim(),
      email: parsed.data.email?.trim(),
      address: parsed.data.address,
      adminName: parsed.data.ownerName,
      adminUsername: ownerUsername,
      adminPasswordHash: passwordHash,
    });

    // Update dedicated Tenant DB with initial business profile, logo & template
    try {
      const { getTenantDb } = await import("@/lib/tenant-db");
      const tenantDb = await getTenantDb(slug);
      await tenantDb.$executeRawUnsafe(
        `UPDATE [dbo].[Station] SET 
          [panNo] = ${parsed.data.panNo ? `N'${parsed.data.panNo.replace(/'/g, "''")}'` : "NULL"},
          [vatNo] = ${parsed.data.vatNo ? `N'${parsed.data.vatNo.replace(/'/g, "''")}'` : "NULL"},
          [dealerCode] = ${parsed.data.dealerCode ? `N'${parsed.data.dealerCode.replace(/'/g, "''")}'` : "NULL"},
          [logoUrl] = ${logoUrl ? `N'${logoUrl.replace(/'/g, "''")}'` : "NULL"}
        WHERE [id] = '${station.id.replace(/'/g, "''")}'`
      );

      // Create initial StationInvoiceSettings
      await tenantDb.$executeRawUnsafe(`
        IF NOT EXISTS (SELECT 1 FROM [dbo].[StationInvoiceSettings] WHERE [stationId] = '${station.id.replace(/'/g, "''")}')
        BEGIN
          INSERT INTO [dbo].[StationInvoiceSettings] (
            [id], [stationId], [showPan], [showVat], [showVehicle],
            [showCustomerAddress], [showSignature], [showAmountInWords], [paperSize], [footerGreeting]
          ) VALUES (
            'settings-${station.id}', '${station.id}',
            1, 1, 1, 1, 1, 1, '${parsed.data.paperSize}', N'Thank you for fueling with us! Safe Journey.'
          )
        END
      `);
    } catch (e) {
      console.warn("Could not set initial station settings during onboarding:", e);
    }

    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_PROVISIONED_DB_PER_TENANT",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: JSON.stringify({
          slug,
          name: station.name,
          companyName: station.companyName,
          databaseName,
          ownerUsername: adminUser.username,
          adminEmail: parsed.data.adminEmail,
        }),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/stations");

    const loginUrl = `/login?station=${station.slug}`;
    const inviteText = `=========================================
⛽ PUMP-SAAS STATION INVITATION
=========================================
Dear ${adminUser.name},

Your fuel station account and dedicated database have been provisioned on the Petrol Pump SaaS Management platform.

🏢 Station Name: ${station.name}
${station.companyName ? `📋 Company: ${station.companyName}\n` : ""}🔑 Station Code: ${station.slug}
🗄️ Database: ${databaseName}
📍 Address: ${station.address}
🌐 Login URL: ${loginUrl}

Station Admin Credentials:
👤 Username: ${adminUser.username}
🔒 Temporary Password: ${parsed.data.ownerPassword}

You can now log in to configure your tanks, nozzles, rates, and team shifts.
=========================================`;

    return {
      message: `${station.name} provisioned with isolated database [${databaseName}]. Staff sign in with code "${station.slug}".`,
      invitationPacket: {
        stationName: station.name,
        stationSlug: station.slug,
        databaseName,
        companyName: station.companyName || undefined,
        phone: station.phone || undefined,
        email: station.email || undefined,
        address: station.address,
        adminName: adminUser.name,
        adminUsername: adminUser.username,
        adminPassword: parsed.data.ownerPassword,
        adminEmail: parsed.data.adminEmail || station.email || undefined,
        adminPhone: parsed.data.adminPhone || station.phone || undefined,
        loginUrl,
        inviteText,
      },
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("onboardStationAction failed", err);
    return { error: `Could not provision station: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
}

/* ------------------------------------------------------------------ *
 * Suspend / restore a tenant
 * ------------------------------------------------------------------ */

export interface SuspendState {
  error?: string;
  message?: string;
}

export async function setStationSuspendedAction(_prev: SuspendState, formData: FormData): Promise<SuspendState> {
  const admin = await requirePlatformAdmin();

  const stationId = String(formData.get("stationId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!stationId) return { error: "Missing station." };
  if (suspend && reason.length < 3) {
    return { error: "Give a reason for the suspension — it goes on the platform audit trail." };
  }

  try {
    const master = getMasterDb();
    const tenant = await master.tenant.findUnique({ where: { id: stationId } });
    if (!tenant) throw new PlatformError("That station doesn't exist.");

    const alreadySuspended = tenant.status === "SUSPENDED";
    if (alreadySuspended === suspend) {
      throw new PlatformError(`${tenant.name} is already ${suspend ? "suspended" : "active"}.`);
    }

    await master.tenant.update({
      where: { id: tenant.id },
      data: suspend
        ? { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: reason }
        : { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    });

    // Invalidate memory cache
    invalidateTenantCache(tenant.slug);

    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: suspend ? "STATION_SUSPENDED" : "STATION_RESTORED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: JSON.stringify({ name: tenant.name, slug: tenant.slug, reason: suspend ? reason : null }),
      },
    });

    revalidatePath("/admin");
    return {
      message: suspend
        ? `${tenant.name} suspended.`
        : `${tenant.name} restored. Staff can sign in again.`,
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("setStationSuspendedAction failed", err);
    return { error: "Could not update the station. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Super Admin: Update Station Profile & Database Config
 * ------------------------------------------------------------------ */

export interface UpdateStationProfileState {
  error?: string;
  message?: string;
}

const UpdateStationProfileSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Station name is required").max(120),
  companyName: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(100).optional(),
  address: z.string().trim().min(2, "Address is required").max(200),
});

export async function updateStationProfileAdminAction(
  _prev: UpdateStationProfileState,
  formData: FormData
): Promise<UpdateStationProfileState> {
  const admin = await requirePlatformAdmin();

  const parsed = UpdateStationProfileSchema.safeParse({
    slug: formData.get("slug") ?? "",
    name: formData.get("name") ?? "",
    companyName: formData.get("companyName") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, name, companyName, phone, email, address } = parsed.data;

  try {
    const master = getMasterDb();
    const tenant = await master.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new PlatformError(`Station "${slug}" not found.`);

    // 1. Update Master DB Tenant Registry
    //
    // databaseName is deliberately NOT editable here: it's the routing key
    // getTenantDb() uses to build the connection string, and this action
    // never renames the physical SQL Server database to match. Letting an
    // admin retype it would silently repoint the tenant at a database that
    // doesn't exist (or someone else's), locking the station out. Moving a
    // tenant to a different database is a migration, not a form field.
    await master.tenant.update({
      where: { slug },
      data: {
        name,
        companyName: companyName?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address,
      },
    });

    invalidateTenantCache(slug);

    // 2. Update Station table inside dedicated tenant database
    try {
      const tenantDb = await getTenantDb(slug);
      await tenantDb.station.updateMany({
        where: { slug },
        data: {
          name,
          companyName: companyName?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          address,
        },
      });
    } catch (dbErr) {
      console.warn("Could not update Station record in dedicated DB:", dbErr);
    }

    // 3. Audit Log
    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_PROFILE_UPDATED",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: JSON.stringify({ slug, name }),
      },
    });

    revalidatePath(`/admin/stations/${slug}`);
    revalidatePath("/admin");
    return { message: `Station details for "${name}" updated successfully.` };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("updateStationProfileAdminAction failed", err);
    return { error: "Failed to update station details. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Super Admin: Update / Reset Station Admin Credentials
 * ------------------------------------------------------------------ */

export interface StationAdminCredentialState {
  error?: string;
  message?: string;
}

const UpdateAdminCredentialSchema = z.object({
  slug: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  name: z.string().trim().min(2, "Full name is required").max(80),
  username: z.string().trim().min(1, "Username is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  active: z.enum(["true", "false"]).optional(),
  reason: z.string().trim().min(3, "Give a reason for this account recovery — it goes on the audit trail."),
});

export async function updateStationAdminCredentialsAction(
  _prev: StationAdminCredentialState,
  formData: FormData
): Promise<StationAdminCredentialState> {
  const admin = await requirePlatformAdmin();

  const parsed = UpdateAdminCredentialSchema.safeParse({
    slug: formData.get("slug") ?? "",
    userId: formData.get("userId") ?? "",
    name: formData.get("name") ?? "",
    username: formData.get("username") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    active: formData.get("active") ?? "true",
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, userId, name, username, newPassword, active, reason } = parsed.data;
  const cleanUsername = normalizeUsername(username);
  const usernameProblem = checkUsername(cleanUsername);
  if (usernameProblem) return { error: USERNAME_PROBLEM_MESSAGE[usernameProblem] };

  try {
    const tenantDb = await getTenantDb(slug);
    const existingUser = await tenantDb.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new PlatformError("User account not found in station database.");
    }

    // Platform admin support access is scoped to account recovery for the
    // station owner — not a general-purpose way to reach into any staff
    // member's login. Ordinary attendants/managers are the owner's own
    // account to manage from inside the station (Staff & Attendants).
    if (existingUser.role !== "OWNER") {
      throw new PlatformError(
        "Platform admin can only reset the station Owner's credentials. Other staff accounts are managed by the station owner."
      );
    }

    // Check username clash if changed
    if (cleanUsername !== existingUser.username) {
      const clash = await tenantDb.user.findUnique({
        where: { stationId_username: { stationId: existingUser.stationId, username: cleanUsername } },
      });
      if (clash && clash.id !== userId) {
        throw new PlatformError(`Username "${cleanUsername}" is already taken at this station.`);
      }
    }

    const updateData: { name: string; username: string; active: boolean; passwordHash?: string } = {
      name,
      username: cleanUsername,
      active: active === "true",
    };

    if (newPassword && newPassword.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), BCRYPT_ROUNDS);
      // Revoke existing active sessions so user logs in with new password
      await tenantDb.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const updated = await tenantDb.user.update({
      where: { id: userId },
      data: updateData,
    });

    const master = getMasterDb();
    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_ADMIN_CREDENTIALS_RESET",
        entityType: "User",
        entityId: updated.id,
        metadata: JSON.stringify({
          stationSlug: slug,
          username: cleanUsername,
          passwordChanged: !!newPassword,
          reason,
        }),
      },
    });

    revalidatePath(`/admin/stations/${slug}`);
    return {
      message: `Account credentials for @${cleanUsername} (${name}) updated successfully.${
        newPassword ? " New password is active." : ""
      }`,
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("updateStationAdminCredentialsAction failed", err);
    return { error: "Failed to update staff credentials. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Super Admin: Edit a staff member's profile details (support use)
 *
 * Deliberately narrower than credential recovery above: this never touches
 * username, password, or active status — just the contact/identity fields a
 * support agent might reasonably need to correct (a mistyped phone number,
 * a changed employee ID). Available for any staff member, not just the
 * Owner, because there's no login-security exposure in fixing a phone
 * number the way there is in resetting a password.
 * ------------------------------------------------------------------ */

export interface StationStaffProfileState {
  error?: string;
  message?: string;
}

const UpdateStaffProfileSchema = z.object({
  slug: z.string().trim().min(1),
  userId: z.string().trim().min(1),
  name: z.string().trim().min(2, "Full name is required").max(80),
  employeeId: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().max(100).optional(),
});

export async function updateStationStaffProfileAdminAction(
  _prev: StationStaffProfileState,
  formData: FormData
): Promise<StationStaffProfileState> {
  const admin = await requirePlatformAdmin();

  const parsed = UpdateStaffProfileSchema.safeParse({
    slug: formData.get("slug") ?? "",
    userId: formData.get("userId") ?? "",
    name: formData.get("name") ?? "",
    employeeId: formData.get("employeeId") ?? undefined,
    phone: formData.get("phone") ?? undefined,
    email: formData.get("email") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { slug, userId, name, employeeId, phone, email } = parsed.data;

  try {
    const tenantDb = await getTenantDb(slug);
    const existingUser = await tenantDb.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new PlatformError("User account not found in station database.");
    }

    const updated = await tenantDb.user.update({
      where: { id: userId },
      data: {
        name,
        employeeId: employeeId?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
    });

    const master = getMasterDb();
    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_STAFF_PROFILE_UPDATED",
        entityType: "User",
        entityId: updated.id,
        metadata: JSON.stringify({ stationSlug: slug, name }),
      },
    });

    revalidatePath(`/admin/stations/${slug}`);
    return { message: `Details for ${name} updated successfully.` };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("updateStationStaffProfileAdminAction failed", err);
    return { error: "Failed to update staff details. Please try again." };
  }
}

/* ------------------------------------------------------------------ *
 * Super Admin: Manage Station Invoice Template & Logo
 * ------------------------------------------------------------------ */

export interface StationInvoiceAdminState {
  error?: string;
  message?: string;
  config?: any;
}

export async function updateStationInvoiceByAdminAction(
  _prev: StationInvoiceAdminState,
  formData: FormData
): Promise<StationInvoiceAdminState> {
  const admin = await requirePlatformAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing station slug." };

  const raw = {
    stationName: formData.get("stationName")?.toString() || "",
    companyName: formData.get("companyName")?.toString() || undefined,
    address: formData.get("address")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    email: formData.get("email")?.toString() || undefined,
    panNo: formData.get("panNo")?.toString() || "",
    vatNo: formData.get("vatNo")?.toString() || "",
    dealerCode: formData.get("dealerCode")?.toString() || undefined,
    logoUrl: formData.get("logoUrl")?.toString() || undefined,

    // 2. Invoice Template Selection
    templateId: formData.get("templateId")?.toString() || "A4_DETAILED",
    paperSize: formData.get("paperSize")?.toString() || "A4",

    // 3. Field Visibility Toggles
    showPan: formData.get("showPan") === "true" || formData.get("showPan") === "on",
    showVat: formData.get("showVat") === "true" || formData.get("showVat") === "on",
    showVehicle: formData.get("showVehicle") === "true" || formData.get("showVehicle") === "on",
    showHsCode: formData.get("showHsCode") === "true" || formData.get("showHsCode") === "on",
    showCustomerAddress:
      formData.get("showCustomerAddress") === "true" || formData.get("showCustomerAddress") === "on",
    showAmountInWords:
      formData.get("showAmountInWords") === "true" || formData.get("showAmountInWords") === "on",
    showSignature:
      formData.get("showSignature") === "true" || formData.get("showSignature") === "on",
    showLogo: formData.get("showLogo") === "true" || formData.get("showLogo") === "on",
    footerGreeting: formData.get("footerGreeting")?.toString() || "Thank you for fueling with us! Safe Journey.",
  };

  const { InvoiceSettingsSchema, mergeInvoiceConfig } = await import("@/lib/invoice-settings");
  const parsed = InvoiceSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid settings input." };
  }

  const data = parsed.data;

  try {
    const master = getMasterDb();
    const tenant = await master.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new PlatformError("Tenant not found.");

    // 1. Update Master DB Tenant metadata
    await master.tenant.update({
      where: { slug },
      data: {
        name: data.stationName,
        companyName: data.companyName || null,
        address: data.address,
        phone: data.phone || null,
        email: data.email || null,
      },
    });

    // 2. Update dedicated Tenant DB
    const tenantDb = await getTenantDb(slug);

    // Auto-heal schema if columns or table are missing in older tenant database
    try {
      await tenantDb.$executeRawUnsafe(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'panNo')
        BEGIN
            ALTER TABLE [dbo].[Station] ADD [panNo] NVARCHAR(1000) NULL;
        END;
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'vatNo')
        BEGIN
            ALTER TABLE [dbo].[Station] ADD [vatNo] NVARCHAR(1000) NULL;
        END;
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'dealerCode')
        BEGIN
            ALTER TABLE [dbo].[Station] ADD [dealerCode] NVARCHAR(1000) NULL;
        END;
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Station' AND COLUMN_NAME = 'logoUrl')
        BEGIN
            ALTER TABLE [dbo].[Station] ADD [logoUrl] NVARCHAR(MAX) NULL;
        END;

        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StationInvoiceSettings')
        BEGIN
            CREATE TABLE [dbo].[StationInvoiceSettings] (
                [id] NVARCHAR(1000) NOT NULL PRIMARY KEY,
                [stationId] NVARCHAR(1000) NOT NULL UNIQUE,
                [showPan] BIT NOT NULL DEFAULT 1,
                [showVat] BIT NOT NULL DEFAULT 1,
                [showVehicle] BIT NOT NULL DEFAULT 1,
                [showCustomerAddress] BIT NOT NULL DEFAULT 1,
                [showCustomerPan] BIT NOT NULL DEFAULT 1,
                [showCustomerPhone] BIT NOT NULL DEFAULT 1,
                [showSignature] BIT NOT NULL DEFAULT 1,
                [showAmountInWords] BIT NOT NULL DEFAULT 1,
                [showPaymentMode] BIT NOT NULL DEFAULT 1,
                [showDiscount] BIT NOT NULL DEFAULT 1,
                [showQrCode] BIT NOT NULL DEFAULT 1,
                [showRate] BIT NOT NULL DEFAULT 1,
                [primaryColor] NVARCHAR(100) NOT NULL DEFAULT '#1B4D8C',
                [accentColor] NVARCHAR(100) NOT NULL DEFAULT '#F59E0B',
                [paperSize] NVARCHAR(50) NOT NULL DEFAULT 'A4',
                [headerTitle] NVARCHAR(200) NOT NULL DEFAULT 'TAX INVOICE',
                [footerGreeting] NVARCHAR(500) NOT NULL DEFAULT 'Thank you for fueling with us! Safe Journey.',
                [termsNotes] NVARCHAR(1000) NULL,
                [createdAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP,
                [updatedAt] DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        END;
      `);
    } catch {
      // Non-fatal
    }

    let station = await tenantDb.station.findUnique({ where: { slug } });
    if (!station) {
      station = await tenantDb.station.findFirst();
    }

    if (station) {
      // Update Station record
      try {
        await tenantDb.station.update({
          where: { id: station.id },
          data: {
            name: data.stationName,
            companyName: data.companyName || null,
            address: data.address,
            phone: data.phone || null,
            email: data.email || null,
            panNo: data.panNo || null,
            vatNo: data.vatNo || null,
            dealerCode: data.dealerCode || null,
            logoUrl: data.logoUrl || null,
          } as any,
        });
      } catch {
        await tenantDb.$executeRawUnsafe(
          `UPDATE [dbo].[Station] SET 
            [name] = N'${data.stationName.replace(/'/g, "''")}',
            [companyName] = ${data.companyName ? `N'${data.companyName.replace(/'/g, "''")}'` : "NULL"},
            [address] = N'${data.address.replace(/'/g, "''")}',
            [phone] = ${data.phone ? `N'${data.phone.replace(/'/g, "''")}'` : "NULL"},
            [email] = ${data.email ? `N'${data.email.replace(/'/g, "''")}'` : "NULL"},
            [panNo] = ${data.panNo ? `N'${data.panNo.replace(/'/g, "''")}'` : "NULL"},
            [vatNo] = ${data.vatNo ? `N'${data.vatNo.replace(/'/g, "''")}'` : "NULL"},
            [dealerCode] = ${data.dealerCode ? `N'${data.dealerCode.replace(/'/g, "''")}'` : "NULL"},
            [logoUrl] = ${data.logoUrl ? `N'${data.logoUrl.replace(/'/g, "''")}'` : "NULL"}
          WHERE [id] = '${station.id.replace(/'/g, "''")}'`
        );
      }

      // Upsert StationInvoiceSettings
      await tenantDb.$executeRawUnsafe(`
        IF EXISTS (SELECT 1 FROM [dbo].[StationInvoiceSettings] WHERE [stationId] = '${station.id.replace(/'/g, "''")}')
        BEGIN
          UPDATE [dbo].[StationInvoiceSettings] SET
            [showPan] = ${data.showPan ? 1 : 0},
            [showVat] = ${data.showVat ? 1 : 0},
            [showVehicle] = ${data.showVehicle ? 1 : 0},
            [showCustomerAddress] = ${data.showCustomerAddress ? 1 : 0},
            [showSignature] = ${data.showSignature ? 1 : 0},
            [showAmountInWords] = ${data.showAmountInWords ? 1 : 0},
            [paperSize] = '${data.paperSize}',
            [footerGreeting] = N'${data.footerGreeting.replace(/'/g, "''")}',
            [updatedAt] = CURRENT_TIMESTAMP
          WHERE [stationId] = '${station.id.replace(/'/g, "''")}'
        END
        ELSE
        BEGIN
          INSERT INTO [dbo].[StationInvoiceSettings] (
            [id], [stationId], [showPan], [showVat],
            [showVehicle], [showCustomerAddress],
            [showSignature], [showAmountInWords], [paperSize], [footerGreeting]
          ) VALUES (
            'settings-${station.id}', '${station.id}',
            ${data.showPan ? 1 : 0}, ${data.showVat ? 1 : 0}, ${data.showVehicle ? 1 : 0},
            ${data.showCustomerAddress ? 1 : 0},
            ${data.showSignature ? 1 : 0},
            ${data.showAmountInWords ? 1 : 0},
            '${data.paperSize}',
            N'${data.footerGreeting.replace(/'/g, "''")}'
          )
        END
      `);
    }

    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_INVOICE_CONFIG_UPDATED_BY_ADMIN",
        entityType: "Tenant",
        entityId: tenant.id,
        metadata: JSON.stringify({ slug, stationName: data.stationName, paperSize: data.paperSize }),
      },
    });

    invalidateTenantCache(slug);
    revalidatePath(`/admin/stations/${slug}`);
    revalidatePath("/settings/invoice");
    revalidatePath("/sales");

    return {
      message: `Invoice settings and branding for "${data.stationName}" updated successfully by Super Admin.`,
      config: mergeInvoiceConfig(
        {
          name: data.stationName,
          companyName: data.companyName,
          address: data.address,
          phone: data.phone,
          email: data.email,
          panNo: data.panNo,
          vatNo: data.vatNo,
          dealerCode: data.dealerCode,
          logoUrl: data.logoUrl,
        },
        data
      ),
    };
  } catch (err) {
    if (err instanceof PlatformError) return { error: err.message };
    console.error("updateStationInvoiceByAdminAction failed:", err);
    return { error: `Failed to update invoice configuration: ${err instanceof Error ? err.message : "Database error"}` };
  }
}

export async function uploadStationLogoByAdminAction(formData: FormData): Promise<{ error?: string; logoUrl?: string; message?: string }> {
  const admin = await requirePlatformAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing station slug." };

  const file = formData.get("logoFile") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No image file provided." };
  }

  if (file.size > 3 * 1024 * 1024) {
    return { error: "Image size must be less than 3MB." };
  }

  const allowedMime = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedMime.includes(file.type)) {
    return { error: "Invalid image format. Supported formats: PNG, JPG, WebP, SVG." };
  }

  try {
    const path = (await import("node:path")).default;
    const fs = (await import("node:fs/promises")).default;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const relativeDir = path.join("uploads", "tenants", cleanSlug);
    const targetDir = path.join(process.cwd(), "public", relativeDir);

    await fs.mkdir(targetDir, { recursive: true });

    const fileName = `logo_${Date.now()}.${ext}`;
    const filePath = path.join(targetDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);
    const publicUrl = `/uploads/tenants/${cleanSlug}/${fileName}`;

    // Update in tenant DB
    const tenantDb = await getTenantDb(slug);
    const station = await tenantDb.station.findUnique({ where: { slug } });
    if (station) {
      await tenantDb.$executeRawUnsafe(
        `UPDATE [dbo].[Station] SET [logoUrl] = N'${publicUrl.replace(/'/g, "''")}' WHERE [id] = '${station.id.replace(/'/g, "''")}'`
      );
    }

    const master = getMasterDb();
    await master.platformAuditLog.create({
      data: {
        actorId: admin.id,
        action: "STATION_LOGO_UPLOADED_BY_ADMIN",
        entityType: "Tenant",
        entityId: slug,
        metadata: JSON.stringify({ publicUrl, fileName }),
      },
    });

    revalidatePath(`/admin/stations/${slug}`);
    revalidatePath("/settings/invoice");
    revalidatePath("/sales");

    return { logoUrl: publicUrl, message: "Station logo uploaded successfully by Super Admin." };
  } catch (err) {
    console.error("uploadStationLogoByAdminAction failed:", err);
    return { error: "Failed to upload logo." };
  }
}

/* ------------------------------------------------------------------ *
 * Super Admin: Tenant database migrations
 *
 * The admin panel is for visibility and controlled recovery, not the
 * normal mechanism — a real deploy runs `npm run db:migrate:tenants`
 * (scripts/migrate-tenants.ts) as its own pipeline step. These two actions
 * exist for the "Retry" on one failed tenant and the explicit, secondary
 * "Run Pending Migrations" emergency path.
 * ------------------------------------------------------------------ */

export interface MigrationRunState {
  error?: string;
  message?: string;
}

export async function retryTenantMigrationAction(
  _prev: MigrationRunState,
  formData: FormData
): Promise<MigrationRunState> {
  const admin = await requirePlatformAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return { error: "Missing station." };

  const result = await runMigrationsForTenant(slug);

  await getMasterDb().platformAuditLog.create({
    data: {
      actorId: admin.id,
      action: "TENANT_MIGRATION_RETRY",
      entityType: "Tenant",
      entityId: slug,
      metadata: JSON.stringify(result),
    },
  });

  revalidatePath("/admin/settings/database");

  if (result.status === "failed") return { error: `Migration failed for ${slug}: ${result.error}` };
  return {
    message:
      result.status === "up-to-date"
        ? `${slug} is already up to date.`
        : `${slug} migrated: applied ${result.appliedIds.join(", ")}.`,
  };
}

export async function runPendingMigrationsAction(
  _prev: MigrationRunState,
  _formData: FormData
): Promise<MigrationRunState> {
  const admin = await requirePlatformAdmin();
  const results = await runPendingForAllTenants();

  await getMasterDb().platformAuditLog.create({
    data: {
      actorId: admin.id,
      action: "TENANT_MIGRATIONS_RUN_ALL",
      entityType: "Tenant",
      entityId: "ALL",
      metadata: JSON.stringify(results),
    },
  });

  revalidatePath("/admin/settings/database");

  const failed = results.filter((r) => r.status === "failed");
  if (failed.length > 0) {
    return { error: `${failed.length} of ${results.length} tenant(s) failed: ${failed.map((f) => f.slug).join(", ")}.` };
  }
  const migrated = results.filter((r) => r.status === "migrated").length;
  return {
    message:
      migrated > 0
        ? `${migrated} tenant(s) migrated, ${results.length - migrated} already up to date.`
        : "Every tenant is already up to date.",
  };
}

