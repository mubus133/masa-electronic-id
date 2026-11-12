import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { listStudentAuthorizations } from "@/lib/services/authorizations";
import { database } from "@/lib/db";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");

    if (studentId) {
      if (actor.role === "student" && actor.studentId !== studentId) {
        throw new Error("Students can only view their own authorizations.");
      }
      const passes = await listStudentAuthorizations(studentId);
      return { authorizations: passes };
    }

    if (actor.role === "student" && actor.studentId) {
      const passes = await listStudentAuthorizations(actor.studentId);
      return { authorizations: passes };
    }

    // System wide (admin)
    const db = database();
    const passes = await db.query<any>(
      `SELECT 
        da.*,
        s.full_name as student_name,
        s.registration_number,
        s.photograph_url,
        h.hostel_name,
        ses.session_name,
        ses.session_date
       FROM daily_authorizations da
       JOIN students s ON s.id = da.student_id
       LEFT JOIN hostels h ON h.id = da.hostel_id
       JOIN sessions ses ON ses.id = da.session_id
       ORDER BY da.issued_at DESC
       LIMIT 100`
    );

    return { authorizations: passes };
  });
}
