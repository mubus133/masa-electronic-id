import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { canAny, forbidden, isActiveTeacher, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { createSession, listSessions } from "@/lib/services/sessions";
import type { SessionStatus } from "@/lib/types";

const STATUSES = new Set(["scheduled", "open", "closed", "completed", "cancelled"]);

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const status = statusParam && STATUSES.has(statusParam) ? (statusParam as SessionStatus) : undefined;
    const date = url.searchParams.get("date") || undefined;

    // Teachers only see sessions they are assigned to.
    if (isActiveTeacher(actor)) {
      return { sessions: await listSessions({ status, date, teacherId: actor.teacherId! }) };
    }
    if (!canAny(actor, ["sessions.manage", "attendance.view", "attendance.confirm", "qr.generate", "reports.view"])) {
      throw forbidden("You can't view the session schedule.");
    }
    const teacherId = url.searchParams.get("teacherId") || undefined;
    return { sessions: await listSessions({ status, date, teacherId }) };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "sessions.manage");
    const body = await req.json().catch(() => ({}));
    const session = await createSession(
      {
        sessionName: body.sessionName,
        sessionDate: body.sessionDate,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        classGroup: body.classGroup,
        teacherIds: Array.isArray(body.teacherIds) ? body.teacherIds : [],
      },
      actor,
    );
    return { success: true, session };
  });
}
