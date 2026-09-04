import { requireUser } from "@/lib/dal";
import { OtherItemsManagementView } from "@/components/purchases/OtherItemsManagementView";
import { MOCK_INVENTORY_ITEMS } from "@/lib/mock/purchases";

export default async function InventoryItemsPage() {
  await requireUser();

  return <OtherItemsManagementView items={MOCK_INVENTORY_ITEMS} />;
}

