"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, ShieldCheck, Mail, Phone, Clock, Key, CheckCircle2, Lock } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { Field, Input } from "@/components/ui/Field";

export interface SuperAdminStaff {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "PLATFORM_SUPER_ADMIN" | "BILLING_ACCOUNTANT" | "SUPPORT_ENGINEER" | "SECURITY_AUDITOR";
  lastLoginBS: string;
  status: "ACTIVE" | "INACTIVE";
}

export function PlatformUsersView() {
  const [staffList, setStaffList] = useState<SuperAdminStaff[]>([
    {
      id: "sa-1",
      name: "John Admin",
      username: "john.admin",
      email: "john@petrocloud.test",
      role: "PLATFORM_SUPER_ADMIN",
      lastLoginBS: "2083-05-08 12:40",
      status: "ACTIVE",
    },
    {
      id: "sa-2",
      name: "Sita Support",
      username: "sita.support",
      email: "sita@petrocloud.test",
      role: "SUPPORT_ENGINEER",
      lastLoginBS: "2083-05-08 10:15",
      status: "ACTIVE",
    },
    {
      id: "sa-3",
      name: "Ram Accountant",
      username: "ram.accountant",
      email: "ram@petrocloud.test",
      role: "BILLING_ACCOUNTANT",
      lastLoginBS: "2083-05-07 16:30",
      status: "ACTIVE",
    },
    {
      id: "sa-4",
      name: "Jay Prakash Yadav",
      username: "operator",
      email: "operator@petrocloud.test",
      role: "PLATFORM_SUPER_ADMIN",
      lastLoginBS: "2083-05-08 14:20",
      status: "ACTIVE",
    },
    {
      id: "sa-5",
      name: "Nabin Thapa",
      username: "nabin.audit",
      email: "audit@petrocloud.test",
      role: "SECURITY_AUDITOR",
      lastLoginBS: "2083-05-06 09:00",
      status: "ACTIVE",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<SuperAdminStaff["role"]>("SUPPORT_ENGINEER");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: SuperAdminStaff = {
      id: `sa-${Date.now()}`,
      name: newName,
      username: newUsername.toLowerCase(),
      email: newEmail,
      role: newRole,
      lastLoginBS: "Never Logged In",
      status: "ACTIVE",
    };
    setStaffList([newStaff, ...staffList]);
    setShowAddModal(false);
    setNewName("");
    setNewUsername("");
    setNewEmail("");
    setSuccessMsg(`Super Admin staff "${newName}" provisioned successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-[#1A1306]">
            <Users size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-bold text-text">
              Super Admin Staff & Platform Operators (प्लेटफर्म व्यवस्थापक कर्मचारी)
            </h2>
            <p className="text-[12px] text-text-muted">
              Manage platform headquarters personnel, system engineers, billing managers, and compliance auditors.
            </p>
          </div>
        </div>

        <PrimaryButton onClick={() => setShowAddModal(true)} className="text-[13px] px-4 py-2.5">
          <UserPlus size={16} /> Add Super Admin Staff
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
          label="Super Admin Personnel"
          value={`${staffList.length} Operators`}
          icon={ShieldCheck}
          tone="accent"
        />
        <StatCard
          label="Active 2FA Enforced"
          value="100% Security"
          icon={Lock}
          tone="success"
        />
        <StatCard
          label="Security Auditing"
          value="Real-time Stream"
          icon={Shield}
          tone="text"
        />
        <StatCard
          label="Privileged Session Policy"
          value="12h Auto Timeout"
          icon={Clock}
          tone="text"
        />
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px] min-w-[700px]">
            <thead className="border-b border-border bg-surface-hi text-[11px] font-semibold uppercase tracking-wider text-text-muted font-data">
              <tr>
                <th className="px-4 py-3.5">OPERATOR NAME</th>
                <th className="px-3 py-3.5">USERNAME / EMAIL</th>
                <th className="px-3 py-3.5">PLATFORM ROLE</th>
                <th className="px-3 py-3.5">LAST ACTIVE (BS)</th>
                <th className="px-4 py-3.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-data">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-surface-hi/40 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-text font-body">
                    {s.name}
                  </td>
                  <td className="px-3 py-3.5 font-body">
                    <div className="font-mono text-accent font-semibold">@{s.username}</div>
                    <div className="text-[11px] text-text-muted">{s.email}</div>
                  </td>
                  <td className="px-3 py-3.5 font-body">
                    <Badge tone={s.role === "PLATFORM_SUPER_ADMIN" ? "accent" : "muted"}>
                      {s.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5 text-text-muted text-[11.5px]">
                    {s.lastLoginBS}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge tone="success">ACTIVE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleAddStaff}
            className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl p-6 space-y-4"
          >
            <div className="border-b border-border pb-3">
              <h3 className="font-display text-[16px] font-bold text-text">
                Add Super Admin Staff Member
              </h3>
              <p className="text-[12px] text-text-muted">
                Provision a platform-level headquarters operator.
              </p>
            </div>

            <Field label="Full Name" htmlFor="sName">
              <Input
                id="sName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ramesh Karki"
                required
              />
            </Field>

            <Field label="Username" htmlFor="sUser">
              <Input
                id="sUser"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. ramesh.support"
                required
              />
            </Field>

            <Field label="Work Email" htmlFor="sEmail">
              <Input
                id="sEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. ramesh@petrocloud.test"
                required
              />
            </Field>

            <div>
              <label className="text-[12px] font-medium text-text-muted block mb-1">
                Assigned Platform Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-bg p-2 text-[12.5px] text-text"
              >
                <option value="SUPPORT_ENGINEER">Support Specialist (e.g. Sita)</option>
                <option value="BILLING_ACCOUNTANT">Accountant & Billing Manager (e.g. Ram)</option>
                <option value="SECURITY_AUDITOR">Security & Compliance Auditor</option>
                <option value="PLATFORM_SUPER_ADMIN">Platform Super Admin (e.g. John)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <GhostButton type="button" onClick={() => setShowAddModal(false)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit">
                Provision Operator
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
