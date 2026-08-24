"use client";

import { useState } from "react";
import { Plus, X, Car, Fuel, ShieldCheck, AlertTriangle, Filter, Check, Gauge } from "lucide-react";
import type { FleetVehicle } from "@/lib/corporate";
import { FUEL_LABEL } from "@/lib/fuel";
import { fmtL } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function FleetVehiclesTable({
  vehicles,
  companies,
}: {
  vehicles: FleetVehicle[];
  companies: { id: string; name: string }[];
}) {
  const [list, setList] = useState<FleetVehicle[]>(vehicles);
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [plateNo, setPlateNo] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "corp-kmc");
  const [vehicleType, setVehicleType] = useState<FleetVehicle["vehicleType"]>("Patrol SUV / Jeep");
  const [fuelAllowed, setFuelAllowed] = useState<FleetVehicle["fuelAllowed"]>("DIESEL");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [dailyQuota, setDailyQuota] = useState("40");
  const [monthlyQuota, setMonthlyQuota] = useState("600");
  const [odometer, setOdometer] = useState("45000");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const compName = companies.find((c) => c.id === companyId)?.name || "Corporate Fleet";
    const newVehicle: FleetVehicle = {
      id: `veh-${Date.now()}`,
      vehiclePlateNo: plateNo,
      accountId: companyId,
      companyName: compName,
      vehicleType,
      fuelAllowed,
      assignedDriverName: driverName,
      driverPhone,
      driverLicenseNo: "01-09-00000",
      dailyQuotaL: parseFloat(dailyQuota) || 40,
      monthlyQuotaL: parseFloat(monthlyQuota) || 600,
      currentMonthConsumedL: 0,
      lastOdometerKm: parseInt(odometer, 10) || 0,
      status: "AUTHORIZED",
    };

    setList([newVehicle, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setPlateNo("");
      setDriverName("");
    }, 1000);
  };

  const filtered = list.filter((v) => {
    if (companyFilter !== "ALL" && v.accountId !== companyFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filter and Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} />
            <span>FLEET FILTER:</span>
          </div>

          <div className="w-[220px]">
            <Select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Corporate Fleets</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
          <Plus size={15} />
          Register Fleet Vehicle
        </PrimaryButton>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">VEHICLE PLATE & TYPE</th>
              <th className="px-3 py-2.5 font-medium">CORPORATE CLIENT</th>
              <th className="px-3 py-2.5 font-medium">ALLOWED FUEL</th>
              <th className="px-3 py-2.5 font-medium">ASSIGNED DRIVER</th>
              <th className="px-3 py-2.5 text-right font-medium">DAILY LIMIT</th>
              <th className="px-3 py-2.5 font-medium">MONTHLY CONSUMPTION</th>
              <th className="px-3 py-2.5 text-right font-medium">ODOMETER</th>
              <th className="px-3 py-2.5 text-center font-medium">PUMP STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const pct = v.monthlyQuotaL > 0 ? (v.currentMonthConsumedL / v.monthlyQuotaL) * 100 : 0;
              const isNearLimit = pct >= 85;

              return (
                <tr key={v.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-hi text-accent">
                        <Car size={15} />
                      </div>
                      <div>
                        <div className="font-data text-[13px] font-bold text-accent">{v.vehiclePlateNo}</div>
                        <div className="text-[11px] text-text-muted">{v.vehicleType}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-xs font-semibold text-text">{v.companyName}</td>

                  <td className="px-3 py-3 text-xs">
                    <Badge tone="accent">
                      {v.fuelAllowed === "ANY" ? "ALL FUELS" : FUEL_LABEL[v.fuelAllowed]}
                    </Badge>
                  </td>

                  <td className="px-3 py-3 text-xs">
                    <div className="font-medium text-text">{v.assignedDriverName}</div>
                    <div className="font-data text-[11px] text-text-muted">{v.driverPhone}</div>
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                    {fmtL(v.dailyQuotaL)} / day
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center justify-between text-[11.5px] font-data">
                      <span className={isNearLimit ? "text-error font-bold" : "text-text font-semibold"}>
                        {fmtL(v.currentMonthConsumedL)}
                      </span>
                      <span className="text-text-muted">of {fmtL(v.monthlyQuotaL)}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hi">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isNearLimit ? "bg-error" : "bg-accent"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[12px] text-text-muted">
                    {v.lastOdometerKm.toLocaleString()} km
                  </td>

                  <td className="px-3 py-3 text-center">
                    <Badge tone={v.status === "AUTHORIZED" ? "success" : "error"}>
                      <ShieldCheck size={10} />
                      {v.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Register Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Car size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Register Fleet Vehicle</h3>
                  <p className="text-xs text-text-muted">Add vehicle to whitelist with daily fuel volume cap</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-text-muted hover:bg-surface-hi hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Vehicle Whitelisted</h4>
                <p className="mt-1 text-xs text-text-muted">{plateNo} is now authorized for pump dispensing.</p>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vehicle Registration Plate">
                    <Input
                      placeholder="e.g. Ba 1 Gha 2891"
                      value={plateNo}
                      onChange={(e) => setPlateNo(e.target.value)}
                      className="font-data uppercase font-bold text-accent"
                      required
                    />
                  </Field>
                  <Field label="Corporate Client Account">
                    <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vehicle Class">
                    <Select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as FleetVehicle["vehicleType"])}
                    >
                      <option value="Patrol SUV / Jeep">Patrol SUV / Jeep</option>
                      <option value="Heavy Bus / Truck">Heavy Bus / Truck</option>
                      <option value="Light Commercial Pickup">Light Commercial Pickup</option>
                      <option value="Motorcycle / Scooter">Motorcycle / Scooter</option>
                      <option value="Generator Set">Generator Set</option>
                    </Select>
                  </Field>
                  <Field label="Allowed Fuel Product">
                    <Select
                      value={fuelAllowed}
                      onChange={(e) => setFuelAllowed(e.target.value as FleetVehicle["fuelAllowed"])}
                    >
                      <option value="DIESEL">Diesel (HSD Only)</option>
                      <option value="PETROL">Petrol (MS Only)</option>
                      <option value="ANY">Any Fuel</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Assigned Driver Name">
                    <Input
                      placeholder="e.g. Bikash Tamang"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Driver Mobile Number">
                    <Input
                      placeholder="e.g. +977 9841001122"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Daily Cap (L)">
                    <Input
                      type="number"
                      value={dailyQuota}
                      onChange={(e) => setDailyQuota(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Monthly Cap (L)">
                    <Input
                      type="number"
                      value={monthlyQuota}
                      onChange={(e) => setMonthlyQuota(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Odometer (Km)">
                    <Input
                      type="number"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Authorize Vehicle</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
