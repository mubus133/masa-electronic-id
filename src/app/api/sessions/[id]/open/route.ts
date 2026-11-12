import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { openSessionAttendance } from "@/lib/services/sessions";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("sessions.manage");
    const { id } = await context.params;

    const session = await openSessionAttendance(id, actor);
    return { success: true, session };
  });
}
