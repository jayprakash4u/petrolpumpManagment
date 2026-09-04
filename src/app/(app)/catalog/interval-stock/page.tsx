import { requireUser } from "@/lib/dal";
import { CatalogSubnav } from "@/components/catalog/CatalogSubnav";
import { IntervalStockReportView } from "@/components/catalog/IntervalStockReportView";

export default async function IntervalStockPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl w-full animate-fade-in space-y-4">
      <CatalogSubnav />
      <IntervalStockReportView />
    </div>
  );
}
