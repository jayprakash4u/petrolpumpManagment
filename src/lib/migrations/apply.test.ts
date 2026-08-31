import { describe, it, expect } from "vitest";
import { getPendingMigrations, SCHEMA_TARGET } from "./apply";
import { TENANT_MIGRATIONS } from "./tenant-migrations";

describe("getPendingMigrations", () => {
  it("returns every migration for a tenant that has applied none", () => {
    const pending = getPendingMigrations(new Set());
    expect(pending.map((m) => m.id)).toEqual(TENANT_MIGRATIONS.map((m) => m.id));
  });

  it("returns nothing once every migration id is recorded", () => {
    const applied = new Set(TENANT_MIGRATIONS.map((m) => m.id));
    expect(getPendingMigrations(applied)).toEqual([]);
  });

  it("returns only what's missing, in the same order they're defined", () => {
    // Simulate a tenant that has 001_baseline but nothing after it.
    const applied = new Set(["001_baseline"]);
    const pending = getPendingMigrations(applied);
    expect(pending.map((m) => m.id)).toEqual(TENANT_MIGRATIONS.slice(1).map((m) => m.id));
  });

  it("ignores an applied id that isn't a real migration (e.g. a retired one)", () => {
    const applied = new Set(["999_retired_migration"]);
    const pending = getPendingMigrations(applied);
    expect(pending.map((m) => m.id)).toEqual(TENANT_MIGRATIONS.map((m) => m.id));
  });
});

describe("SCHEMA_TARGET", () => {
  it("is the id of the last defined migration", () => {
    expect(SCHEMA_TARGET).toBe(TENANT_MIGRATIONS[TENANT_MIGRATIONS.length - 1].id);
  });
});

describe("TENANT_MIGRATIONS", () => {
  it("has no duplicate ids", () => {
    const ids = TENANT_MIGRATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every migration's SQL, once split into batches, is non-empty", () => {
    for (const m of TENANT_MIGRATIONS) {
      const batches = m.sql
        .split(";\n\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      expect(batches.length, `${m.id} produced no SQL batches`).toBeGreaterThan(0);
    }
  });
});
