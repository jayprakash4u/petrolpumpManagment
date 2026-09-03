import { UserPlus } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { Card } from "@/components/ui/Card";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PurchaseSubnav } from "@/components/purchases/PurchaseSubnav";
import { AddSupplierForm } from "@/components/purchases/AddSupplierForm";

export default async function NewSupplierPage() {
  await requireUser();

  return (
    <div>
      <PurchaseSubnav />

      <div className="mx-auto max-w-2xl">
        <Card>
          <SectionTitle icon={UserPlus} title="Add Supplier" subtitle="Register a fuel, insurance, transport, or inventory vendor" />
          <AddSupplierForm />
        </Card>
      </div>
    </div>
  );
}
