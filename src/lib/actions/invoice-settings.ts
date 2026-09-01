"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import fs from "node:fs/promises";
import { requireTenantDb } from "@/lib/tenant-db";
import { can, type Role } from "@/lib/permissions";
import {
  mergeInvoiceConfig,
  InvoiceSettingsSchema,
  type MergedStationInvoiceConfig,
} from "@/lib/invoice-settings";

export interface InvoiceSettingsActionState {
  error?: string;
  success?: boolean;
  config?: MergedStationInvoiceConfig;
}

export interface LogoUploadResult {
  error?: string;
  success?: boolean;
  logoUrl?: string;
}

/**
 * Self-healing schema guard: ensures optional columns & StationInvoiceSettings table exist in tenant DB.
 */
async function ensureStationInvoiceSchema(tenantDb: any) {
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
  } catch (e) {
    // Non-fatal if already present
  }
}

/**
 * Loads the current station's legal business profile and invoice settings.
 */
export async function getStationInvoiceConfigAction(): Promise<MergedStationInvoiceConfig> {
  const { prisma: tenantDb, stationId } = await requireTenantDb();

  await ensureStationInvoiceSchema(tenantDb);

  const station = await tenantDb.station.findUnique({
    where: { id: stationId },
  });

  let rawStationProfile: any = null;
  try {
    const pRows: any[] = await tenantDb.$queryRawUnsafe(
      `SELECT TOP 1 [panNo], [vatNo], [dealerCode], [logoUrl] FROM [dbo].[Station] WHERE [id] = '${stationId.replace(/'/g, "''")}'`
    );
    if (pRows && pRows.length > 0) {
      rawStationProfile = pRows[0];
    }
  } catch (e) {
    // Fallback
  }

  let settings: any = null;
  try {
    const rows: any[] = await tenantDb.$queryRawUnsafe(
      `SELECT TOP 1 * FROM [dbo].[StationInvoiceSettings] WHERE [stationId] = '${stationId.replace(/'/g, "''")}'`
    );
    if (rows && rows.length > 0) {
      settings = rows[0];
    }
  } catch (e) {
    // Fallback
  }

  return mergeInvoiceConfig(
    station
      ? {
          name: station.name,
          companyName: station.companyName,
          address: station.address,
          phone: station.phone,
          email: station.email,
          panNo: rawStationProfile?.panNo ?? (station as any).panNo ?? null,
          vatNo: rawStationProfile?.vatNo ?? (station as any).vatNo ?? null,
          dealerCode: rawStationProfile?.dealerCode ?? (station as any).dealerCode ?? null,
          logoUrl: rawStationProfile?.logoUrl ?? (station as any).logoUrl ?? null,
        }
      : null,
    settings
  );
}

/**
 * Saves updated station profile and invoice template settings.
 */
export async function updateStationInvoiceSettingsAction(
  _prev: InvoiceSettingsActionState,
  formData: FormData
): Promise<InvoiceSettingsActionState> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();

  if (
    !can(user.role as Role, "changeStationSettings" as any) &&
    user.role !== "ADMIN" &&
    (user.role as string) !== "OWNER" &&
    user.role !== "MANAGER"
  ) {
    return { error: "Only an Admin or Manager can modify station invoice settings." };
  }

  const raw = {
    // 1. Station Profile
    stationName: formData.get("stationName")?.toString() || "",
    address: formData.get("address")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    panNo: formData.get("panNo")?.toString() || "",
    vatNo: formData.get("vatNo")?.toString() || "",
    logoUrl: formData.get("logoUrl")?.toString() || undefined,
    companyName: formData.get("companyName")?.toString() || undefined,
    email: formData.get("email")?.toString() || undefined,
    dealerCode: formData.get("dealerCode")?.toString() || undefined,

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
    showCustomerPan:
      formData.get("showCustomerPan") === "true" || formData.get("showCustomerPan") === "on",
    showCustomerPhone:
      formData.get("showCustomerPhone") === "true" || formData.get("showCustomerPhone") === "on",
    showSignature:
      formData.get("showSignature") === "true" || formData.get("showSignature") === "on",
    showAmountInWords:
      formData.get("showAmountInWords") === "true" || formData.get("showAmountInWords") === "on",
    showPaymentMode:
      formData.get("showPaymentMode") === "true" || formData.get("showPaymentMode") === "on",
    showDiscount: formData.get("showDiscount") === "true" || formData.get("showDiscount") === "on",
    showQrCode: formData.get("showQrCode") === "true" || formData.get("showQrCode") === "on",
    showRate: formData.get("showRate") === "true" || formData.get("showRate") === "on",
    showLogo: formData.get("showLogo") === "true" || formData.get("showLogo") === "on",

    // 4. Styling & Texts
    primaryColor: formData.get("primaryColor")?.toString() || "#1B4D8C",
    accentColor: formData.get("accentColor")?.toString() || "#F59E0B",
    headerTitle: formData.get("headerTitle")?.toString() || "TAX INVOICE",
    footerGreeting:
      formData.get("footerGreeting")?.toString() || "Thank you for fueling with us! Safe Journey.",
    termsNotes: formData.get("termsNotes")?.toString() || undefined,
  };

  const validated = InvoiceSettingsSchema.safeParse(raw);
  if (!validated.success) {
    const err = validated.error.issues[0]?.message || "Invalid settings input";
    return { error: err };
  }

  const data = validated.data;

  try {
    await ensureStationInvoiceSchema(tenantDb);

    // Save profile changes to Station table safely
    await tenantDb.station.update({
      where: { id: stationId },
      data: {
        name: data.stationName,
        address: data.address,
        phone: data.phone || null,
        companyName: data.companyName || null,
        email: data.email || null,
      },
    });

    // Update PAN, VAT, DealerCode, LogoUrl safely via raw SQL
    await tenantDb.$executeRawUnsafe(`
      UPDATE [dbo].[Station]
      SET [panNo] = ${data.panNo ? `N'${data.panNo.replace(/'/g, "''")}'` : "NULL"},
          [vatNo] = ${data.vatNo ? `N'${data.vatNo.replace(/'/g, "''")}'` : "NULL"},
          [dealerCode] = ${data.dealerCode ? `N'${data.dealerCode.replace(/'/g, "''")}'` : "NULL"},
          [logoUrl] = ${data.logoUrl ? `N'${data.logoUrl.replace(/'/g, "''")}'` : "NULL"}
      WHERE [id] = '${stationId.replace(/'/g, "''")}'
    `);

    // Upsert StationInvoiceSettings safely
    const settingId = `inv_cfg_${stationId}`;
    await tenantDb.$executeRawUnsafe(`
      IF EXISTS (SELECT 1 FROM [dbo].[StationInvoiceSettings] WHERE [stationId] = '${stationId.replace(/'/g, "''")}')
      BEGIN
          UPDATE [dbo].[StationInvoiceSettings]
          SET [templateId] = N'${data.templateId}',
              [paperSize] = N'${data.paperSize}',
              [showPan] = ${data.showPan ? 1 : 0},
              [showVat] = ${data.showVat ? 1 : 0},
              [showVehicle] = ${data.showVehicle ? 1 : 0},
              [showHsCode] = ${data.showHsCode ? 1 : 0},
              [showCustomerAddress] = ${data.showCustomerAddress ? 1 : 0},
              [showCustomerPan] = ${data.showCustomerPan ? 1 : 0},
              [showCustomerPhone] = ${data.showCustomerPhone ? 1 : 0},
              [showSignature] = ${data.showSignature ? 1 : 0},
              [showAmountInWords] = ${data.showAmountInWords ? 1 : 0},
              [showPaymentMode] = ${data.showPaymentMode ? 1 : 0},
              [showDiscount] = ${data.showDiscount ? 1 : 0},
              [showQrCode] = ${data.showQrCode ? 1 : 0},
              [showRate] = ${data.showRate ? 1 : 0},
              [showLogo] = ${data.showLogo ? 1 : 0},
              [primaryColor] = N'${data.primaryColor.replace(/'/g, "''")}',
              [accentColor] = N'${data.accentColor.replace(/'/g, "''")}',
              [headerTitle] = N'${data.headerTitle.replace(/'/g, "''")}',
              [footerGreeting] = N'${data.footerGreeting.replace(/'/g, "''")}',
              [termsNotes] = ${data.termsNotes ? `N'${data.termsNotes.replace(/'/g, "''")}'` : "NULL"},
              [updatedAt] = CURRENT_TIMESTAMP
          WHERE [stationId] = '${stationId.replace(/'/g, "''")}';
      END
      ELSE
      BEGIN
          INSERT INTO [dbo].[StationInvoiceSettings] (
              [id], [stationId], [templateId], [paperSize],
              [showPan], [showVat], [showVehicle], [showHsCode],
              [showCustomerAddress], [showCustomerPan], [showCustomerPhone],
              [showSignature], [showAmountInWords], [showPaymentMode],
              [showDiscount], [showQrCode], [showRate], [showLogo],
              [primaryColor], [accentColor], [headerTitle], [footerGreeting], [termsNotes],
              [createdAt], [updatedAt]
          ) VALUES (
              N'${settingId}', N'${stationId.replace(/'/g, "''")}', N'${data.templateId}', N'${data.paperSize}',
              ${data.showPan ? 1 : 0}, ${data.showVat ? 1 : 0}, ${data.showVehicle ? 1 : 0}, ${data.showHsCode ? 1 : 0},
              ${data.showCustomerAddress ? 1 : 0}, ${data.showCustomerPan ? 1 : 0}, ${data.showCustomerPhone ? 1 : 0},
              ${data.showSignature ? 1 : 0}, ${data.showAmountInWords ? 1 : 0}, ${data.showPaymentMode ? 1 : 0},
              ${data.showDiscount ? 1 : 0}, ${data.showQrCode ? 1 : 0}, ${data.showRate ? 1 : 0}, ${data.showLogo ? 1 : 0},
              N'${data.primaryColor.replace(/'/g, "''")}', N'${data.accentColor.replace(/'/g, "''")}', N'${data.headerTitle.replace(/'/g, "''")}', N'${data.footerGreeting.replace(/'/g, "''")}', ${data.termsNotes ? `N'${data.termsNotes.replace(/'/g, "''")}'` : "NULL"},
              CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          );
      END
    `);

    try {
      await tenantDb.auditLog.create({
        data: {
          stationId,
          actorId: user.id,
          action: "STATION_INVOICE_SETTINGS_UPDATED",
          entityType: "Station",
          entityId: stationId,
          metadata: JSON.stringify(data),
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/settings");
    revalidatePath("/settings/invoice");
    revalidatePath("/sales");
    revalidatePath("/sales/bills");

    return {
      success: true,
      config: data as MergedStationInvoiceConfig,
    };
  } catch (err) {
    console.error("updateStationInvoiceSettingsAction error:", err);
    return { error: "Failed to save settings. Please try again." };
  }
}

/**
 * Secure Multi-Tenant Logo Uploader.
 * Derives the tenant slug and station ID solely from the authenticated session.
 */
export async function uploadStationLogoAction(formData: FormData): Promise<LogoUploadResult> {
  const { prisma: tenantDb, stationId, slug, user } = await requireTenantDb();

  if (
    user.role !== "ADMIN" &&
    user.role !== "MANAGER" &&
    (user.role as string) !== "OWNER"
  ) {
    return { error: "Only an Admin or Manager can upload a station logo." };
  }

  const file = formData.get("logoFile") as File | null;
  if (!file || !(file instanceof File)) {
    return { error: "No image file provided." };
  }

  // Max 3MB
  if (file.size > 3 * 1024 * 1024) {
    return { error: "Image size must be less than 3MB." };
  }

  // Validate allowed mime types
  const allowedMime = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowedMime.includes(file.type)) {
    return { error: "Invalid image format. Supported formats: PNG, JPG, WebP, SVG." };
  }

  try {
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

    await ensureStationInvoiceSchema(tenantDb);

    // Update station in tenant DB safely
    await tenantDb.$executeRawUnsafe(
      `UPDATE [dbo].[Station] SET [logoUrl] = N'${publicUrl.replace(/'/g, "''")}' WHERE [id] = '${stationId.replace(/'/g, "''")}'`
    );

    try {
      await tenantDb.auditLog.create({
        data: {
          stationId,
          actorId: user.id,
          action: "STATION_LOGO_UPLOADED",
          entityType: "Station",
          entityId: stationId,
          metadata: JSON.stringify({ publicUrl, fileName, fileSize: file.size }),
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/settings");
    revalidatePath("/settings/invoice");
    revalidatePath("/sales");
    revalidatePath("/sales/bills");

    return {
      success: true,
      logoUrl: publicUrl,
    };
  } catch (err) {
    console.error("uploadStationLogoAction error:", err);
    return { error: "Could not save logo file. Please try again." };
  }
}

/**
 * Remove Station Logo
 */
export async function deleteStationLogoAction(): Promise<{ success: boolean; error?: string }> {
  const { prisma: tenantDb, stationId, user } = await requireTenantDb();

  if (
    user.role !== "ADMIN" &&
    user.role !== "MANAGER" &&
    (user.role as string) !== "OWNER"
  ) {
    return { error: "Permission denied." };
  }

  try {
    await ensureStationInvoiceSchema(tenantDb);

    await tenantDb.$executeRawUnsafe(
      `UPDATE [dbo].[Station] SET [logoUrl] = NULL WHERE [id] = '${stationId.replace(/'/g, "''")}'`
    );

    try {
      await tenantDb.auditLog.create({
        data: {
          stationId,
          actorId: user.id,
          action: "STATION_LOGO_REMOVED",
          entityType: "Station",
          entityId: stationId,
        },
      });
    } catch {
      // Non-fatal
    }

    revalidatePath("/settings");
    revalidatePath("/settings/invoice");
    revalidatePath("/sales");

    return { success: true };
  } catch (err) {
    return { error: "Failed to remove logo." };
  }
}
