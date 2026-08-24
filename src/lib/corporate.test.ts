import { describe, it, expect } from "vitest";
import { validateFleetDispense } from "./corporate";
import { MOCK_CORPORATE_ACCOUNTS, MOCK_FLEET_VEHICLES } from "./mock/corporate";

describe("Corporate Pay & Fleet Module", () => {
  const account = MOCK_CORPORATE_ACCOUNTS[0]; // KMC
  const vehicle = MOCK_FLEET_VEHICLES[0]; // Ba 1 Gha 2891, dailyQuota: 80L, DIESEL

  it("approves valid dispense within daily and monthly quota", () => {
    const result = validateFleetDispense(vehicle, account, 50, "DIESEL");
    expect(result.allowed).toBe(true);
  });

  it("rejects dispense exceeding vehicle daily quota", () => {
    const result = validateFleetDispense(vehicle, account, 100, "DIESEL");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exceeds daily vehicle quota");
  });

  it("rejects wrong fuel product for restricted vehicle", () => {
    const result = validateFleetDispense(vehicle, account, 20, "PETROL");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("restricted to DIESEL");
  });

  it("rejects dispense if corporate account is suspended", () => {
    const suspendedAccount = { ...account, status: "SUSPENDED" as const, active: false };
    const result = validateFleetDispense(vehicle, suspendedAccount, 20, "DIESEL");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("SUSPENDED");
  });
});
