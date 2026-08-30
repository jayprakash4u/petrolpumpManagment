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

  it("lists station roles with responsibilities and summaries", () => {
    expect(STATION_ROLES.length).toBe(6);
    const roleKeys = STATION_ROLES.map((r) => r.role);
    expect(roleKeys).toContain("OWNER");
    expect(roleKeys).toContain("MANAGER");
    expect(roleKeys).toContain("CASHIER");
    expect(roleKeys).toContain("ACCOUNTANT");
    expect(roleKeys).toContain("ATTENDANT");
    expect(roleKeys).toContain("OTHER");
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

  it("returns active permissions for Owner, Manager, Cashier, Accountant, and Attendant", () => {
    const ownerPerms = getRoleActivePermissions("OWNER");
    expect(ownerPerms.length).toBe(20); // Owner has all permissions

    const attendantPerms = getRoleActivePermissions("ATTENDANT");
    expect(attendantPerms.map((p) => p.key)).toContain("recordSale");
    expect(attendantPerms.map((p) => p.key)).toContain("viewPumps");
    expect(attendantPerms.map((p) => p.key)).toContain("recordMeterReadings");
    expect(attendantPerms.map((p) => p.key)).not.toContain("manageUsers");

    const accountantPerms = getRoleActivePermissions("ACCOUNTANT");
    expect(accountantPerms.map((p) => p.key)).toContain("viewExpenses");
    expect(accountantPerms.map((p) => p.key)).toContain("manageExpenses");
    expect(accountantPerms.map((p) => p.key)).toContain("viewReports");
  });

  it("updates permission roles and preserves safety guard for Owner manageUsers", () => {
    const blockedRes = updatePermissionRoles("manageUsers", ["MANAGER"]);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.message).toContain("Safety Guard");

    const successRes = updatePermissionRoles("editFuelRate", ["OWNER", "MANAGER", "CASHIER"]);
    expect(successRes.success).toBe(true);

    const updatedMatrix = getPermissionsMatrix();
    expect(updatedMatrix.editFuelRate).toContain("CASHIER");
  });

  it("resets modified permissions back to system defaults", () => {
    updatePermissionRoles("recordSale", ["OWNER"]);
    let matrix = getPermissionsMatrix();
    expect(matrix.recordSale).toEqual(["OWNER"]);

    resetPermissionsToDefault();
    matrix = getPermissionsMatrix();
    expect(matrix.recordSale).toContain("ATTENDANT");
  });
});
