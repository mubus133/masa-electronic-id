import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { listHostelEntryLogs } from "@/lib/services/authorizations";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const hostelId = url.searchParams.get("hostelId") || (actor.role === "hostel_staff" ? actor.hostelId || undefined : undefined);
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 50;

    const logs = await listHostelEntryLogs(hostelId, limit);
    return { logs };
  });
}
