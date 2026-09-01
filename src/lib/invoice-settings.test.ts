import { describe, it, expect } from "vitest";
import {
  mergeInvoiceConfig,
  DEFAULT_BUSINESS_PROFILE,
  DEFAULT_INVOICE_SETTINGS,
  InvoiceSettingsSchema,
  INVOICE_TEMPLATES,
} from "./invoice-settings";

describe("Invoice Settings Configuration & Merge (3-Concept Architecture)", () => {
  it("uses default values when no DB profile or settings are passed", () => {
    const config = mergeInvoiceConfig(null, null);

    expect(config.name).toBe(DEFAULT_BUSINESS_PROFILE.name);
    expect(config.panNo).toBe(DEFAULT_BUSINESS_PROFILE.panNo);
    expect(config.templateId).toBe("A4_DETAILED");
    expect(config.paperSize).toBe(DEFAULT_INVOICE_SETTINGS.paperSize);
    expect(config.showPan).toBe(true);
    expect(config.showVehicle).toBe(true);
    expect(config.showHsCode).toBe(true);
  });

  it("merges custom station profile, template choice, and field toggles correctly", () => {
    const config = mergeInvoiceConfig(
      {
        name: "Three Brothers Oil Store",
        address: "New Baneshwor, Kathmandu",
        panNo: "300066034",
        vatNo: "300066034",
        phone: "01-4797257",
        logoUrl: "https://example.com/three-brothers.png",
      },
      {
        templateId: "A4_DETAILED",
        paperSize: "A4",
        showPan: true,
        showVat: true,
        showVehicle: true,
        showHsCode: true,
        showCustomerAddress: false,
      }
    );

    expect(config.name).toBe("Three Brothers Oil Store");
    expect(config.address).toBe("New Baneshwor, Kathmandu");
    expect(config.panNo).toBe("300066034");
    expect(config.vatNo).toBe("300066034");
    expect(config.logoUrl).toBe("https://example.com/three-brothers.png");

    expect(config.templateId).toBe("A4_DETAILED");
    expect(config.paperSize).toBe("A4");
    expect(config.showPan).toBe(true);
    expect(config.showVehicle).toBe(true);
    expect(config.showHsCode).toBe(true);
    expect(config.showCustomerAddress).toBe(false);
  });

  it("validates form data correctly using InvoiceSettingsSchema", () => {
    const validData = {
      stationName: "ABC Petroleum",
      address: "Kalanki, Kathmandu",
      phone: "01-5234567",
      panNo: "300066034",
      vatNo: "300066034",
      templateId: "A4_DETAILED",
      paperSize: "A4",
      showPan: true,
      showVat: true,
      showVehicle: true,
      showHsCode: true,
      showCustomerAddress: true,
    };

    const parsed = InvoiceSettingsSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.stationName).toBe("ABC Petroleum");
      expect(parsed.data.templateId).toBe("A4_DETAILED");
    }
  });

  it("has exactly 3 curated master templates", () => {
    expect(INVOICE_TEMPLATES.length).toBe(3);
    const ids = INVOICE_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("A4_DETAILED");
    expect(ids).toContain("A4_STANDARD");
    expect(ids).toContain("THERMAL_80");
  });
});
