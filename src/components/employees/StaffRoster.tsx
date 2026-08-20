import { clsx } from "clsx";
import type { Role } from "@prisma/client";
import type { EmployeesPageData } from "@/lib/queries/employees";
import { ROLE_LABEL } from "@/lib/permissions";
import { initials, fmtDuration } from "@/lib/staff";
import { fmtRs, fmtL } from "@/lib/money";
import { fmtBSDateTime } from "@/lib/bs-date";
import { Badge, type Tone } from "@/components/ui/Badge";
import { ShiftButton } from "./ShiftButton";
import { ActiveToggle, RoleSelect } from "./UserAdmin";

const ROLE_TONE: Record<Role, Tone> = {
  OWNER: "accent",
  MANAGER: "accent",
  CASHIER: "success",
  ATTENDANT: "muted",
};

/**
 * The roster. Everyone sees who's on shift; only a manager or owner sees
 * per-head sales figures, and only an owner sees the admin controls — the
 * page passes those flags down from a server-verified role, and every action
 * re-checks them anyway.
 */
export function StaffRoster({
  staff,
  currentUserId,
  canSeeFigures,
  canManageOthers,
  canManageUsers,
}: {
  staff: EmployeesPageData["staff"];
  currentUserId: string;
  canSeeFigures: boolean;
  canManageOthers: boolean;
  canManageUsers: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {staff.map((s) => {
        const isSelf = s.id === currentUserId;
        const showShiftButton = isSelf || canManageOthers;

        return (
          <div
            key={s.id}
            className={clsx(
              "rounded-xl border bg-bg p-3.5",
              s.onShift ? "border-success/30" : "border-border",
              !s.active && "opacity-55"
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={clsx(
                  "font-data flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                  s.onShift ? "bg-success/15 text-success" : "bg-surface-hi text-text-muted"
                )}
              >
                {initials(s.name)}
              </div>

              <div className="min-w-[150px] flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[14.5px] font-semibold text-text">{s.name}</span>
                  {isSelf && <span className="font-data text-[10px] tracking-wide text-accent">YOU</span>}
                </div>
                <div className="font-data mt-0.5 text-[11.5px] text-text-muted">{s.username}</div>
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={ROLE_TONE[s.role]}>{ROLE_LABEL[s.role].toUpperCase()}</Badge>
                {!s.active ? (
                  <Badge tone="error">INACTIVE</Badge>
                ) : s.onShift ? (
                  <Badge tone="success">ON SHIFT · {fmtDuration(s.onShiftMinutes)}</Badge>
                ) : (
                  <Badge tone="muted">OFF</Badge>
                )}
              </div>

              {s.active && showShiftButton && (
                <div className="ml-auto">
                  <ShiftButton userId={s.id} onShift={s.onShift} compact />
                </div>
              )}
            </div>

            {canSeeFigures && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 sm:grid-cols-5">
                <Figure label="Revenue" value={fmtRs(s.revenue)} accent />
                <Figure label="Sales" value={String(s.saleCount)} />
                <Figure label="Volume" value={fmtL(s.liters)} />
                <Figure label="Avg sale" value={s.averageSale ? fmtRs(s.averageSale) : "—"} />
                <Figure label="Share" value={`${s.sharePct.toString()}%`} />
              </div>
            )}

            {canManageUsers && (
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                <RoleSelect userId={s.id} role={s.role} />
                <ActiveToggle userId={s.id} active={s.active} name={s.name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Figure({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className={clsx("font-data text-[13.5px] font-semibold", accent ? "text-accent" : "text-text")}>{value}</div>
    </div>
  );
}

/** Recent shifts, so a manager can see who was on the floor when something happened. */
export function ShiftLog({ shifts }: { shifts: EmployeesPageData["recentShifts"] }) {
  if (shifts.length === 0) {
    return <p className="py-8 text-center text-[13.5px] text-text-muted">No shifts started in this period.</p>;
  }

  const when = (d: Date) =>
    fmtBSDateTime(d);

  return (
    <ul className="flex flex-col gap-2">
      {shifts.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5">
          <Badge tone={s.endedAt ? "muted" : "success"}>{s.endedAt ? "ENDED" : "OPEN"}</Badge>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] text-text">{s.user.name}</div>
            <div className="font-data text-[11px] text-text-muted">
              {when(s.startedAt)}
              {s.endedAt && ` → ${when(s.endedAt)}`}
            </div>
          </div>
          <div className="text-right">
            <div className="font-data text-[12.5px] font-semibold text-text">{fmtDuration(s.minutes)}</div>
            {s.endedBy && <div className="text-[10.5px] text-text-muted">ended by {s.endedBy.name}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
