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

const ROLES: Role[] = ["OWNER", "MANAGER", "CASHIER", "ACCOUNTANT", "ATTENDANT", "OTHER"];

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

describe("role templates match what the server actually allows", () => {
  it("agrees with can() for non-owner roles and permission sets", () => {
    for (const role of ROLES) {
      const template = defaultPermissionsFor(role);
      for (const key of ALL_PERMISSIONS) {
        if (role === "OWNER") {
          expect(can(role, key)).toBe(true);
        } else {
          expect(template.has(key), `${role} / ${key}`).toBe(can(role, key));
        }
      }
    }
  });

  it("gives an owner full access", () => {
    expect(isFullAccessRole("OWNER")).toBe(true);
    expect(can("OWNER", "manageUsers")).toBe(true);
    expect(can("OWNER", "recordSale")).toBe(true);
    expect(hasUserPermission({ role: "OWNER" }, "viewReports")).toBe(true);
  });

  it("gives a pump operator (attendant) forecourt, meter readings, sales and own shift", () => {
    const attendant = defaultPermissionsFor("ATTENDANT");
    expect(attendant.has("viewPumps")).toBe(true);
    expect(attendant.has("recordMeterReadings")).toBe(true);
    expect(attendant.has("recordSale")).toBe(true);
    expect(attendant.has("manageOwnShift")).toBe(true);
    expect(attendant.has("manageUsers")).toBe(false);
  });

  it("gives an accountant sales view, expenses, reports and customer ledgers", () => {
    const accountant = defaultPermissionsFor("ACCOUNTANT");
    expect(accountant.has("viewSales")).toBe(true);
    expect(accountant.has("viewExpenses")).toBe(true);
    expect(accountant.has("manageExpenses")).toBe(true);
    expect(accountant.has("viewReports")).toBe(true);
    expect(accountant.has("exportReports")).toBe(true);
    expect(accountant.has("managePumps")).toBe(false);
  });

  it("gives a cashier sales and payments but not expense editing or rates", () => {
    const cashier = defaultPermissionsFor("CASHIER");
    expect(cashier.has("recordSale")).toBe(true);
    expect(cashier.has("processPayment")).toBe(true);
    expect(cashier.has("recordCustomerPayment")).toBe(true);
    expect(cashier.has("editFuelRate")).toBe(false);
    expect(cashier.has("manageExpenses")).toBe(false);
  });
});

describe("custom per-user permissions override role template", () => {
  it("allows a cashier to have reports when customized by Station Admin", () => {
    const userWithCustomPerms = {
      role: "CASHIER",
      permissions: JSON.stringify(["viewSales", "recordSale", "processPayment", "viewReports"]),
    };
    expect(hasUserPermission(userWithCustomPerms, "viewReports")).toBe(true);
    expect(hasUserPermission(userWithCustomPerms, "editFuelRate")).toBe(false);
  });

  it("allows a pump operator to be restricted or granted extra access", () => {
    const restrictedOperator = {
      role: "ATTENDANT",
      permissions: JSON.stringify(["viewPumps", "recordMeterReadings"]),
    };
    expect(hasUserPermission(restrictedOperator, "viewPumps")).toBe(true);
    expect(hasUserPermission(restrictedOperator, "recordSale")).toBe(false);
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
    const d = diffFromTemplate("CASHIER", defaultPermissionsFor("CASHIER"));
    expect(d.isCustomised).toBe(false);
    expect(d.added).toEqual([]);
    expect(d.removed).toEqual([]);
  });

  it("reports an added permission", () => {
    const selected = defaultPermissionsFor("CASHIER");
    selected.add("viewReports");
    const d = diffFromTemplate("CASHIER", selected);
    expect(d.added).toEqual(["viewReports"]);
    expect(d.removed).toEqual([]);
    expect(d.isCustomised).toBe(true);
  });

  it("reports a removed permission", () => {
    const selected = defaultPermissionsFor("CASHIER");
    selected.delete("recordCustomerPayment");
    const d = diffFromTemplate("CASHIER", selected);
    expect(d.removed).toEqual(["recordCustomerPayment"]);
    expect(d.added).toEqual([]);
    expect(d.isCustomised).toBe(true);
  });
});
