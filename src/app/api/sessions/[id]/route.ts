import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { assertSessionAccess, notFound } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getSessionById } from "@/lib/services/sessions";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    await assertSessionAccess(id, actor, "attendance.view");
    const session = await getSessionById(id);
    if (!session) throw notFound("Session not found.");
    return { session };
  });
}
