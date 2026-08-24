"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  CheckCircle2,
  Lock,
  RotateCcw,
  Check,
  X,
  Info,
} from "lucide-react";
import type { Role } from "@prisma/client";
import {
  type PermissionDefinition,
  PERMISSION_DEFINITIONS,
  getPermissionsMatrix,
  updatePermissionRoles,
  resetPermissionsToDefault,
} from "@/lib/access";
import type { Permission } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";

const ROLES_ORDER: { key: Role; label: string; tone: string }[] = [
  { key: "OWNER", label: "Owner", tone: "text-accent" },
  { key: "MANAGER", label: "Manager", tone: "text-text" },
  { key: "CASHIER", label: "Cashier", tone: "text-text" },
  { key: "ATTENDANT", label: "Attendant", tone: "text-text" },
];

const CATEGORIES: PermissionDefinition["category"][] = [
  "Sales & Cash",
  "Stock & Pricing",
  "Customers & Credit",
  "Operations & Admin",
];

export function PermissionsMatrixView({
  currentUserRole,
}: {
  currentUserRole: Role;
}) {
  const [matrix, setMatrix] = useState<Record<Permission, Role[]>>(() => getPermissionsMatrix());
  const [notification, setNotification] = useState<{ type: "success" | "info"; message: string } | null>(null);

  const canEdit = currentUserRole === "OWNER";

  const handleToggle = (permission: Permission, role: Role) => {
    if (!canEdit) return;

    // Safety guard: Owner cannot lose manageUsers
    if (permission === "manageUsers" && role === "OWNER") {
      return;
    }

    const currentRoles = matrix[permission] || [];
    const hasRole = currentRoles.includes(role);
    const newRoles = hasRole ? currentRoles.filter((r) => r !== role) : [...currentRoles, role];

    const res = updatePermissionRoles(permission, newRoles);
    if (res.success) {
      setMatrix(getPermissionsMatrix());
      setNotification({ type: "success", message: res.message });
    }
  };

  const handleReset = () => {
    resetPermissionsToDefault();
    setMatrix(getPermissionsMatrix());
    setNotification({ type: "info", message: "Permissions restored to system default settings." });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className="animate-fade-in flex items-center justify-between rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="cursor-pointer text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Permissions & Capabilities Matrix</h3>
            <p className="text-[12.5px] text-text-muted">
              Turn capabilities on or off for each role. Sidebar navigation automatically adapts based on these permissions.
            </p>
          </div>
        </div>

        {canEdit ? (
          <GhostButton onClick={handleReset} className="text-[12.5px]">
            <RotateCcw size={13} /> Reset to Defaults
          </GhostButton>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-hi px-3 py-1.5 text-[12px] text-text-muted">
            <Lock size={13} /> Read-Only (Owner Controlled)
          </div>
        )}
      </div>

      {/* Matrix Table Grouped by Category */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const catPermissions = PERMISSION_DEFINITIONS.filter((p) => p.category === cat);

          return (
            <Card key={cat} className="overflow-hidden p-0">
              <div className="border-b border-border bg-surface-hi/60 px-4 py-2.5">
                <span className="font-display text-[13px] font-semibold text-text uppercase tracking-wider">
                  {cat}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-border bg-bg/50 font-medium text-text-muted">
                    <tr>
                      <th className="p-3 w-[45%]">Capability & Description</th>
                      {ROLES_ORDER.map((r) => (
                        <th key={r.key} className={`p-3 text-center w-[13.75%] ${r.tone}`}>
                          {r.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {catPermissions.map((def) => {
                      const grantedRoles = matrix[def.key] || [];

                      return (
                        <tr key={def.key} className="hover:bg-surface-hi/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-text">{def.name}</div>
                            <div className="text-[12px] text-text-muted mt-0.5">{def.description}</div>
                            <div className="font-data text-[10.5px] text-accent/80 mt-1">
                              Reveals: {def.sidebarMenu}
                            </div>
                          </td>

                          {ROLES_ORDER.map((r) => {
                            const isGranted = grantedRoles.includes(r.key);
                            const isLockedOwnerAdmin = def.key === "manageUsers" && r.key === "OWNER";

                            return (
                              <td key={r.key} className="p-3 text-center align-middle">
                                {isLockedOwnerAdmin ? (
                                  <span
                                    title="System Safety Guard: Owner must always have User Management permission."
                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-accent/20 text-accent cursor-not-allowed mx-auto"
                                  >
                                    <Lock size={13} />
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => handleToggle(def.key, r.key)}
                                    title={
                                      canEdit
                                        ? `Click to ${isGranted ? "revoke" : "grant"} ${def.name} for ${r.label}`
                                        : undefined
                                    }
                                    className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-all mx-auto ${
                                      !canEdit
                                        ? "cursor-default"
                                        : "cursor-pointer active:scale-95"
                                    } ${
                                      isGranted
                                        ? "bg-success/15 text-success hover:bg-success/25"
                                        : "bg-surface-hi text-text-muted/40 hover:bg-white/10 hover:text-text-muted"
                                    }`}
                                  >
                                    {isGranted ? <Check size={15} strokeWidth={2.5} /> : <X size={13} />}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Helpful Explanation Footer */}
      <div className="rounded-xl border border-border bg-surface p-4 text-[12.5px] text-text-muted flex items-start gap-3">
        <Info size={16} className="text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text block mb-0.5">How Permissions Work in Fuel Station Manager:</strong>
          <span>
            Every server action (e.g. creating sales, changing rates, recording expenses) validates against the server session role. When a capability is revoked from a role, its respective menu and action buttons are automatically hidden from staff with that role.
          </span>
        </div>
      </div>
    </div>
  );
}
