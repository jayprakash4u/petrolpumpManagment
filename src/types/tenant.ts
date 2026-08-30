import type { Station, User, Role } from "@prisma/client";

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
