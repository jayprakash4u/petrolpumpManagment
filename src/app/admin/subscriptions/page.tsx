import { requirePlatformAdmin } from "@/lib/platform-dal";
import { CompanyPlansView } from "@/components/admin/CompanyPlansView";

export default async function AdminSubscriptionsPage() {
  await requirePlatformAdmin();
  return <CompanyPlansView />;
}
