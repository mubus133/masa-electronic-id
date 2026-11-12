import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { listSessionAttendance } from "@/lib/services/attendance";
import { database } from "@/lib/db";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    const studentId = url.searchParams.get("studentId");
    const status = (url.searchParams.get("status") as any) || undefined;

    if (sessionId) {
      const records = await listSessionAttendance(sessionId, status);
      return { attendance: records };
    }

    if (studentId) {
      // If student is requesting, ensure they are requesting their own record
      if (actor.role === "student" && actor.studentId !== studentId) {
        throw new Error("Students can only view their own attendance records.");
      }

      const db = database();
      const records = await db.query<any>(
        `SELECT 
          a.*,
          s.full_name as student_name,
          s.registration_number,
          s.photograph_url,
          ses.session_name,
          ses.session_date
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         JOIN sessions ses ON ses.id = a.session_id
         WHERE a.student_id = $1
         ORDER BY a.check_in_at DESC`,
        [studentId]
      );
      return { attendance: records };
    }

    // Default: if student, return their own
    if (actor.role === "student" && actor.studentId) {
      const db = database();
      const records = await db.query<any>(
        `SELECT 
          a.*,
          s.full_name as student_name,
          s.registration_number,
          s.photograph_url,
          ses.session_name,
          ses.session_date
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         JOIN sessions ses ON ses.id = a.session_id
         WHERE a.student_id = $1
         ORDER BY a.check_in_at DESC`,
        [actor.studentId]
      );
      return { attendance: records };
    }

    // System-wide attendance (admin/teacher)
    const db = database();
    const records = await db.query<any>(
      `SELECT 
        a.*,
        s.full_name as student_name,
        s.registration_number,
        s.photograph_url,
        ses.session_name,
        ses.session_date
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       JOIN sessions ses ON ses.id = a.session_id
       ORDER BY a.check_in_at DESC
       LIMIT 100`
    );
    return { attendance: records };
  });
}
