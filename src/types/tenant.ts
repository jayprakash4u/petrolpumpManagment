import type { Station, User } from "@prisma/client";
import type { Role } from "@/lib/permissions";

export interface TenantContext {
  stationId: string;
  stationSlug: string;
  stationName: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: Role;
  };
}

export interface StationSummary {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  suspendedAt: Date | null;
  activeUsersCount: number;
  totalTanks: number;
}
