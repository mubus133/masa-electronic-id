import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest, forbidden, isActiveHostelStaff, notFound, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getStudentById, getStudentByRegistration } from "@/lib/services/students";
import { verifyDailyAuthorization } from "@/lib/services/authorizations";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const regNo = url.searchParams.get("regNo");
    const studentId = url.searchParams.get("studentId");

    const staff = isActiveHostelStaff(actor);
    if (!staff) requireGrant(actor, "authorizations.view");

    const student = studentId ? await getStudentById(studentId) : regNo ? await getStudentByRegistration(regNo) : null;
    if (!studentId && !regNo) throw badRequest("Enter a registration number or pick a student.");
    if (!student) throw notFound("No student matches that search.");
    if (staff && student.hostel_id !== actor.hostelId) throw forbidden("This student is outside your hostel.");

    return verifyDailyAuthorization(student.id, staff ? actor.hostelId : null);
  });
}
