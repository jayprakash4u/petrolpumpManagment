import Link from "next/link";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { billQueryString, hasActiveFilter, type BillFilters } from "@/lib/bill-filters";
import { PRESETS, PRESET_LABEL } from "@/lib/reports";
import { Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/Button";

/**
 * Filter bar for the billing screens.
 *
 * Every control is a plain link or a GET form, so each filtered view is a real
 * shareable URL and the whole thing works without client JavaScript. That also
 * means the browser back button does what a user expects, which client-side
 * filter state usually breaks.
 */
export function BillFilterBar({
  basePath,
  filters,
  showStatus = true,
  showVehicle = false,
}: {
  basePath: string;
  filters: BillFilters;
  showStatus?: boolean;
  showVehicle?: boolean;
}) {
  const chip = (active: boolean) =>
    clsx(
      "font-display rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
      active ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text"
    );

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11.5px] text-text-muted">Period</span>
        {PRESETS.map((p) => (
          <Link key={p} href={`${basePath}${billQueryString(filters, { preset: p, from: null, to: null })}`} className={chip(filters.range.preset === p)}>
            {PRESET_LABEL[p]}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11.5px] text-text-muted">Fuel</span>
        <Link href={`${basePath}${billQueryString(filters, { fuel: null })}`} className={chip(filters.fuel === null)}>
          All
        </Link>
        {(["PETROL", "DIESEL", "CNG"] as const).map((f) => (
          <Link key={f} href={`${basePath}${billQueryString(filters, { fuel: f })}`} className={chip(filters.fuel === f)}>
            {f === "CNG" ? "CNG" : f.charAt(0) + f.slice(1).toLowerCase()}
          </Link>
        ))}

        <span className="mr-1 ml-3 text-[11.5px] text-text-muted">Payment</span>
        <Link href={`${basePath}${billQueryString(filters, { payment: null })}`} className={chip(filters.payment === null)}>
          All
        </Link>
        {(["CASH", "CREDIT"] as const).map((p) => (
          <Link key={p} href={`${basePath}${billQueryString(filters, { payment: p })}`} className={chip(filters.payment === p)}>
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </Link>
        ))}

        {showStatus && (
          <>
            <span className="mr-1 ml-3 text-[11.5px] text-text-muted">Status</span>
            {(["all", "active", "voided"] as const).map((s) => (
              <Link key={s} href={`${basePath}${billQueryString(filters, { status: s })}`} className={chip(filters.status === s)}>
                {s === "all" ? "All" : s === "active" ? "Live" : "Voided"}
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <form method="GET" action={basePath} className="flex flex-wrap items-end gap-2">
          {/* Carried through as hidden fields, so searching does not silently
              throw away the period and fuel the user already chose. */}
          {filters.range.preset !== "custom" && <input type="hidden" name="preset" value={filters.range.preset} />}
          {filters.fuel && <input type="hidden" name="fuel" value={filters.fuel} />}
          {filters.payment && <input type="hidden" name="payment" value={filters.payment} />}
          {filters.status !== "all" && <input type="hidden" name="status" value={filters.status} />}

          <label className="flex flex-col gap-1 text-[11.5px] text-text-muted">
            Receipt no. or customer
            <Input name="q" defaultValue={filters.search} placeholder="112 or Everest" className="w-52 py-1.5 text-[12px]" />
          </label>

          {showVehicle && (
            <label className="flex flex-col gap-1 text-[11.5px] text-text-muted">
              Vehicle
              <Input name="vehicle" defaultValue={filters.vehicleNo ?? ""} placeholder="BA 2 KHA 1234" className="w-44 py-1.5 text-[12px]" />
            </label>
          )}

          <PrimaryButton type="submit" className="px-3 py-1.5 text-[12px]">
            Search
          </PrimaryButton>
        </form>

        {hasActiveFilter(filters) && (
          <Link
            href={basePath}
            className="font-display inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-text-muted hover:text-text"
          >
            <X size={12} />
            Clear filters
          </Link>
        )}
      </div>
    </div>
  );
}
