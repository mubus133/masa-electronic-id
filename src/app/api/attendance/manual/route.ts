import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { recordManualAttendance } from "@/lib/services/attendance";

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const body = await req.json().catch(() => ({}));
    if (!body.sessionId || !body.studentId) throw badRequest("Choose a session and a student.");
    const attendance = await recordManualAttendance(body.sessionId, body.studentId, body.reason || "", actor);
    return { success: true, attendance };
  });
}
