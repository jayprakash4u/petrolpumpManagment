"use client";

import { useState } from "react";
import { FolderTree, Plus, Building2, MapPin, Fuel, ShieldCheck, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface StationGroup {
  id: string;
  name: string;
  code: string;
  category: "HIGHWAY_CORRIDOR" | "METRO_CITY" | "INDUSTRIAL_BORDER" | "RURAL_HILLS";
  stationCount: number;
  activeFuelNozzles: number;
  description: string;
  assignedRegion: string;
}

export function StationGroupsView() {
  const [groups, setGroups] = useState<StationGroup[]>([
    {
      id: "grp-1",
      name: "Kathmandu Valley Metro Hubs",
      code: "GRP-KTM-METRO",
      category: "METRO_CITY",
      stationCount: 6,
      activeFuelNozzles: 36,
      description: "High-throughput urban stations across Ring Road, Maharajgunj, Patan & Bhaktapur.",
      assignedRegion: "Bagmati Province",
    },
    {
      id: "grp-2",
      name: "East-West Highway Express Corridor",
      code: "GRP-EWH-HIGHWAY",
      category: "HIGHWAY_CORRIDOR",
      stationCount: 8,
      activeFuelNozzles: 48,
      description: "24/7 long-haul truck & passenger bus fueling corridor connecting Chitwan, Butwal & Itahari.",
      assignedRegion: "National Highway (Mahendra Highway)",
    },
    {
      id: "grp-3",
      name: "Birgunj-Biratnagar Border Logistics",
      code: "GRP-BORDER-LOGISTICS",
      category: "INDUSTRIAL_BORDER",
      stationCount: 4,
      activeFuelNozzles: 24,
      description: "Dry port, customs cargo, and industrial tanker fleet decanting hubs.",
      assignedRegion: "Madhesh & Koshi Borders",
    },
    {
      id: "grp-4",
      name: "Mid-Hill & Mountain Outposts",
      code: "GRP-HILLS-OUTPOST",
      category: "RURAL_HILLS",
      stationCount: 2,
      activeFuelNozzles: 8,
      description: "Critical lifeline fuel depots in Baglung, Surkhet and Dharan hills.",
      assignedRegion: "Gandaki & Karnali",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newRegion, setNewRegion] = useState("Bagmati Province");
  const [newDescription, setNewDescription] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: StationGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName,
      code: newGroupCode.toUpperCase(),
      category: "METRO_CITY",
      stationCount: 0,
      activeFuelNozzles: 0,
      description: newDescription,
      assignedRegion: newRegion,
    };
    setGroups([newGroup, ...groups]);
    setShowAddModal(false);
    setNewGroupName("");
    setNewGroupCode("");
    setNewDescription("");
    setSuccessMsg(`Station Category "${newGroupName}" created successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <FolderTree size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Station Categories & Geographical Clusters (पम्प समूह तथा क्लस्टर)
            </h2>
            <p className="text-[12px] text-text-muted">
              Organize multi-tenant petrol pumps into regional groups, highway corridors, and commercial clusters for unified tariff broadcasts.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setShowAddModal(true)} className="text-[13px] px-4 py-2.5">
          <Plus size={16} /> Create Station Group
        </PrimaryButton>
      </div>

      {successMsg && (
        <div className="animate-fade-in flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success font-medium">
          <CheckCircle2 size={17} /> {successMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Station Clusters"
          value={`${groups.length} Groups`}
          icon={FolderTree}
          tone="accent"
        />
        <StatCard
          label="Clustered Stations"
          value={`${groups.reduce((s, g) => s + g.stationCount, 0)} Stations`}
          icon={Building2}
          tone="success"
        />
        <StatCard
          label="Managed Nozzles"
          value={`${groups.reduce((s, g) => s + g.activeFuelNozzles, 0)} Nozzles`}
          icon={Fuel}
          tone="text"
        />
        <StatCard
          label="Geographic Coverage"
          value="7 Provinces"
          icon={MapPin}
          tone="accent"
        />
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((grp) => (
          <div
            key={grp.id}
            className="rounded-2xl border border-border bg-surface p-5 space-y-3.5 shadow-xs hover:border-accent/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[16px] font-bold text-text">{grp.name}</h3>
                  <span className="font-mono rounded bg-accent/15 px-2 py-0.5 text-[10.5px] font-bold text-accent">
                    {grp.code}
                  </span>
                </div>
                <div className="text-[12px] text-text-muted flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} className="text-accent" /> {grp.assignedRegion}
                </div>
              </div>

              <Badge tone="accent">
                {grp.category.replace(/_/g, " ")}
              </Badge>
            </div>

            <p className="text-[12.5px] text-text-muted leading-relaxed">
              {grp.description}
            </p>

            <div className="flex items-center justify-between border-t border-border pt-3 text-[12px]">
              <div className="flex items-center gap-3 font-data font-medium text-text">
                <span><strong>{grp.stationCount}</strong> Stations</span>
                <span>·</span>
                <span><strong>{grp.activeFuelNozzles}</strong> Nozzles</span>
              </div>

              <div className="flex items-center gap-2">
                <GhostButton className="px-2 py-1 text-[11px]">
                  <Edit size={12} /> Edit
                </GhostButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreateGroup}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text">
                Create Station Category / Group
              </h3>
              <p className="text-[12px] text-text-muted">
                Group stations together for bulk tariff policies and regional reporting.
              </p>
            </div>

            <Field label="Group Name" htmlFor="gName">
              <Input
                id="gName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Pokhara Tourism Corridor"
                required
              />
            </Field>

            <Field label="Group Code" htmlFor="gCode">
              <Input
                id="gCode"
                value={newGroupCode}
                onChange={(e) => setNewGroupCode(e.target.value)}
                placeholder="e.g. GRP-PKR-TOURISM"
                required
              />
            </Field>

            <Field label="Assigned Region" htmlFor="gRegion">
              <Input
                id="gRegion"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="e.g. Gandaki Province"
                required
              />
            </Field>

            <Field label="Description" htmlFor="gDesc">
              <Input
                id="gDesc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Short purpose of this station cluster..."
                required
              />
            </Field>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <GhostButton type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Save Cluster
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
