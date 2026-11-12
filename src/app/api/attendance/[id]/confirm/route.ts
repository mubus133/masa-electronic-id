import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { confirmAttendance } from "@/lib/services/attendance";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("attendance.confirm");
    const { id } = await context.params;

    const attendance = await confirmAttendance(id, actor);
    return {
      success: true,
      attendance,
      message: "Student attendance physically verified and approved.",
    };
  });
}
