import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { confirmAttendance, markLateAttendance } from "@/lib/services/attendance";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const attendance = body.status === "late" ? await markLateAttendance(id, actor) : await confirmAttendance(id, actor);
    return { success: true, attendance };
  });
}
