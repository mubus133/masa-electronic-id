import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { revokeStudent } from "@/lib/services/students";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "students.revoke");
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    return { success: true, student: await revokeStudent(id, body.reason || "", actor) };
  });
}
