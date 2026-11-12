import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { reinstateStudent } from "@/lib/services/students";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("students.reinstate");
    const { id } = await context.params;
    const body = await req.json();

    const student = await reinstateStudent(id, body.reason || "", actor);
    return { success: true, student };
  });
}
