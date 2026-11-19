import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { rejectAttendance } from "@/lib/services/attendance";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const attendance = await rejectAttendance(id, body.reason || "", actor);
    return { success: true, attendance };
  });
}
