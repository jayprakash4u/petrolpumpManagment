import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt as ReceiptIcon } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { MOCK_BILLS } from "@/lib/mock/bills";
import { FUEL_LABEL } from "@/lib/fuel";
import { formatVehicleNo } from "@/lib/vehicle";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Badge } from "@/components/ui/Badge";
import { StaticDataNotice } from "@/components/billing/StaticDataNotice";
import { PrintButton } from "@/components/billing/PrintButton";

/**
 * A single bill.
 *
 * This is a route, not a menu item — a competitor lists "View bill details"
 * twice in its sidebar, which is what happens when a detail view has no
 * natural way to be reached. Here it is reached by clicking a receipt number
 * in the register, the way a detail page should be.
 */
export default async function BillDetailPage({ params }: PageProps<"/sales/bills/[id]">) {
  await requireUser();
  const { id } = await params;

  const bill = MOCK_BILLS.find((b) => b.id === id);
  if (!bill) notFound();

  const line = (label: string, value: string, strong = false) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2">
      <span className="text-[12.5px] text-text-muted">{label}</span>
      <span className={strong ? "font-data text-[16px] font-semibold text-accent" : "font-data text-[13px] text-text"}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="mx-auto max-w-[680px]">
      <StaticDataNotice />

      <Link href="/sales/bills" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text">
        <ArrowLeft size={14} />
        Back to register
      </Link>

      <Card>
        <div className="mb-4 flex items-start justify-between gap-3">
          <SectionTitle icon={ReceiptIcon} title={`Bill #${bill.receiptNo}`} subtitle={`${bill.dateBS} · ${bill.time}`} />
          <div className="flex items-center gap-2">
            {bill.voided ? <Badge tone="error">VOIDED</Badge> : <Badge tone="success">LIVE</Badge>}
            <PrintButton />
          </div>
        </div>

        {bill.voided && bill.voidReason && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error/8 px-3 py-2 text-[12.5px] text-error">
            Voided — {bill.voidReason}. The fuel was returned to the tank and any credit charge reversed.
          </div>
        )}

        <div className="print-area rounded-lg border border-border bg-bg p-4">
          {line("Fuel", FUEL_LABEL[bill.fuel])}
          {line("Rate", `${bill.rate}/L`)}
          {line("Volume", bill.liters)}
          {line("Total", bill.amount, true)}
          {line("Payment", bill.payment === "CASH" ? "Cash" : "Credit")}
          {bill.customer && line("Billed to", bill.customer)}
          {line("Vehicle", bill.vehicleNo ? formatVehicleNo(bill.vehicleNo) : "not recorded")}
          {line("Sold by", bill.soldBy)}
        </div>
      </Card>
    </div>
  );
}
