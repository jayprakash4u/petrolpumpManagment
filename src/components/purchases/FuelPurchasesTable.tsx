"use client";

import { useState } from "react";
import { Plus, X, Truck, Fuel, CheckCircle2, ShieldCheck, Thermometer, Search } from "lucide-react";
import type { FuelPurchaseDelivery } from "@/lib/purchases";
import { FUEL_LABEL } from "@/lib/fuel";
import { FUEL_ICON } from "@/components/fuel-icons";
import { fmtL, fmtRs, fmtRate } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";

export function FuelPurchasesTable({ deliveries }: { deliveries: FuelPurchaseDelivery[] }) {
  const [list, setList] = useState<FuelPurchaseDelivery[]>(deliveries);
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [dateBS, setDateBS] = useState("2083-05-03");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [challanNo, setChallanNo] = useState("");
  const [tankerNo, setTankerNo] = useState("");
  const [fuel, setFuel] = useState<FuelPurchaseDelivery["fuel"]>("PETROL");
  const [tankId, setTankId] = useState("tank-petrol-1");
  const [litres, setLitres] = useState("8000");
  const [rate, setRate] = useState("162.5");
  const [density, setDensity] = useState("735.0");
  const [temp, setTemp] = useState("24.0");
  const [depot, setDepot] = useState("Amlekhgunj Depot");

  const litresNum = parseFloat(litres) || 0;
  const rateNum = parseFloat(rate) || 0;
  const totalAmount = litresNum * rateNum;

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: FuelPurchaseDelivery = {
      id: `fp-${Date.now()}`,
      dateBS,
      time: "12:00",
      invoiceNo,
      challanNo,
      tankerNo,
      supplierId: "sup-noc",
      supplierName: "Nepal Oil Corporation (NOC)",
      depotLocation: depot,
      fuel,
      tankId,
      tankName: fuel === "PETROL" ? "Underground Tank 1 (Petrol)" : fuel === "DIESEL" ? "Underground Tank 2 (Diesel)" : "Bank 3 (CNG)",
      litresOrdered: litresNum,
      litresDelivered: litresNum,
      invoiceRatePerL: rateNum,
      totalAmountNpr: totalAmount,
      vatAmountNpr: 0,
      densityObserved: parseFloat(density) || 735,
      temperatureC: parseFloat(temp) || 24,
      recordedByName: "Anita Shrestha (Manager)",
      paymentStatus: "Paid",
    };

    setList([newRecord, ...list]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setInvoiceNo("");
      setChallanNo("");
      setTankerNo("");
    }, 1000);
  };

  const filtered = list.filter((d) => {
    if (fuelFilter !== "ALL" && d.fuel !== fuelFilter) return false;
    if (
      search &&
      !d.invoiceNo.toLowerCase().includes(search.toLowerCase()) &&
      !d.challanNo.toLowerCase().includes(search.toLowerCase()) &&
      !d.tankerNo.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[220px]">
            <Search size={14} className="absolute top-2.5 left-3 text-text-muted" />
            <Input
              placeholder="Search invoice / tanker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="py-1.5 pr-3 pl-8 text-xs"
            />
          </div>

          <div className="w-[140px]">
            <Select value={fuelFilter} onChange={(e) => setFuelFilter(e.target.value)} className="py-1.5 text-xs">
              <option value="ALL">All Fuels</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="CNG">CNG</option>
            </Select>
          </div>
        </div>

        <PrimaryButton onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
          <Plus size={15} />
          Record Fuel Delivery
        </PrimaryButton>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border font-data text-[11px] tracking-wide text-text-muted">
              <th className="px-3 py-2.5 font-medium">DATE (BS) / TIME</th>
              <th className="px-3 py-2.5 font-medium">CHALLAN & INVOICE</th>
              <th className="px-3 py-2.5 font-medium">TANKER TRUCK</th>
              <th className="px-3 py-2.5 font-medium">FUEL / TANK</th>
              <th className="px-3 py-2.5 text-right font-medium">VOLUME (L)</th>
              <th className="px-3 py-2.5 text-right font-medium">RATE / L</th>
              <th className="px-3 py-2.5 text-right font-medium">TOTAL COST</th>
              <th className="px-3 py-2.5 text-center font-medium">DENSITY / TEMP</th>
              <th className="px-3 py-2.5 text-center font-medium">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const Icon = FUEL_ICON[d.fuel];
              return (
                <tr key={d.id} className="border-b border-border/60 transition-colors hover:bg-surface-hi/40">
                  <td className="px-3 py-3 font-data text-[12.5px] text-text">
                    <div className="font-semibold">{d.dateBS}</div>
                    <div className="text-[11px] text-text-muted">{d.time} · {d.depotLocation}</div>
                  </td>

                  <td className="px-3 py-3 font-data text-xs">
                    <div className="font-semibold text-text">{d.invoiceNo}</div>
                    <div className="text-[11px] text-text-muted">{d.challanNo}</div>
                  </td>

                  <td className="px-3 py-3 font-data text-[12.5px] font-semibold text-accent">
                    {d.tankerNo}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="shrink-0 text-accent" />
                      <div>
                        <div className="font-display text-[13px] font-semibold text-text">{FUEL_LABEL[d.fuel]}</div>
                        <div className="font-data text-[11px] text-text-muted">{d.tankName}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-text">
                    {fmtL(d.litresDelivered)}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[12px] text-text-muted">
                    {fmtRate(d.invoiceRatePerL)}
                  </td>

                  <td className="px-3 py-3 text-right font-data text-[13px] font-bold text-accent">
                    {fmtRs(d.totalAmountNpr)}
                  </td>

                  <td className="px-3 py-3 text-center font-data text-[11px] text-text-muted">
                    <div>{d.densityObserved} kg/m³</div>
                    <div className="text-[10px]">{d.temperatureC}°C</div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <Badge tone="success">
                      <CheckCircle2 size={10} />
                      DECANTED
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Record Fuel Delivery Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-text">Record Tanker Delivery</h3>
                  <p className="text-xs text-text-muted">Log bulk decantation from NOC tanker into storage tank</p>
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
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="font-display text-base font-semibold text-text">Delivery Recorded & Decanted</h4>
                <p className="mt-1 text-xs text-text-muted">
                  Added {fmtL(litresNum)} of {FUEL_LABEL[fuel]} into underground storage.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRecord} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date (BS)">
                    <Input value={dateBS} onChange={(e) => setDateBS(e.target.value)} required />
                  </Field>
                  <Field label="NOC Depot Location">
                    <Select value={depot} onChange={(e) => setDepot(e.target.value)}>
                      <option value="Amlekhgunj Depot">Amlekhgunj Depot</option>
                      <option value="Thankot Depot">Thankot Depot</option>
                      <option value="Barauni Refined (Direct)">Barauni Refined (Direct)</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="NOC Invoice / Bill No">
                    <Input
                      placeholder="e.g. NOC-INV-85012"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Challan Number">
                    <Input
                      placeholder="e.g. CH-77580"
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tanker Truck Plate No">
                    <Input
                      placeholder="e.g. Na 4 Kha 8912"
                      value={tankerNo}
                      onChange={(e) => setTankerNo(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Target Fuel Storage Tank">
                    <Select
                      value={fuel}
                      onChange={(e) => {
                        const f = e.target.value as FuelPurchaseDelivery["fuel"];
                        setFuel(f);
                        setTankId(f === "PETROL" ? "tank-petrol-1" : f === "DIESEL" ? "tank-diesel-1" : "tank-cng-1");
                        setRate(f === "PETROL" ? "162.5" : f === "DIESEL" ? "151.0" : "90.0");
                      }}
                    >
                      <option value="PETROL">Underground Tank 1 (Petrol)</option>
                      <option value="DIESEL">Underground Tank 2 (Diesel)</option>
                      <option value="CNG">Cascade Bank 3 (CNG)</option>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Decanted Volume (Litres)">
                    <Input
                      type="number"
                      step="1"
                      value={litres}
                      onChange={(e) => setLitres(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Purchase Rate per Litre">
                    <Input
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Observed Density (kg/m³)">
                    <Input
                      type="number"
                      step="0.1"
                      value={density}
                      onChange={(e) => setDensity(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Temperature (°C)">
                    <Input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                {/* Amount preview */}
                <div className="rounded-xl border border-accent/30 bg-accent/8 p-3 text-xs text-text-muted">
                  <div className="flex items-center justify-between">
                    <span>Total Decantation Invoice Value:</span>
                    <span className="font-data text-base font-bold text-accent">{fmtRs(totalAmount)}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2.5">
                  <GhostButton type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </GhostButton>
                  <PrimaryButton type="submit">Record Delivery</PrimaryButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
