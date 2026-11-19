import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { revokeAuthorization } from "@/lib/services/authorizations";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "authorizations.revoke");
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const authorization = await revokeAuthorization(id, body.reason || "", actor);
    return { success: true, authorization };
  });
}
