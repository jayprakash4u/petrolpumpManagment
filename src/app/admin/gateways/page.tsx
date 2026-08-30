import { requirePlatformAdmin } from "@/lib/platform-dal";
import { PaymentGatewaysView } from "@/components/admin/PaymentGatewaysView";

export default async function PaymentGatewaysPage() {
  await requirePlatformAdmin();
  return <PaymentGatewaysView />;
}
