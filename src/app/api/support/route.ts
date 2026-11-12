import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { getCurrentActor, requirePermission } from "@/lib/auth";
import { createSupportRequest, listSupportRequests, resolveSupportRequest } from "@/lib/services/support";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requirePermission("reports.view");
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const requests = await listSupportRequests(status);
    return { requests };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await getCurrentActor();
    const body = await req.json();

    if (body.action === "resolve") {
      const authActor = await requirePermission("reports.view");
      const resolved = await resolveSupportRequest(body.id, body.resolution, authActor);
      return { success: true, request: resolved };
    }

    const request = await createSupportRequest({
      userId: actor?.id || null,
      category: body.category || "technical",
      subject: body.subject,
      message: body.message,
    });

    return { success: true, request };
  });
}
