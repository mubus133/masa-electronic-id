import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { recordHostelExceptionEntry } from "@/lib/services/authorizations";

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role !== "hostel_staff" && actor.role !== "super_admin" && actor.role !== "administrator") {
      throw new Error("Access restricted to hostel staff and administrators.");
    }

    const body = await req.json();
    if (!body.studentId || !body.reason) {
      throw new Error("Student ID and substantive exception reason are required.");
    }

    const hostelId = body.hostelId || actor.hostelId;
    if (!hostelId) {
      throw new Error("Hostel assignment is required to log exception entry.");
    }

    const result = await recordHostelExceptionEntry(
      {
        studentId: body.studentId,
        hostelId,
        reason: body.reason,
        approvedBy: body.approvedBy,
        entryStatus: body.entryStatus || "approved",
      },
      actor
    );

    return {
      success: true,
      logId: result.logId,
      message: "Emergency exception entry recorded with audit reference.",
    };
  });
}
