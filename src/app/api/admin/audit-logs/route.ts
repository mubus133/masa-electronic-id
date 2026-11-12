import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { listAuditLogs } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requirePermission("audit.view");
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const action = url.searchParams.get("action") || undefined;
    const actorUserId = url.searchParams.get("actorUserId") || undefined;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : undefined;

    return await listAuditLogs({ search, action, actorUserId, limit, offset });
  });
}
