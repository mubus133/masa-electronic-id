import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { recordManualAttendance } from "@/lib/services/attendance";

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    // Teachers or administrators with attendance.confirm permission
    const actor = await requirePermission("attendance.confirm");
    const body = await req.json();

    if (!body.sessionId || !body.studentId || !body.reason) {
      throw new Error("Session ID, Student ID, and substantive reason are required for manual attendance.");
    }

    const attendance = await recordManualAttendance(
      body.sessionId,
      body.studentId,
      body.reason,
      actor
    );

    return {
      success: true,
      attendance,
      message: "Manual attendance recorded and confirmed successfully under no-phone/dead-battery procedure.",
    };
  });
}
