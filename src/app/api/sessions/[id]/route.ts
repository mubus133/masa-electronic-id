import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getSessionById } from "@/lib/services/sessions";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    await requireActor();
    const { id } = await context.params;
    const session = await getSessionById(id);
    if (!session) {
      throw new Error("Session not found.");
    }
    return { session };
  });
}
