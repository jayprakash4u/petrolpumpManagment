import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-dal";
import { getStationAdminDetails } from "@/lib/queries/platform";
import { StationManageView } from "@/components/admin/StationManageView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminStationDetailsPage({ params }: PageProps) {
  await requirePlatformAdmin();
  const { slug } = await params;

  const details = await getStationAdminDetails(slug);
  if (!details) {
    notFound();
  }

  return (
    <StationManageView
      slug={slug}
      tenant={details.tenant}
      station={details.station}
      stats={details.stats}
    />
  );
}
