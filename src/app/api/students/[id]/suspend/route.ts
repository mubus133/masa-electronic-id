import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { suspendStudent } from "@/lib/services/students";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("students.suspend");
    const { id } = await context.params;
    const body = await req.json();

    const student = await suspendStudent(id, body.reason || "", actor);
    return { success: true, student };
  });
}
