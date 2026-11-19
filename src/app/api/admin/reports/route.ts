import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getReports } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "reports.view");
    const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 1), 365);
    return getReports(days);
  });
}
