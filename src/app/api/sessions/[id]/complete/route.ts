import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { completeSession } from "@/lib/services/sessions";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const result = await completeSession(id, actor);
    return { success: true, ...("session" in result ? result : { session: result }) };
  });
}
