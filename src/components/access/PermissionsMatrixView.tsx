import { SlidersHorizontal, Check, Info } from "lucide-react";
import { type PermissionDefinition, PERMISSION_DEFINITIONS } from "@/lib/access";
import { Card } from "@/components/ui/Card";

const CATEGORIES: PermissionDefinition["category"][] = [
  "Sales & Cash",
  "Pumps & Forecourt",
  "Stock & Pricing",
  "Expenses & Accounts",
  "Operations & Admin",
];

/**
 * Read-only capability list, grouped by category. This used to be a matrix
 * with one column per role — with a single Pump Admin role, a table that
 * would render one column of identical checkmarks isn't a useful "matrix"
 * anymore, so it's a plain list of what a full-access login can do.
 */
export function PermissionsMatrixView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <SlidersHorizontal size={20} />
        </div>
        <div>
          <h3 className="font-display text-[16px] font-bold text-text">Full Capability List</h3>
          <p className="text-[12.5px] text-text-muted">
            Every station login has all of the capabilities below — there is no separate tier that has fewer.
          </p>
        </div>
      </div>

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

              <ul className="divide-y divide-border">
                {catPermissions.map((def) => (
                  <li key={def.key} className="flex items-start gap-3 p-3 text-[12.5px]">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                    <div>
                      <div className="font-semibold text-text">{def.name}</div>
                      <div className="text-[12px] text-text-muted mt-0.5">{def.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-[12.5px] text-text-muted flex items-start gap-3">
        <Info size={16} className="text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text block mb-0.5">No access restriction by role.</strong>
          <span>
            This station has one access level: every staff login can see and do everything. The job title on a
            staff record (set on the Employees page) is a label for the roster and audit trail only.
          </span>
        </div>
      </div>
    </div>
  );
}
