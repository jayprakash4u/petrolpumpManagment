import { requireSession } from "@/lib/dal";
import { UserProfileView } from "@/components/system/UserProfileView";

export default async function ProfilePage() {
  const session = await requireSession();
  const { user } = session;

  return (
    <UserProfileView
      userName={user.name}
      userRole={user.role}
      userEmail={user.email}
      userPhone={user.phone}
      employeeId={user.employeeId}
      joinedAt={user.createdAt.toISOString()}
      stationName={user.station.name}
      stationAddress={user.station.address}
      currentSession={{
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        startedAt: session.sessionCreatedAt.toISOString(),
      }}
    />
  );
}
