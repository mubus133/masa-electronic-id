import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getTeacherById } from "@/lib/services/teachers";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    await requireActor();
    const { id } = await context.params;
    const teacher = await getTeacherById(id);
    if (!teacher) {
      throw new Error("Teacher not found.");
    }
    return { teacher };
  });
}
