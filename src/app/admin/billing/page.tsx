import { requirePlatformAdmin } from "@/lib/platform-dal";
import { TenantBillingView } from "@/components/admin/TenantBillingView";

export default async function AdminBillingPage() {
  await requirePlatformAdmin();
  return <TenantBillingView />;
}
