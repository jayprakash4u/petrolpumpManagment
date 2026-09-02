import Link from "next/link";
import { Users, UserPlus, Clock, TrendingUp, History } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { getEmployeesPageData } from "@/lib/queries/employees";
import { isRangeKey, RANGE_LABEL, type RangeKey } from "@/lib/staff";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { StaffRoster, ShiftLog } from "@/components/employees/StaffRoster";
import { AddEmployeeForm } from "@/components/employees/UserAdmin";
import { fmtRs } from "@/lib/money";

const RANGES: RangeKey[] = ["today", "7d", "30d"];

export default async function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  const user = await requireUser();

  // The window is a plain link-driven search param rather than client state:
  // the aggregation happens in SQL, so switching range is a server render, not
  // a re-filter in the browser.
  const params = await searchParams;
  const raw = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: RangeKey = isRangeKey(raw) ? raw : "today";

  const data = await getEmployeesPageData(user.stationId, range);

  const canSeeFigures = can(user.role, "viewReports");
  const canManageUsers = can(user.role, "manageUsers");
  const canManageOthers = can(user.role, "manageOtherShifts");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-text-muted">Performance window:</span>
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/employees?range=${r}`}
            className={
              "font-display rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors " +
              (r === range
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-text-muted hover:text-text")
            }
          >
            {RANGE_LABEL[r]}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Staff" value={String(data.activeCount)} icon={Users} tone="text" />
        <StatCard label="On Shift Now" value={String(data.onShiftCount)} icon={Clock} tone="success" />
        {canSeeFigures ? (
          <>
            <StatCard label={`Revenue · ${RANGE_LABEL[range]}`} value={fmtRs(data.stationRevenue)} icon={TrendingUp} tone="accent" small />
            <StatCard label="Sales Recorded" value={String(data.totalSales)} icon={History} tone="text" />
          </>
        ) : (
          <StatCard label="Your Shift" value={data.staff.find((s) => s.id === user.id)?.onShift ? "Open" : "Off"} icon={Clock} tone="text" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle
              icon={Users}
              title="Staff Roster"
              subtitle={canSeeFigures ? `Sales performance for ${RANGE_LABEL[range].toLowerCase()}` : "Who's on shift right now"}
            />
            <StaffRoster
              staff={data.staff}
              currentUserId={user.id}
              canSeeFigures={canSeeFigures}
              canManageOthers={canManageOthers}
              canManageUsers={canManageUsers}
            />
          </Card>

          <Card>
            <SectionTitle icon={History} title="Shift Log" subtitle={`Shifts started in the ${RANGE_LABEL[range].toLowerCase()}`} />
            <ShiftLog shifts={data.recentShifts} />
          </Card>
        </div>

        {canManageUsers && (
          <Card className="h-fit">
            <SectionTitle icon={UserPlus} title="Add Employee" subtitle="Creates a login for this station" />
            <AddEmployeeForm />
          </Card>
        )}
      </div>
    </div>
  );
}
