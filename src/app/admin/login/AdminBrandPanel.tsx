import { Fuel, Building2, Database, ShieldCheck, CreditCard, History, Layers } from "lucide-react";

const CAPABILITIES = [
  { code: "TEN", label: "Tenant onboarding & lifecycle", icon: Building2 },
  { code: "DB", label: "Database-per-pump isolation", icon: Database },
  { code: "SEC", label: "Suspension & account recovery", icon: ShieldCheck },
  { code: "BIL", label: "Billing & subscription plans", icon: CreditCard },
  { code: "MIG", label: "Schema migrations across tenants", icon: Layers },
  { code: "AUD", label: "Platform audit trail", icon: History },
] as const;

/** Marketing rail for the platform operator sign-in — fixed dark panel, theme-independent. */
export function AdminBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[#070d18] px-10 py-9 text-white lg:flex lg:flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-accent/15 blur-[100px]"
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Fuel size={17} color="#1A1306" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display text-[17px] font-bold tracking-tight">Fuel Nepal</span>
              <p className="font-data text-[10px] tracking-[0.12em] text-white/45 uppercase">Platform Console</p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-data text-[10px] tracking-wider text-white/55 uppercase">
            Operator access
          </div>
        </div>

        <div className="mt-16">
          <p className="font-data text-[11px] font-semibold tracking-[0.18em] text-indigo-300/80 uppercase">
            Multi-tenant control plane
          </p>
          <h1 className="mt-2 font-display text-[36px] font-bold leading-[1.12] tracking-tight">
            Manage every
            <br />
            <span className="text-accent">petrol pump</span> from one place
          </h1>
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/65">
            Onboard stations, monitor tenant health, run migrations, and recover owner access — without touching
            pump-side business data unless explicitly authorized.
          </p>
        </div>

        <div className="mt-12">
          <span className="font-data text-[10.5px] tracking-[0.2em] text-white/35 uppercase">Capabilities</span>
          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div
                key={item.code}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/8">
                  <item.icon size={15} className="text-accent" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <span className="font-data text-[10px] font-bold tracking-wide text-white/40">{item.code}</span>
                  <p className="text-[12.5px] leading-snug text-white/85">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-8 text-[11.5px] text-white/35">
          <span>Restricted to authorized platform operators</span>
          <span>© {new Date().getFullYear()} Fuel Nepal</span>
        </div>
      </div>
    </div>
  );
}
