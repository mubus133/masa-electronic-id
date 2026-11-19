import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { suspendStudent } from "@/lib/services/students";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "students.suspend");
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    return { success: true, student: await suspendStudent(id, body.reason || "", actor) };
  });
}
