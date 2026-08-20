import { Construction } from "lucide-react";

/**
 * Marks a screen whose numbers are sample data.
 *
 * These pages are being designed before their queries exist. Without a clear
 * marker, a plausible-looking register is indistinguishable from a real one —
 * and someone would eventually reconcile against figures that were never
 * anything but placeholders. It costs one line to remove when the data layer
 * lands.
 */
export function StaticDataNotice() {
  return (
    <div className="animate-fade-in mb-5 flex items-center gap-2 rounded-[10px] border border-accent/30 bg-accent/8 px-[15px] py-[11px]">
      <Construction size={16} className="shrink-0 text-accent" />
      <span className="text-[13px] text-text">
        <strong className="font-semibold">Sample data.</strong> This screen shows the layout and filters only — it is not
        connected to the database yet.
      </span>
    </div>
  );
}
