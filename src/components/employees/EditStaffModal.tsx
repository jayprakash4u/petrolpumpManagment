"use client";

import { useActionState, useState } from "react";
import { ShieldCheck, Lock, RotateCcw, CheckCircle2, X, SlidersHorizontal } from "lucide-react";
import { clsx } from "clsx";
import type { Role, Permission } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/permissions";
import {
  PERMISSION_GROUPS,
  permissionsInGroup,
  defaultPermissionsFor,
  isFullAccessRole,
  diffFromTemplate,
} from "@/lib/permission-catalogue";
import { updateUserPermissionsAction, type UserFormState } from "@/lib/actions/users";
import { PrimaryButton, GhostButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const initialState: UserFormState = {};

export interface EditStaffModalProps {
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
    phone?: string | null;
    employeeId?: string | null;
    permissions?: string | null;
  };
  onClose: () => void;
}

export function EditStaffModal({ user, onClose }: EditStaffModalProps) {
  const role = user.role as Role;
  const fullAccess = isFullAccessRole(role);

  // Initialize selected permissions from stored custom permissions or role default template
  const [selected, setSelected] = useState<Set<Permission>>(() => {
    if (user.permissions) {
      try {
        const parsed = JSON.parse(user.permissions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return new Set<Permission>(parsed as Permission[]);
        }
      } catch {}
    }
    return defaultPermissionsFor(role);
  });

  const [state, action, pending] = useActionState(updateUserPermissionsAction, initialState);
  const diff = diffFromTemplate(role, selected);

  function toggle(key: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetToTemplate() {
    setSelected(defaultPermissionsFor(role));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface shadow-2xl animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[16px] font-bold text-text">Edit Staff Access & Permissions</h3>
                {diff.isCustomised && !fullAccess && <Badge tone="accent">CUSTOMIZED</Badge>}
              </div>
              <p className="text-[12px] text-text-muted">
                {user.name} ({user.username}) · <span className="font-semibold text-text">{ROLE_LABEL[role] || role}</span>
                {user.employeeId ? ` · ${user.employeeId}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hi hover:text-text"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {fullAccess ? (
            <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
              <Lock size={18} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <h4 className="font-display text-[13.5px] font-bold text-text">
                  Station Admin has 100% Full Access
                </h4>
                <p className="mt-1 text-[12.5px] text-text-muted">
                  The Station Admin (Owner) role has unrestricted station authority and cannot be restricted.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-hi/40 p-2.5">
                <span className="text-[12px] text-text-muted">
                  Toggle capabilities for <strong>{user.name}</strong>:
                </span>
                {diff.isCustomised && (
                  <GhostButton type="button" onClick={resetToTemplate} className="px-2.5 py-1 text-[11.5px]">
                    <RotateCcw size={12} />
                    Reset to {ROLE_LABEL[role]} Defaults
                  </GhostButton>
                )}
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const items = permissionsInGroup(group).filter((p) => !p.escalating);
                  if (items.length === 0) return null;

                  return (
                    <div key={group} className="rounded-xl border border-border bg-bg p-3.5 shadow-xs">
                      <div className="font-display mb-2 border-b border-border/60 pb-1 text-[11.5px] font-bold tracking-wider text-text-muted">
                        {group.toUpperCase()}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {items.map((meta) => {
                          const checked = selected.has(meta.key);
                          const inTemplate = defaultPermissionsFor(role).has(meta.key);
                          const changed = checked !== inTemplate;

                          return (
                            <label
                              key={meta.key}
                              className={clsx(
                                "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2 text-[12px] transition-colors",
                                checked ? "border-accent/30 bg-accent/5 text-text font-medium" : "border-border/60 text-text-muted",
                                changed && "ring-1 ring-accent/30"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(meta.key)}
                                className="mt-0.5 h-3.5 w-3.5 rounded accent-[color:var(--color-accent)]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span>{meta.label}</span>
                                  {changed && (
                                    <span className="font-data text-[9px] font-bold text-accent">
                                      {checked ? "+ADDED" : "−REMOVED"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {state.error && (
            <div role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3 text-[12.5px] text-error">
              {state.error}
            </div>
          )}

          {state.message && (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-[12.5px] text-success">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{state.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <form action={action} className="flex items-center justify-between border-t border-border p-4">
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="hidden"
            name="permissionsJson"
            value={fullAccess ? "" : JSON.stringify(Array.from(selected))}
          />

          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>

          {!fullAccess && (
            <PrimaryButton type="submit" disabled={pending} className="px-5 py-2">
              <ShieldCheck size={15} />
              {pending ? "Saving..." : "Save Permissions"}
            </PrimaryButton>
          )}
        </form>
      </div>
    </div>
  );
}
