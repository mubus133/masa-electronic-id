import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor, requirePermission } from "@/lib/auth";
import { getStudentById, updateStudent } from "@/lib/services/students";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    await requireActor();
    const { id } = await context.params;
    const student = await getStudentById(id);
    if (!student) {
      throw new Error("Student not found.");
    }
    return { student };
  });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("students.edit");
    const { id } = await context.params;
    const body = await req.json();

    const student = await updateStudent(id, body, actor);
    return { success: true, student };
  });
}
