import { describe, it, expect } from "vitest";
import { PERMISSIONS, can, hasUserPermission, type Permission, type Role } from "@/lib/permissions";
import {
  PERMISSION_CATALOGUE,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  permissionMeta,
  permissionsInGroup,
  defaultPermissionsFor,
  isFullAccessRole,
  grantablePermissions,
  diffFromTemplate,
} from "@/lib/permission-catalogue";

const ROLES: Role[] = ["OWNER"];

describe("the catalogue covers the real permission set", () => {
  it("describes every permission the server enforces", () => {
    expect([...ALL_PERMISSIONS].sort()).toEqual(Object.keys(PERMISSIONS).sort());
  });

  it("invents no permission that the server does not know about", () => {
    for (const meta of PERMISSION_CATALOGUE) {
      expect(Object.keys(PERMISSIONS), meta.key).toContain(meta.key);
    }
  });

  it("gives every entry a label, a description and a real group", () => {
    for (const meta of PERMISSION_CATALOGUE) {
      expect(meta.label.length, meta.key).toBeGreaterThan(2);
      expect(meta.description.length, meta.key).toBeGreaterThan(10);
      expect(PERMISSION_GROUPS, meta.key).toContain(meta.group);
    }
  });

  it("has no duplicate keys", () => {
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
  });

  it("places every permission in exactly one group", () => {
    const fromGroups = PERMISSION_GROUPS.flatMap((g) => permissionsInGroup(g).map((p) => p.key));
    expect([...fromGroups].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it("looks up metadata by key", () => {
    expect(permissionMeta("voidSale").group).toBe("Sales & Billing");
    expect(permissionMeta("recordMeterReadings").group).toBe("Pumps & Forecourt");
  });
});

describe("can() grants full access regardless of role or template", () => {
  it("is true for every role and every permission — the catalogue's per-role template is reference data only, not enforced", () => {
    for (const role of ROLES) {
      for (const key of ALL_PERMISSIONS) {
        expect(can(role, key), `${role} / ${key}`).toBe(true);
      }
    }
  });

  it("gives an owner full access", () => {
    expect(isFullAccessRole("OWNER")).toBe(true);
    expect(can("OWNER", "manageUsers")).toBe(true);
    expect(can("OWNER", "recordSale")).toBe(true);
    expect(hasUserPermission({ role: "OWNER" }, "viewReports")).toBe(true);
  });

  it("gives the one role (Pump Admin) every permission there is — forecourt, sales, expenses, reports, and user management alike", () => {
    const granted = defaultPermissionsFor("OWNER");
    expect([...granted].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });
});

describe("hasUserPermission grants full access regardless of stored per-user overrides", () => {
  it("ignores a cashier's stored custom permission list and grants everything anyway", () => {
    const userWithCustomPerms = {
      role: "OWNER",
      permissions: JSON.stringify(["viewSales", "recordSale", "processPayment", "viewReports"]),
    };
    expect(hasUserPermission(userWithCustomPerms, "viewReports")).toBe(true);
    expect(hasUserPermission(userWithCustomPerms, "editFuelRate")).toBe(true);
  });

  it("ignores a restricted pump operator's stored custom permission list and grants everything anyway", () => {
    const restrictedOperator = {
      role: "ATTENDANT",
      permissions: JSON.stringify(["viewPumps", "recordMeterReadings"]),
    };
    expect(hasUserPermission(restrictedOperator, "viewPumps")).toBe(true);
    expect(hasUserPermission(restrictedOperator, "recordSale")).toBe(true);
  });
});

describe("escalation is contained", () => {
  it("treats staff administration as escalating", () => {
    expect(permissionMeta("manageUsers").escalating).toBe(true);
    expect(permissionMeta("manageStationSettings").escalating).toBe(true);
  });

  it("never offers escalating permissions as regular staff checkboxes", () => {
    const grantable = grantablePermissions().map((p) => p.key);
    expect(grantable).not.toContain("manageUsers");
    expect(grantable).not.toContain("manageStationSettings");
  });
});

describe("diffFromTemplate", () => {
  it("reports no change for an untouched template", () => {
    const d = diffFromTemplate("OWNER", defaultPermissionsFor("OWNER"));
    expect(d.isCustomised).toBe(false);
    expect(d.added).toEqual([]);
    expect(d.removed).toEqual([]);
  });

  // There's no "added" case to test anymore: the one role's default
  // template is already every permission there is (defaultPermissionsFor
  // maps every PERMISSIONS entry to ["OWNER"]), so nothing can be added to
  // it that isn't already there.

  it("reports a removed permission", () => {
    const selected = defaultPermissionsFor("OWNER");
    selected.delete("recordCustomerPayment");
    const d = diffFromTemplate("OWNER", selected);
    expect(d.removed).toEqual(["recordCustomerPayment"]);
    expect(d.added).toEqual([]);
    expect(d.isCustomised).toBe(true);
  });
});
