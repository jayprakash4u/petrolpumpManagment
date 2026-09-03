import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PlatformPaymentsView } from "@/components/admin/PlatformPaymentsView";

export default async function AdminPaymentsPage() {
  await requirePlatformAdmin();
  return <PlatformPaymentsView />;
}
