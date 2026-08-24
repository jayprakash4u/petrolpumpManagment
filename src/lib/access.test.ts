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

  it("lists all 4 station roles with responsibilities and summaries", () => {
    expect(STATION_ROLES.length).toBe(4);
    const roleKeys = STATION_ROLES.map((r) => r.role);
    expect(roleKeys).toContain("OWNER");
    expect(roleKeys).toContain("MANAGER");
    expect(roleKeys).toContain("CASHIER");
    expect(roleKeys).toContain("ATTENDANT");
  });

  it("lists all defined station capabilities across 4 intuitive categories", () => {
    expect(PERMISSION_DEFINITIONS.length).toBe(10);
    const categories = new Set(PERMISSION_DEFINITIONS.map((p) => p.category));
    expect(categories.has("Sales & Cash")).toBe(true);
    expect(categories.has("Stock & Pricing")).toBe(true);
    expect(categories.has("Customers & Credit")).toBe(true);
    expect(categories.has("Operations & Admin")).toBe(true);
  });

  it("returns active permissions for Owner, Manager, Cashier, and Attendant", () => {
    const ownerPerms = getRoleActivePermissions("OWNER");
    expect(ownerPerms.length).toBe(10); // Owner has all permissions

    const attendantPerms = getRoleActivePermissions("ATTENDANT");
    expect(attendantPerms.map((p) => p.key)).toContain("recordSale");
    expect(attendantPerms.map((p) => p.key)).toContain("manageOwnShift");
    expect(attendantPerms.map((p) => p.key)).not.toContain("manageUsers");
  });

  it("updates permission roles and preserves safety guard for Owner manageUsers", () => {
    // Attempting to remove manageUsers from OWNER should fail
    const blockedRes = updatePermissionRoles("manageUsers", ["MANAGER"]);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.message).toContain("Safety Guard");

    // Updating editFuelRate to include Cashier should succeed
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
