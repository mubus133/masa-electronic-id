import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { forbidden, isActiveHostelStaff } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { database } from "@/lib/db";

// Hostel staff only ever see students assigned to their own hostel.
export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isActiveHostelStaff(actor)) throw forbidden("Only hostel staff can use hostel search.");

    const query = (new URL(req.url).searchParams.get("q") || "").trim();
    if (query.length < 2) return { results: [] };

    const results = await database().query(
      `SELECT s.id, s.registration_number, s.full_name, s.photograph_url, s.student_status, s.hostel_id, h.hostel_name, s.class_group
       FROM students s
       LEFT JOIN hostels h ON h.id = s.hostel_id
       WHERE s.hostel_id = $2 AND (s.full_name ILIKE $1 OR s.registration_number ILIKE $1)
       ORDER BY s.full_name ASC
       LIMIT 20`,
      [`%${query.replace(/[%_\\]/g, "\\$&")}%`, actor.hostelId],
    );
    return { results };
  });
}
