import { requireUser } from "@/lib/dal";
import { getStationInvoiceConfigAction } from "@/lib/actions/invoice-settings";
import { InvoiceSettingsView } from "@/components/system/InvoiceSettingsView";

export default async function InvoiceSettingsPage() {
  await requireUser();
  const config = await getStationInvoiceConfigAction();

  return <InvoiceSettingsView initialConfig={config} />;
}
