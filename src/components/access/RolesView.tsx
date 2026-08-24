"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Crown,
  Briefcase,
  Wallet,
  Users,
  Check,
  ArrowRight,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { STATION_ROLES, getRoleActivePermissions } from "@/lib/access";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GhostButton } from "@/components/ui/Button";

const ROLE_ICONS: Record<Role, React.ComponentType<{ size?: number; className?: string }>> = {
  OWNER: Crown,
  MANAGER: Briefcase,
  CASHIER: Wallet,
  ATTENDANT: Users,
};

export function RolesView() {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-text">Station Access Roles</h3>
            <p className="text-[12.5px] text-text-muted">
              4 distinct access levels designed for petrol pump operations. Each role grants specific capabilities.
            </p>
          </div>
        </div>

        <Link href="/access/permissions">
          <GhostButton className="text-[12.5px]">
            Open Permissions Matrix <ArrowRight size={13} />
          </GhostButton>
        </Link>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STATION_ROLES.map((roleInfo) => {
          const Icon = ROLE_ICONS[roleInfo.role];
          const activePerms = getRoleActivePermissions(roleInfo.role);

          return (
            <Card key={roleInfo.role} className="flex flex-col justify-between p-5 space-y-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-display text-[16px] font-bold text-text">{roleInfo.name}</h4>
                      <span className="font-data text-[11px] text-text-muted uppercase">ROLE: {roleInfo.role}</span>
                    </div>
                  </div>

                  <Badge tone={roleInfo.badgeTone}>{activePerms.length} / 10 Permissions</Badge>
                </div>

                <p className="text-[13px] text-text-muted leading-relaxed">{roleInfo.summary}</p>

                {/* Key Responsibilities */}
                <div className="rounded-xl border border-border bg-bg p-3.5 space-y-2">
                  <span className="text-[11.5px] font-semibold text-text uppercase tracking-wider block">
                    Core Responsibilities:
                  </span>
                  <ul className="space-y-1.5 text-[12.5px] text-text-muted">
                    {roleInfo.responsibilities.map((resp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-success shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Active Capabilities Badges */}
                <div>
                  <span className="text-[11.5px] font-medium text-text-muted block mb-1.5">
                    Granted Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activePerms.map((perm) => (
                      <span
                        key={perm.key}
                        className="rounded-md bg-surface-hi px-2 py-0.5 font-data text-[11px] text-text font-medium"
                      >
                        {perm.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-border/80 pt-3 text-[12px]">
                <Link href="/employees" className="font-medium text-accent hover:underline flex items-center gap-1">
                  Manage Employees in Roster <ArrowRight size={12} />
                </Link>
                <Link href="/access/permissions" className="text-text-muted hover:text-text">
                  Edit in Matrix →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
