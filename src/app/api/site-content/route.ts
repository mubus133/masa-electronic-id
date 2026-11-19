import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getSiteContent, updateSiteContent } from "@/lib/services/site-content";

export async function GET() {
  return handleApiRoute(async () => ({ content: await getSiteContent() }));
}

export async function PATCH(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "website.edit");
    const body = await req.json().catch(() => ({}));
    return { success: true, content: await updateSiteContent(body, actor) };
  });
}
