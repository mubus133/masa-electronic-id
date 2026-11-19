import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest, forbidden, isActiveHostelStaff } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { recordHostelDecision } from "@/lib/services/authorizations";

// Records a denial, or an emergency entry that is logged separately from passes.
export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isActiveHostelStaff(actor)) throw forbidden("Only hostel staff can record entry decisions.");
    const body = await req.json().catch(() => ({}));
    if (!body.studentId) throw badRequest("Pick a student first.");
    const decision = body.decision === "exception" ? "exception" : "denied";
    const result = await recordHostelDecision(
      { studentId: body.studentId, hostelId: actor.hostelId!, reason: body.reason || "", approvedBy: body.approvedBy, decision },
      actor,
    );
    return { success: true, logId: result.logId };
  });
}
