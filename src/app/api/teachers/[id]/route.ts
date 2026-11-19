import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { forbidden, notFound } from "@/lib/access";
import { can } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { getTeacherById } from "@/lib/services/teachers";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    if (actor.teacherId !== id && !can(actor, "teachers.manage") && !can(actor, "sessions.manage")) {
      throw forbidden("You can't view this teacher's record.");
    }
    const teacher = await getTeacherById(id);
    if (!teacher) throw notFound("Teacher not found.");
    return { teacher };
  });
}
