import { describe, it, expect, beforeEach } from "vitest";
import {
  STATION_ROLES,
  PERMISSION_DEFINITIONS,
  getPermissionsMatrix,
  updatePermissionRoles,
  resetPermissionsToDefault,
  getRoleActivePermissions,
} from "./access";

describe("Access Level Management Unit Tests", () => {
  beforeEach(() => {
    resetPermissionsToDefault();
  });

  it("lists one station role — Pump Admin — with full access", () => {
    expect(STATION_ROLES.length).toBe(1);
    expect(STATION_ROLES[0].role).toBe("OWNER");
    expect(STATION_ROLES[0].name).toBe("Pump Admin");
  });

  it("lists all defined station capabilities across categories", () => {
    expect(PERMISSION_DEFINITIONS.length).toBe(20);
    const categories = new Set(PERMISSION_DEFINITIONS.map((p) => p.category));
    expect(categories.has("Sales & Cash")).toBe(true);
    expect(categories.has("Pumps & Forecourt")).toBe(true);
    expect(categories.has("Stock & Pricing")).toBe(true);
    expect(categories.has("Expenses & Accounts")).toBe(true);
    expect(categories.has("Operations & Admin")).toBe(true);
  });

  it("gives the one role every capability there is", () => {
    const ownerPerms = getRoleActivePermissions("OWNER");
    expect(ownerPerms.length).toBe(20);
    expect(ownerPerms.map((p) => p.key)).toContain("recordSale");
    expect(ownerPerms.map((p) => p.key)).toContain("viewPumps");
    expect(ownerPerms.map((p) => p.key)).toContain("recordMeterReadings");
    expect(ownerPerms.map((p) => p.key)).toContain("manageUsers");
    expect(ownerPerms.map((p) => p.key)).toContain("viewExpenses");
    expect(ownerPerms.map((p) => p.key)).toContain("manageExpenses");
    expect(ownerPerms.map((p) => p.key)).toContain("viewReports");
  });

  it("keeps the Owner-manageUsers safety guard even though Owner is the only role", () => {
    const blockedRes = updatePermissionRoles("manageUsers", []);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.message).toContain("Safety Guard");
  });

  it("resets modified permissions back to system defaults (every capability granted to OWNER)", () => {
    updatePermissionRoles("recordSale", []);
    let matrix = getPermissionsMatrix();
    expect(matrix.recordSale).toEqual([]);

    resetPermissionsToDefault();
    matrix = getPermissionsMatrix();
    expect(matrix.recordSale).toEqual(["OWNER"]);
  });
});
