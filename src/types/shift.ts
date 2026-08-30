export type ShiftStatus = "OPEN" | "CLOSING" | "RECONCILED" | "CLOSED";

export interface ShiftRecord {
  id: string;
  userId: string;
  userName: string;
  startedAt: Date;
  endedAt?: Date | null;
  status: ShiftStatus;
  cashHandedOver?: string | null;
}
