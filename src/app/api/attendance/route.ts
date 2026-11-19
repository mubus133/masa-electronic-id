import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { assertSessionAccess, forbidden, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { listRecentAttendance, listSessionAttendance, listStudentAttendance } from "@/lib/services/attendance";
import type { AttendanceStatus } from "@/lib/types";

const STATUSES = new Set(["pending", "present", "late", "rejected", "absent", "excused"]);

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const studentId = url.searchParams.get("studentId");
    const statusParam = url.searchParams.get("status");
    const status = statusParam && STATUSES.has(statusParam) ? (statusParam as AttendanceStatus) : undefined;

    if (actor.role === "student") {
      if (!actor.studentId || (studentId && studentId !== actor.studentId) || sessionId) {
        throw forbidden("You can only view your own attendance.");
      }
      return { attendance: await listStudentAttendance(actor.studentId) };
    }

    if (sessionId) {
      await assertSessionAccess(sessionId, actor, "attendance.view");
      return { attendance: await listSessionAttendance(sessionId, status) };
    }

    requireGrant(actor, "attendance.view");
    if (studentId) return { attendance: await listStudentAttendance(studentId) };
    return { attendance: await listRecentAttendance() };
  });
}
