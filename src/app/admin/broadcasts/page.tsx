import { requirePlatformAdmin } from "@/lib/platform-dal";
import { RegionalPriceUpdatesView } from "@/components/admin/RegionalPriceUpdatesView";

export default async function RegionalPriceUpdatesPage() {
  await requirePlatformAdmin();
  return <RegionalPriceUpdatesView />;
}
