import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor, requirePermission } from "@/lib/auth";
import { listSessions, createSession } from "@/lib/services/sessions";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requireActor();
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") as any) || undefined;
    const date = url.searchParams.get("date") || undefined;
    const teacherId = url.searchParams.get("teacherId") || undefined;

    const sessions = await listSessions({ status, date, teacherId });
    return { sessions };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("sessions.manage");
    const body = await req.json();

    if (!body.sessionName || !body.sessionDate || !body.weekday || !body.startsAt || !body.endsAt) {
      throw new Error("Session name, date, weekday, start time, and end time are required.");
    }

    const session = await createSession(
      {
        sessionName: body.sessionName,
        sessionDate: body.sessionDate,
        weekday: body.weekday,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        classGroup: body.classGroup,
        teacherIds: body.teacherIds,
      },
      actor
    );

    return { success: true, session };
  });
}
