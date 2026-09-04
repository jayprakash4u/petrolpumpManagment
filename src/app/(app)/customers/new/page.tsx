import { requireUser } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { CustomersSubnav } from "@/components/customers/CustomersSubnav";
import { AddNewCustomerView } from "@/components/customers/AddNewCustomerView";

export default async function NewCustomerPage() {
  const user = await requireUser();

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full min-w-0 animate-fade-in">
      <CustomersSubnav />
      <AddNewCustomerView canAdd={can(user.role, "manageCustomers")} />
    </div>
  );
}
