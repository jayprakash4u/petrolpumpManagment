import { requireUser } from "@/lib/dal";
import { getCreditCustomerDirectory } from "@/lib/queries/customers";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { CreditCustomersView } from "@/components/customers/CreditCustomersView";

export default async function CreditCustomersPage() {
  const user = await requireUser();
  const rows = await getCreditCustomerDirectory(user.stationId);

  return (
    <div className="space-y-4 w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <CreditCustomersView rows={rows} />
    </div>
  );
}
