import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { database } from "@/lib/db";
import { getSystemSettings } from "@/lib/services/sessions";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role !== "hostel_staff" && actor.role !== "super_admin" && actor.role !== "administrator") {
      throw new Error("Access restricted to hostel staff and administrators.");
    }

    const url = new URL(req.url);
    const query = (url.searchParams.get("q") || "").trim();
    if (!query || query.length < 2) {
      return { results: [] };
    }

    const db = database();
    const settings = await getSystemSettings();

    const params: unknown[] = [`%${query}%`];
    let hostelFilter = "";

    // Restrict search results to the staff member's assigned hostel scope if configured
    if (actor.role === "hostel_staff" && actor.hostelId && settings.require_hostel_assignment) {
      params.push(actor.hostelId);
      hostelFilter = `AND (s.hostel_id = $2 OR s.hostel_id IS NULL)`;
    }

    const rows = await db.query<any>(
      `SELECT 
        s.id, s.registration_number, s.full_name, s.photograph_url,
        s.student_status, s.hostel_id, h.hostel_name, s.class_group
       FROM students s
       LEFT JOIN hostels h ON h.id = s.hostel_id
       WHERE (s.full_name ILIKE $1 OR s.registration_number ILIKE $1)
       ${hostelFilter}
       ORDER BY s.full_name ASC
       LIMIT 20`,
      params
    );

    return { results: rows };
  });
}
