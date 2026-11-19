import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { setAccountStatus } from "@/lib/services/users";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    return { success: true, ...(await setAccountStatus(id, body.status, body.reason || "", actor)) };
  });
}
