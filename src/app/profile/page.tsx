import { requireUser } from "@/lib/dal";
import { UserProfileView } from "@/components/system/UserProfileView";

export default async function ProfilePage() {
  const user = await requireUser();
  return <UserProfileView userName={user.name} userRole={user.role} />;
}
