import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { cancelSession } from "@/lib/services/sessions";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    return { success: true, session: await cancelSession(id, body.reason || "", actor) };
  });
}
