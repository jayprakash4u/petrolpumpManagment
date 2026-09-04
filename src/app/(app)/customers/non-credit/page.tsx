import { requireUser } from "@/lib/dal";
import { getNonCreditCustomers } from "@/lib/queries/customers";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { NonCreditCustomersView } from "@/components/customers/NonCreditCustomersView";

export default async function NonCreditCustomersPage() {
  const user = await requireUser();
  const rows = await getNonCreditCustomers(user.stationId);

  return (
    <div className="space-y-4 w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <NonCreditCustomersView rows={rows} />
    </div>
  );
}
