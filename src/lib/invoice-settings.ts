import { z } from "zod";

export type TemplateId = "A4_DETAILED" | "A4_STANDARD" | "THERMAL_80";
export type PaperSize = "A4" | "80MM" | "58MM" | "A5";

export interface StationBusinessProfile {
  name: string;
  address: string;
  phone: string;
  panNo: string;
  vatNo: string;
  logoUrl?: string | null;
  companyName?: string | null;
  email?: string | null;
  dealerCode?: string | null;
}

export interface StationInvoiceSettings {
  templateId: TemplateId;
  paperSize: PaperSize;
  showPan: boolean;
  showVat: boolean;
  showVehicle: boolean;
  showHsCode: boolean;
  showCustomerAddress: boolean;
  showAmountInWords: boolean;
  showSignature: boolean;
  showLogo: boolean;
  footerGreeting: string;
}

export interface MergedStationInvoiceConfig extends StationBusinessProfile, StationInvoiceSettings {
  // Legacy / convenience flattened aliases
  stationName: string;
}

export interface InvoiceTemplateOption {
  id: TemplateId;
  name: string;
  type: "A4" | "THERMAL";
  description: string;
  badge: string;
  defaultPaperSize: PaperSize;
}

export const INVOICE_TEMPLATES: InvoiceTemplateOption[] = [
  {
    id: "A4_DETAILED",
    name: "A4 Detailed (Tax Invoice)",
    type: "A4",
    description: "Official Nepal IRD layout with 2-column party box, HS code column, amount in words, and dual authorized signatures.",
    badge: "Official Tax Standard",
    defaultPaperSize: "A4",
  },
  {
    id: "A4_STANDARD",
    name: "A4 Standard (Minimalist)",
    type: "A4",
    description: "Clean modern corporate bill with streamlined items table, party details, and VAT summary.",
    badge: "Corporate & Fleet",
    defaultPaperSize: "A4",
  },
  {
    id: "THERMAL_80",
    name: "Thermal 80mm (Forecourt Slip)",
    type: "THERMAL",
    description: "High-density thermal receipt for continuous pump roll printers with auto-wrapping.",
    badge: "Pump POS Printer",
    defaultPaperSize: "80MM",
  },
];

export const DEFAULT_BUSINESS_PROFILE: StationBusinessProfile = {
  name: "Three Brothers Oil Store",
  address: "New Baneshwor-31, Kathmandu",
  phone: "01-4797257",
  panNo: "300066034",
  vatNo: "300066034",
  logoUrl: null,
  companyName: "Three Brothers Oil Store Pvt. Ltd.",
  email: "info@threebrothers.com.np",
  dealerCode: "KTM-DEALER-4091",
};

export const DEFAULT_INVOICE_SETTINGS: StationInvoiceSettings = {
  templateId: "A4_DETAILED",
  paperSize: "A4",
  showPan: true,
  showVat: true,
  showVehicle: true,
  showHsCode: true,
  showCustomerAddress: true,
  showAmountInWords: true,
  showSignature: true,
  showLogo: true,
  footerGreeting: "Thank you for fueling with us! Safe Journey.",
};

export const InvoiceSettingsSchema = z.object({
  // 1. Station Profile
  stationName: z.string().trim().min(2, "Station name must be at least 2 characters"),
  address: z.string().trim().min(3, "Address is required"),
  phone: z.string().trim().min(2, "Phone number is required"),
  panNo: z.string().trim().optional().default(""),
  vatNo: z.string().trim().optional().default(""),
  logoUrl: z.string().trim().optional().nullable(),
  companyName: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  dealerCode: z.string().trim().optional().nullable(),

  // 2. Invoice Template Selection
  templateId: z.enum(["A4_DETAILED", "A4_STANDARD", "THERMAL_80"]).default("A4_DETAILED"),
  paperSize: z.enum(["A4", "80MM", "58MM", "A5"]).default("A4"),

  // 3. Optional Invoice Field Toggles
  showPan: z.boolean().default(true),
  showVat: z.boolean().default(true),
  showVehicle: z.boolean().default(true),
  showHsCode: z.boolean().default(true),
  showCustomerAddress: z.boolean().default(true),
  showAmountInWords: z.boolean().default(true),
  showSignature: z.boolean().default(true),
  showLogo: z.boolean().default(true),
  footerGreeting: z.string().trim().default("Thank you for fueling with us! Safe Journey."),
});

export function mergeInvoiceConfig(
  stationProfile: Partial<StationBusinessProfile> | null | undefined,
  settings: Partial<StationInvoiceSettings> | null | undefined
): MergedStationInvoiceConfig {
  const profName = stationProfile?.name || DEFAULT_BUSINESS_PROFILE.name;
  const tId: TemplateId = (settings?.templateId as TemplateId) || (settings?.paperSize === "80MM" || settings?.paperSize === "58MM" ? "THERMAL_80" : "A4_DETAILED");

  return {
    // 1. Profile
    stationName: profName,
    name: profName,
    companyName: stationProfile?.companyName ?? DEFAULT_BUSINESS_PROFILE.companyName,
    address: stationProfile?.address || DEFAULT_BUSINESS_PROFILE.address,
    phone: stationProfile?.phone || DEFAULT_BUSINESS_PROFILE.phone,
    email: stationProfile?.email ?? DEFAULT_BUSINESS_PROFILE.email,
    panNo: stationProfile?.panNo ?? DEFAULT_BUSINESS_PROFILE.panNo,
    vatNo: stationProfile?.vatNo ?? DEFAULT_BUSINESS_PROFILE.vatNo,
    dealerCode: stationProfile?.dealerCode ?? DEFAULT_BUSINESS_PROFILE.dealerCode,
    logoUrl: stationProfile?.logoUrl ?? null,

    // 2. Template
    templateId: tId,
    paperSize: (settings?.paperSize as PaperSize) || (tId === "THERMAL_80" ? "80MM" : "A4"),

    // 3. Optional Field Toggles
    showPan: settings?.showPan !== undefined ? Boolean(settings.showPan) : true,
    showVat: settings?.showVat !== undefined ? Boolean(settings.showVat) : true,
    showVehicle: settings?.showVehicle !== undefined ? Boolean(settings.showVehicle) : true,
    showHsCode: settings?.showHsCode !== undefined ? Boolean(settings.showHsCode) : true,
    showCustomerAddress: settings?.showCustomerAddress !== undefined ? Boolean(settings.showCustomerAddress) : true,
    showAmountInWords: settings?.showAmountInWords !== undefined ? Boolean(settings.showAmountInWords) : true,
    showSignature: settings?.showSignature !== undefined ? Boolean(settings.showSignature) : true,
    showLogo: settings?.showLogo !== undefined ? Boolean(settings.showLogo) : true,
    footerGreeting: settings?.footerGreeting || DEFAULT_INVOICE_SETTINGS.footerGreeting,
  };
}
