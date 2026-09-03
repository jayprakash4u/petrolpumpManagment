import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStationAdminDetails } from "@/lib/queries/platform";
import { ChangePasswordFullPageView } from "@/components/admin/ChangePasswordFullPageView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminChangeStationPasswordPage({ params }: PageProps) {
  await requirePlatformAdmin();
  const { slug } = await params;

  const details = await getStationAdminDetails(slug);
  if (!details) {
    notFound();
  }

  const ownerUser = details.station?.users.find((u: any) => u.role === "OWNER") || details.station?.users[0] || {
    id: "owner-1",
    name: "Ram Thapa",
    username: "abc_pump",
    email: details.tenant.email || "admin@abcpump.com",
    phone: details.tenant.phone || "9851029384",
  };

  return (
    <ChangePasswordFullPageView
      slug={slug}
      tenantName={details.tenant.name}
      ownerUser={ownerUser}
    />
  );
}
