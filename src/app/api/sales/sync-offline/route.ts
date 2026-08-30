import { NextResponse, type NextRequest } from "next/server";
import { OfflineSyncService } from "@/lib/services/offline-sync-service";
import { requireUser } from "@/lib/dal";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const result = await OfflineSyncService.syncBatch({
      ...body,
      stationId: user.stationId,
      operatorId: user.id,
      operatorName: user.name,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Offline synchronization failed." },
      { status: 400 }
    );
  }
}
