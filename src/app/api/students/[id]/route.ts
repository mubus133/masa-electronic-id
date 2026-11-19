import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { assertStudentVisible, notFound, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getStudentById, updateStudent } from "@/lib/services/students";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const student = await getStudentById(id);
    if (!student) throw notFound("Student not found.");
    assertStudentVisible(actor, student);
    return { student };
  });
}

const EDITABLE = ["full_name", "photograph_url", "hostel_id", "class_group", "phone", "emergency_contact"] as const;

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "students.edit");
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const updates = Object.fromEntries(EDITABLE.filter((key) => key in body).map((key) => [key, body[key]]));
    return { success: true, student: await updateStudent(id, updates, actor) };
  });
}
