import { Fuel, Receipt, Boxes, CreditCard, Truck, Gauge, Clock, FileCheck2, BarChart3 } from "lucide-react";

const MODULES = [
  { code: "SAL", label: "Sales & Billing", icon: Receipt },
  { code: "TNK", label: "Tanks & Stock", icon: Boxes },
  { code: "CRD", label: "Credit Customers", icon: CreditCard },
  { code: "PUR", label: "Purchases & Suppliers", icon: Truck },
  { code: "MTR", label: "Meter Readings", icon: Gauge },
  { code: "SFT", label: "Shift Management", icon: Clock },
  { code: "IRD", label: "IRD Compliance", icon: FileCheck2 },
  { code: "RPT", label: "Reports & Accounts", icon: BarChart3 },
] as const;

/**
 * The marketing rail shown beside the sign-in form on larger screens.
 *
 * Deliberately a fixed dark panel regardless of the viewer's light/dark
 * preference — it is brand identity, not app chrome, the same way a poster
 * doesn't switch color scheme with the room lights. The sign-in side stays
 * theme-aware.
 */
export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0b1220] px-10 py-9 text-white lg:flex lg:flex-col">
      {/* Faint grid texture — brand backdrop, not decoration someone reads. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-[100px]"
      />

      <div className="relative flex flex-1 flex-col">
        {/* Top bar: wordmark + live status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Fuel size={17} color="#1A1306" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[17px] font-bold tracking-tight">Fuel Nepal</span>
          </div>
          <div className="flex items-center gap-1.5 font-data text-[10.5px] tracking-wider text-white/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            SYSTEM ONLINE
          </div>
        </div>

        {/* Headline */}
        <div className="mt-16">
          <h1 className="font-display text-[38px] font-bold leading-[1.1] tracking-tight">
            Modernize your
            <br />
            <span className="text-accent">fuel business</span>
          </h1>
          <p className="mt-3 font-data text-[11px] tracking-[0.15em] text-white/50 uppercase">By Fuel Nepal</p>
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/70">
            Real-time tank levels, credit ledgers that reconcile themselves, and IRD-ready tax invoices — so your
            attendants spend the shift at the pump, not re-entering the same sale three times.
          </p>
        </div>

        {/* Modules */}
        <div className="mt-12">
          <span className="font-data text-[10.5px] tracking-[0.2em] text-white/40 uppercase">Modules</span>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-3.5">
            {MODULES.map((m) => (
              <div key={m.code} className="flex items-center gap-2.5 border-b border-white/10 pb-3.5 text-[13px]">
                <span className="font-data w-8 shrink-0 text-[10.5px] font-bold tracking-wide text-accent">
                  {m.code}
                </span>
                <span className="text-white/85">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-10 text-[11.5px] text-white/40">
          <span>© {new Date().getFullYear()} Fuel Nepal</span>
          <span>Powered by Petro Cloud Technologies</span>
        </div>
      </div>
    </div>
  );
}
