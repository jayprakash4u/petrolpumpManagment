"use client";

import { useActionState, useState } from "react";
import { UserPlus, ShieldCheck, Lock, Info, RotateCcw, CheckCircle2, Search } from "lucide-react";
import { clsx } from "clsx";
import type { Role, Permission } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/permissions";
import {
  PERMISSION_GROUPS,
  permissionsInGroup,
  permissionMeta,
  defaultPermissionsFor,
  isFullAccessRole,
  diffFromTemplate,
} from "@/lib/permission-catalogue";
import { createUserAction, type UserFormState } from "@/lib/actions/users";
import { Field, Input, Select } from "@/components/ui/Field";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const ROLES: Role[] = ["CASHIER", "ACCOUNTANT", "ATTENDANT", "MANAGER", "OTHER", "OWNER"];

const ROLE_HINT: Record<Role, string> = {
  OWNER: "Station Admin: 100% full access to this station, always — no checkboxes needed",
  MANAGER: "Station Manager: Day-to-day operations, pricing, deliveries, customers, and shift logs",
  CASHIER: "Shift Cashier: Sales billing, customer payments, cash drawer, and own shift",
  ACCOUNTANT: "Station Accountant: Sales view, expense vouchers, ledgers, financial & tax reports",
  ATTENDANT: "Pump Operator: Assigned nozzle pumps, meter readings, walk-in sales, and own shift",
  OTHER: "Other Staff: Flexible profile for forecourt assistants or specialized staff",
};

const initialState: UserFormState = {};

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createUserAction, initialState);
  const [role, setRole] = useState<Role>("CASHIER");
  const [selected, setSelected] = useState<Set<Permission>>(() => defaultPermissionsFor("CASHIER"));
  const [searchQuery, setSearchQuery] = useState("");

  const fullAccess = isFullAccessRole(role);
  const diff = diffFromTemplate(role, selected);

  function changeRole(next: Role) {
    setRole(next);
    setSelected(defaultPermissionsFor(next));
  }

  function toggle(key: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAllInGroup(group: typeof PERMISSION_GROUPS[number]) {
    const items = permissionsInGroup(group).filter((p) => !p.escalating);
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.add(item.key));
      return next;
    });
  }

  function deselectAllInGroup(group: typeof PERMISSION_GROUPS[number]) {
    const items = permissionsInGroup(group).filter((p) => !p.escalating);
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach((item) => next.delete(item.key));
      return next;
    });
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* ---------------- 1. Basic Information ---------------- */}
      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <h3 className="font-display text-[14.5px] font-bold text-text">1. Basic Information</h3>
          <p className="text-[12px] text-text-muted">General employee profile and login identity</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name *" htmlFor="staffName">
            <Input id="staffName" name="name" required autoComplete="off" placeholder="e.g. Ramesh Thapa" />
          </Field>
          <Field label="Username (Login ID) *" htmlFor="staffUsername">
            <Input id="staffUsername" name="username" required autoComplete="off" placeholder="e.g. ramesh" />
          </Field>
          <Field label="Phone (Mobile)" htmlFor="staffPhone">
            <Input id="staffPhone" name="phone" inputMode="tel" placeholder="e.g. 98410 22310" />
          </Field>
          <Field label="Employee ID" htmlFor="staffEmpId">
            <Input id="staffEmpId" name="employeeId" placeholder="e.g. EMP-014" />
          </Field>
          <Field label="Email (Optional)" htmlFor="staffEmail">
            <Input id="staffEmail" name="email" type="email" placeholder="Contact only — not used to sign in" />
          </Field>
          <Field label="Temporary Password *" htmlFor="staffPassword">
            <Input
              id="staffPassword"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
        </div>

        <div>
          <Field label="Role (Job Profile & Starting Template)" htmlFor="staffRole">
            <Select id="staffRole" name="role" value={role} onChange={(e) => changeRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]} {r === "OWNER" ? "(Full 100% Station Access)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-1 text-[11.5px] text-text-muted">{ROLE_HINT[role]}</p>
        </div>
      </div>

      {/* ---------------- 2. Access / Permissions ---------------- */}
      <div className="border-t border-border pt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <div>
              <span className="font-display text-[14.5px] font-bold text-text">2. Access & Permissions</span>
              <span className="ml-2 text-[12px] text-text-muted">
                (Role sets default template — customize access for this person)
              </span>
            </div>
            {diff.isCustomised && !fullAccess && <Badge tone="accent">CUSTOMIZED</Badge>}
          </div>

          {!fullAccess && (
            <div className="flex items-center gap-2">
              {diff.isCustomised && (
                <GhostButton
                  type="button"
                  onClick={() => setSelected(defaultPermissionsFor(role))}
                  className="px-2.5 py-1.5 text-[12px]"
                >
                  <RotateCcw size={12} />
                  Reset to {ROLE_LABEL[role]} defaults
                </GhostButton>
              )}
            </div>
          )}
        </div>

        {fullAccess ? (
          <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
            <Lock size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <h4 className="font-display text-[13.5px] font-bold text-text">
                Station Admin has 100% Full Access
              </h4>
              <p className="mt-1 text-[12.5px] text-text-muted">
                A Station Admin (Owner) automatically possesses unrestricted authority across all station operations,
                hardware controls, pricing, accounting, and user management. There are no checkboxes to choose.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-hi/40 p-2.5">
              <p className="text-[12px] text-text-muted">
                Ticked checkboxes represent granted capabilities. Station Admin can add or remove any permissions before creating.
              </p>
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg py-1 pl-8 pr-2.5 text-[12px] text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => {
                let items = permissionsInGroup(group).filter((p) => !p.escalating);
                if (searchQuery.trim()) {
                  items = items.filter(
                    (p) =>
                      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.description.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                }
                if (items.length === 0) return null;

                const allChecked = items.every((i) => selected.has(i.key));

                return (
                  <div key={group} className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
                    <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-1.5">
                      <span className="font-display text-[12px] font-bold text-text tracking-wide">
                        {group.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => (allChecked ? deselectAllInGroup(group) : selectAllInGroup(group))}
                          className="text-accent hover:underline"
                        >
                          {allChecked ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {items.map((meta) => {
                        const checked = selected.has(meta.key);
                        const inTemplate = defaultPermissionsFor(role).has(meta.key);
                        const changed = checked !== inTemplate;

                        return (
                          <label
                            key={meta.key}
                            className={clsx(
                              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors",
                              checked ? "border-accent/30 bg-accent/5" : "border-border/70 hover:bg-white/5",
                              changed && "ring-1 ring-accent/30"
                            )}
                          >
                            <input
                              type="checkbox"
                              name="permissions"
                              value={meta.key}
                              checked={checked}
                              onChange={() => toggle(meta.key)}
                              className="mt-0.5 h-4 w-4 rounded accent-[color:var(--color-accent)]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[12.5px] font-semibold text-text">{meta.label}</span>
                                {changed && (
                                  <span
                                    className={clsx(
                                      "font-data text-[9.5px] font-bold tracking-wide px-1.5 py-0.5 rounded",
                                      checked ? "bg-success/15 text-success" : "bg-error/15 text-error"
                                    )}
                                  >
                                    {checked ? "+ ADDED" : "− REMOVED"}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-text-muted leading-relaxed">{meta.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border bg-bg p-3">
              <Info size={14} className="mt-0.5 shrink-0 text-text-muted" />
              <p className="text-[11.5px] text-text-muted">
                <strong className="text-text">Administrative escalation safety:</strong> Managing staff accounts and station
                settings remain restricted to the Station Admin to ensure high-security multi-tenant boundaries.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden JSON serialization of selected permissions */}
      <input
        type="hidden"
        name="permissionsJson"
        value={fullAccess ? "" : JSON.stringify(Array.from(selected))}
      />

      {/* Difference summary if customized */}
      {!fullAccess && diff.isCustomised && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5">
          <div className="font-data mb-1 text-[11px] font-bold tracking-wider text-accent">
            SUMMARY OF CUSTOMIZATIONS VS {ROLE_LABEL[role].toUpperCase()} TEMPLATE
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {diff.added.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 rounded bg-success/10 px-2 py-1 font-medium text-success">
                + {permissionMeta(k).label}
              </span>
            ))}
            {diff.removed.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 rounded bg-error/10 px-2 py-1 font-medium text-error">
                − {permissionMeta(k).label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {state.error && (
        <div role="alert" className="animate-fade-in rounded-xl border border-error/30 bg-error/10 p-3.5 text-[13px] text-error">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      {state.message && (
        <div className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-[13px] text-success">
          <CheckCircle2 size={16} className="shrink-0" />
          <span><strong>Success!</strong> {state.message}</span>
        </div>
      )}

      <PrimaryButton type="submit" disabled={pending} className="w-full py-3.5 text-[14.5px]">
        <UserPlus size={16} />
        {pending ? "Creating Staff Account..." : "Create Staff Account & Grant Access"}
      </PrimaryButton>
    </form>
  );
}
