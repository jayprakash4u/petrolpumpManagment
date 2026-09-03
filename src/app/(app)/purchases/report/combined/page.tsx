import { FileBarChart2 } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { PurchaseRegisterView } from "@/components/purchases/PurchaseRegisterView";
import { getPurchaseRegisterData, parsePurchaseRegisterFilters, recentFiscalYears } from "@/lib/queries/purchase-register";

export default async function PetrolDieselPurchaseReportPage({ searchParams }: PageProps<"/purchases/report/combined">) {
  const user = await requireUser();

  if (!can(user.role, "viewReports")) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <h2 className="font-display text-[17px] font-semibold text-text">Purchase register is restricted</h2>
        <p className="mt-1.5 text-[13.5px] text-text-muted">Only an owner or manager can view this report.</p>
      </Card>
    );
  }

  const params = await searchParams;
  const filters = parsePurchaseRegisterFilters(params);
  const data = await getPurchaseRegisterData(filters);

  return (
    <div>
      <PurchaseSubnav />

      <Card>
        <SectionTitle
          icon={FileBarChart2}
          title="Petrol Diesel Purchase Report"
          subtitle="Petrol and Diesel bills together — subtotal, VAT, and landed total"
        />
        <PurchaseRegisterView data={data} filters={filters} fiscalYears={recentFiscalYears()} />
      </Card>
    </div>
  );
}
