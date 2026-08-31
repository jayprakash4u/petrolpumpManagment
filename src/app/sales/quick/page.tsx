import { Zap, Info } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { MOCK_FUEL_OPTIONS } from "@/lib/mock/bills";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Badge } from "@/components/ui/Badge";
import { QuickSaleForm } from "@/components/billing/QuickSaleForm";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";

export default async function QuickSalePage() {
  const user = await requireUser();

  if (!can(user.role, "recordSale")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Quick Sale is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Your role doesn&apos;t include recording sales.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <StaticDataNotice />

      <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-border bg-surface px-[15px] py-[11px]">
        <Info size={15} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-[12.5px] text-text-muted">
          Quick Sale is for a queue: cash only, no customer lookup, keyboard-first. For a credit sale, a vehicle record
          or cash tendered, use <strong className="text-text">Billing → New Sale</strong>.
        </p>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle icon={Zap} title="Quick Sale" subtitle="Pick a fuel, type an amount, done" />
          <div className="hidden shrink-0 items-center gap-1.5 pt-1 sm:flex">
            <Badge tone="success">Cash only</Badge>
            <Badge tone="muted">No lookup</Badge>
          </div>
        </div>
        <QuickSaleForm fuels={MOCK_FUEL_OPTIONS} />
      </Card>
    </div>
  );
}
