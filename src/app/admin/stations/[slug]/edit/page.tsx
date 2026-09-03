import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStationAdminDetails } from "@/lib/queries/platform";
import { EditStationFullPageView } from "@/components/admin/EditStationFullPageView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditStationPage({ params }: PageProps) {
  await requirePlatformAdmin();
  const { slug } = await params;

  const details = await getStationAdminDetails(slug);
  if (!details) {
    notFound();
  }

  return (
    <EditStationFullPageView
      slug={slug}
      tenant={details.tenant}
      station={details.station}
    />
  );
}
