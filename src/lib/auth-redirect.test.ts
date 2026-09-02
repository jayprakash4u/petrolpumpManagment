import { describe, it, expect } from "vitest";
import { safeInternalPath } from "@/lib/auth-redirect";

describe("safeInternalPath", () => {
  const fallback = "/dashboard";

  it("returns the path for valid internal routes", () => {
    expect(safeInternalPath("/sales", fallback)).toBe("/sales");
    expect(safeInternalPath("/sales?tab=bills", fallback)).toBe("/sales?tab=bills");
  });

  it("returns fallback for missing or invalid values", () => {
    expect(safeInternalPath(null, fallback)).toBe(fallback);
    expect(safeInternalPath("", fallback)).toBe(fallback);
    expect(safeInternalPath("sales", fallback)).toBe(fallback);
  });

  it("blocks open redirects", () => {
    expect(safeInternalPath("//evil.com", fallback)).toBe(fallback);
    expect(safeInternalPath("https://evil.com", fallback)).toBe(fallback);
    expect(safeInternalPath("/\\evil.com", fallback)).toBe(fallback);
    expect(safeInternalPath("/javascript:alert(1)", fallback)).toBe(fallback);
  });

  it("blocks auth pages to prevent redirect loops", () => {
    expect(safeInternalPath("/login", fallback)).toBe(fallback);
    expect(safeInternalPath("/admin/login", fallback)).toBe(fallback);
  });
});
