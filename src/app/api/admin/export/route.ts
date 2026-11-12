import { NextRequest, NextResponse } from "next/server";
import { database, ensureReady } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await ensureReady();
  await requirePermission("reports.view");

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "attendance";

  const db = database();
  let filename = `imasa_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
  let csv = "";

  if (type === "students") {
    const rows = await db.query<any>(
      `SELECT s.registration_number, s.full_name, u.email, h.hostel_name, s.class_group, s.phone, s.student_status, s.date_registered
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN hostels h ON h.id = s.hostel_id
       ORDER BY s.registration_number ASC`
    );

    const headers = ["Registration Number", "Full Name", "Email", "Hostel", "Class Group", "Phone", "Status", "Date Registered"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          `"${r.registration_number}"`,
          `"${r.full_name.replace(/"/g, '""')}"`,
          `"${r.email}"`,
          `"${r.hostel_name || ""}"`,
          `"${r.class_group || ""}"`,
          `"${r.phone || ""}"`,
          `"${r.student_status}"`,
          `"${r.date_registered}"`,
        ].join(",")
      );
    }
    csv = lines.join("\n");
  } else if (type === "authorizations") {
    const rows = await db.query<any>(
      `SELECT s.registration_number, s.full_name, ses.session_name, ses.session_date, da.issued_at, da.expires_at, da.authorization_status, da.used_at, h.hostel_name
       FROM daily_authorizations da
       JOIN students s ON s.id = da.student_id
       JOIN sessions ses ON ses.id = da.session_id
       LEFT JOIN hostels h ON h.id = da.hostel_id
       ORDER BY da.issued_at DESC`
    );

    const headers = ["Reg Number", "Student Name", "Session", "Date", "Issued At", "Expires At", "Status", "Used At", "Hostel"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          `"${r.registration_number}"`,
          `"${r.full_name.replace(/"/g, '""')}"`,
          `"${r.session_name.replace(/"/g, '""')}"`,
          `"${r.session_date}"`,
          `"${r.issued_at}"`,
          `"${r.expires_at}"`,
          `"${r.authorization_status}"`,
          `"${r.used_at || ""}"`,
          `"${r.hostel_name || ""}"`,
        ].join(",")
      );
    }
    csv = lines.join("\n");
  } else {
    // Attendance
    const rows = await db.query<any>(
      `SELECT s.registration_number, s.full_name, ses.session_name, ses.session_date, a.check_in_at, a.check_in_method, a.attendance_status, u.full_name as confirmed_by, a.rejection_reason, a.manual_reason
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       JOIN sessions ses ON ses.id = a.session_id
       LEFT JOIN users u ON u.id = a.teacher_confirmed_by
       ORDER BY a.check_in_at DESC`
    );

    const headers = ["Reg Number", "Student Name", "Session", "Session Date", "Check-In Time", "Method", "Status", "Confirmed By", "Rejection Reason", "Manual Reason"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      lines.push(
        [
          `"${r.registration_number}"`,
          `"${r.full_name.replace(/"/g, '""')}"`,
          `"${r.session_name.replace(/"/g, '""')}"`,
          `"${r.session_date}"`,
          `"${r.check_in_at}"`,
          `"${r.check_in_method}"`,
          `"${r.attendance_status}"`,
          `"${r.confirmed_by || ""}"`,
          `"${(r.rejection_reason || "").replace(/"/g, '""')}"`,
          `"${(r.manual_reason || "").replace(/"/g, '""')}"`,
        ].join(",")
      );
    }
    csv = lines.join("\n");
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
