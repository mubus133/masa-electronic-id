import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { isActiveHostelStaff, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { listHostelEntryLogs } from "@/lib/services/authorizations";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 100;
    if (isActiveHostelStaff(actor)) return { logs: await listHostelEntryLogs(actor.hostelId!, limit) };
    requireGrant(actor, "reports.view");
    return { logs: await listHostelEntryLogs(url.searchParams.get("hostelId") || undefined, limit) };
  });
}
