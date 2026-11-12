import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getStudentByRegistration, getStudentById } from "@/lib/services/students";
import { verifyDailyAuthorization } from "@/lib/services/authorizations";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const regNo = url.searchParams.get("regNo");
    const studentId = url.searchParams.get("studentId");

    let targetStudentId = studentId;

    if (!targetStudentId && regNo) {
      const student = await getStudentByRegistration(regNo);
      if (!student) {
        throw new Error(`No student found with registration number: "${regNo}".`);
      }
      targetStudentId = student.id;
    }

    if (!targetStudentId) {
      throw new Error("Student ID or registration number is required for verification.");
    }

    // Pass hostel ID of current actor if hostel staff
    const hostelStaffHostelId = actor.role === "hostel_staff" ? actor.hostelId : null;
    const result = await verifyDailyAuthorization(targetStudentId, hostelStaffHostelId);

    return result;
  });
}
