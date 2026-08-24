"use client";

import { useState } from "react";
import { Fuel, Search, CheckCircle2, AlertTriangle, XCircle, Car, Gauge, Building2, Check, Printer } from "lucide-react";
import { MOCK_FLEET_VEHICLES, MOCK_CORPORATE_ACCOUNTS } from "@/lib/mock/corporate";
import type { FleetVehicle, CorporateAccount } from "@/lib/corporate";
import { validateFleetDispense } from "@/lib/corporate";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtL, fmtRs } from "@/lib/money";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

export function FleetAuthorizeTerminal() {
  const [plateQuery, setPlateQuery] = useState("Ba 1 Gha 2891");
  const [searchedVehicle, setSearchedVehicle] = useState<FleetVehicle | null>(
    MOCK_FLEET_VEHICLES.find((v) => v.vehiclePlateNo === "Ba 1 Gha 2891") || null
  );
  const [litres, setLitres] = useState("40");
  const [odometer, setOdometer] = useState("84250");
  const [fuelChoice, setFuelChoice] = useState<"DIESEL" | "PETROL">("DIESEL");
  const [bay, setBay] = useState("Dispenser 02 (Diesel High-Speed)");
  const [authorizedSuccess, setAuthorizedSuccess] = useState(false);
  const [mintedReceipt, setMintedReceipt] = useState<number | null>(null);

  const matchedAccount = searchedVehicle
    ? MOCK_CORPORATE_ACCOUNTS.find((a) => a.id === searchedVehicle.accountId)
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorizedSuccess(false);
    const found = MOCK_FLEET_VEHICLES.find(
      (v) => v.vehiclePlateNo.toLowerCase().replace(/\s+/g, "") === plateQuery.toLowerCase().replace(/\s+/g, "")
    );
    setSearchedVehicle(found || null);
    if (found) {
      setFuelChoice(found.fuelAllowed === "PETROL" ? "PETROL" : "DIESEL");
      setOdometer(String(found.lastOdometerKm + 40));
    }
  };

  const requestedLitresNum = parseFloat(litres) || 0;
  const rate = fuelChoice === "PETROL" ? 172.5 : 160.0;
  const totalCost = requestedLitresNum * rate;

  const validation =
    searchedVehicle && matchedAccount
      ? validateFleetDispense(searchedVehicle, matchedAccount, requestedLitresNum, fuelChoice)
      : { allowed: false, reason: "Vehicle or Account not found in whitelist." };

  const handleAuthorize = () => {
    if (!validation.allowed || !searchedVehicle) return;
    const newReceipt = 10470 + Math.floor(Math.random() * 100);
    setMintedReceipt(newReceipt);
    searchedVehicle.currentMonthConsumedL += requestedLitresNum;
    searchedVehicle.lastOdometerKm = parseInt(odometer, 10) || searchedVehicle.lastOdometerKm;
    setAuthorizedSuccess(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-bg p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Fuel size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-text">Fleet Dispense Terminal</h3>
            <p className="text-xs text-text-muted">Real-time vehicle quota verification and attendant fuel authorization</p>
          </div>
        </div>

        {/* Search Plate */}
        <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter Vehicle Plate (e.g. Ba 1 Gha 2891)"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              className="font-data text-sm font-bold text-accent uppercase"
              required
            />
          </div>
          <PrimaryButton type="submit" className="gap-1.5 text-xs">
            <Search size={14} />
            Lookup Whitelist
          </PrimaryButton>
        </form>

        {searchedVehicle && matchedAccount ? (
          <div className="rounded-xl border border-border bg-surface p-4.5">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5">
              <div>
                <div className="font-data text-base font-bold text-accent">{searchedVehicle.vehiclePlateNo}</div>
                <div className="text-xs text-text-muted">{searchedVehicle.companyName}</div>
              </div>
              <div>
                {validation.allowed ? (
                  <Badge tone="success">
                    <CheckCircle2 size={11} />
                    AUTHORIZED FLEET
                  </Badge>
                ) : (
                  <Badge tone="error">
                    <XCircle size={11} />
                    DISPENSE BLOCKED
                  </Badge>
                )}
              </div>
            </div>

            {/* Vehicle & Quota Details */}
            <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
              <div>
                <div>Assigned Driver</div>
                <div className="font-semibold text-text">{searchedVehicle.assignedDriverName} ({searchedVehicle.driverPhone})</div>
              </div>
              <div>
                <div>Allowed Fuel Type</div>
                <div className="font-semibold text-text">
                  {searchedVehicle.fuelAllowed === "ANY" ? "All Fuels" : FUEL_LABEL[searchedVehicle.fuelAllowed]}
                </div>
              </div>
              <div>
                <div>Daily Quota Limit</div>
                <div className="font-data text-sm font-bold text-accent">{fmtL(searchedVehicle.dailyQuotaL)} / day</div>
              </div>
              <div>
                <div>Current Month Consumed</div>
                <div className="font-data text-sm font-bold text-text">
                  {fmtL(searchedVehicle.currentMonthConsumedL)} / {fmtL(searchedVehicle.monthlyQuotaL)}
                </div>
              </div>
            </div>

            {/* If Validation Error */}
            {!validation.allowed && (
              <div className="mt-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={14} />
                  Authorization Declined
                </div>
                <div className="mt-1 text-text-muted">{validation.reason}</div>
              </div>
            )}

            {/* Dispense Entry Form */}
            {!authorizedSuccess ? (
              <div className="mt-4 border-t border-border/60 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Litres to Dispense">
                    <Input
                      type="number"
                      value={litres}
                      onChange={(e) => setLitres(e.target.value)}
                      className="font-data text-base font-bold text-accent"
                      required
                    />
                  </Field>
                  <Field label="Fuel Product">
                    <Select
                      value={fuelChoice}
                      onChange={(e) => setFuelChoice(e.target.value as "DIESEL" | "PETROL")}
                    >
                      <option value="DIESEL">High-Speed Diesel (HSD) - NPR 160/L</option>
                      <option value="PETROL">Motor Spirit (Petrol) - NPR 172.50/L</option>
                    </Select>
                  </Field>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Current Odometer (Km)">
                    <Input
                      type="number"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Dispenser Bay">
                    <Select value={bay} onChange={(e) => setBay(e.target.value)}>
                      <option value="Dispenser 01 (MPD North)">Dispenser 01 (MPD North)</option>
                      <option value="Dispenser 02 (Diesel High-Speed)">Dispenser 02 (Diesel High-Speed)</option>
                      <option value="Dispenser 03 (MPD South)">Dispenser 03 (MPD South)</option>
                    </Select>
                  </Field>
                </div>

                {/* Total Cost preview */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-hi p-3 text-xs">
                  <span className="text-text-muted">Total Corporate Bill Amount:</span>
                  <span className="font-data text-base font-bold text-accent">{fmtRs(totalCost)}</span>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <PrimaryButton
                    onClick={handleAuthorize}
                    disabled={!validation.allowed}
                    className="w-full gap-2 py-3 text-sm"
                  >
                    <Fuel size={16} />
                    Authorize Fleet Fuel & Dispense
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              /* Success confirmation */
              <div className="mt-4 rounded-xl border border-success/40 bg-success/10 p-4 text-center animate-fade-in">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={20} />
                </div>
                <h4 className="font-display text-base font-bold text-success">Fuel Dispense Authorized</h4>
                <p className="mt-1 text-xs text-text">
                  Dispensed {fmtL(requestedLitresNum)} ({fmtRs(totalCost)}) to vehicle{" "}
                  <strong className="font-data text-accent">{searchedVehicle.vehiclePlateNo}</strong>.
                </p>
                <div className="mt-2 font-data text-xs text-text-muted">
                  Corporate Fleet Receipt <strong className="text-text">#{mintedReceipt}</strong> printed.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-text-muted">
            No vehicle found with plate &quot;{plateQuery}&quot;. Please verify the vehicle registration plate.
          </div>
        )}
      </div>
    </div>
  );
}
