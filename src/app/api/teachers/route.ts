import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor, requirePermission } from "@/lib/auth";
import { listTeachers, registerTeacher } from "@/lib/services/teachers";

export async function GET() {
  return handleApiRoute(async () => {
    await requireActor();
    const teachers = await listTeachers();
    return { teachers };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("teachers.manage");
    const body = await req.json();

    if (!body.fullName || !body.email) {
      throw new Error("Full name and email are required for teacher registration.");
    }

    const teacher = await registerTeacher(
      {
        fullName: body.fullName,
        email: body.email,
        teacherCode: body.teacherCode,
        assignedClass: body.assignedClass,
        password: body.password,
      },
      actor
    );

    return { success: true, teacher };
  });
}
