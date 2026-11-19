import { NextRequest, NextResponse } from "next/server";
import { database, ensureReady } from "@/lib/db";
import { requireActor } from "@/lib/auth";
import { requireGrant } from "@/lib/access";
import { DomainError } from "@/lib/errors";

type Report = { permission: string; headers: string[]; sql: string };

const REPORTS: Record<string, Report> = {
  students: {
    permission: "reports.view",
    headers: ["Registration number", "Full name", "Email", "Hostel", "Class", "Status", "Status reason", "Registered"],
    sql: `SELECT s.registration_number, s.full_name, u.email, h.hostel_name, s.class_group, s.student_status, s.status_reason, s.date_registered
          FROM students s JOIN users u ON u.id = s.user_id LEFT JOIN hostels h ON h.id = s.hostel_id
          ORDER BY s.registration_number`,
  },
  attendance: {
    permission: "reports.view",
    headers: ["Registration number", "Student", "Session", "Session date", "Checked in", "Method", "Status", "Confirmed by", "Confirmed at", "Rejection reason", "Manual reason"],
    sql: `SELECT s.registration_number, s.full_name, ses.session_name, ses.session_date, a.check_in_at, a.check_in_method, a.attendance_status,
                 u.full_name AS confirmed_by, a.teacher_confirmed_at, a.rejection_reason, a.manual_reason
          FROM attendance a JOIN students s ON s.id = a.student_id JOIN sessions ses ON ses.id = a.session_id
          LEFT JOIN users u ON u.id = a.teacher_confirmed_by
          ORDER BY a.check_in_at DESC`,
  },
  passes: {
    permission: "reports.view",
    headers: ["Registration number", "Student", "Session", "Session date", "Issued", "Expires", "Status", "Used", "Hostel", "Revoke reason"],
    sql: `SELECT s.registration_number, s.full_name, ses.session_name, ses.session_date, da.issued_at, da.expires_at, da.authorization_status,
                 da.used_at, h.hostel_name, da.revoke_reason
          FROM daily_authorizations da JOIN students s ON s.id = da.student_id JOIN sessions ses ON ses.id = da.session_id
          LEFT JOIN hostels h ON h.id = da.hostel_id
          ORDER BY da.issued_at DESC`,
  },
  entries: {
    permission: "reports.view",
    headers: ["Time", "Registration number", "Student", "Hostel", "Result", "Method", "Recorded by", "Reason", "Approved by"],
    sql: `SELECT hel.verification_time, s.registration_number, s.full_name, h.hostel_name, hel.entry_status, hel.verification_method,
                 u.full_name AS recorded_by, hel.exception_reason, hel.exception_approved_by
          FROM hostel_entry_logs hel JOIN students s ON s.id = hel.student_id JOIN hostels h ON h.id = hel.hostel_id
          JOIN users u ON u.id = hel.verified_by
          ORDER BY hel.verification_time DESC`,
  },
  audit: {
    permission: "audit.view",
    headers: ["Time", "Actor", "Role", "Action", "Record type", "Record id", "Reason"],
    sql: `SELECT al.created_at, u.full_name AS actor, al.actor_role, al.action, al.affected_record_type, al.affected_record_id, al.reason
          FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_user_id
          ORDER BY al.created_at DESC`,
  },
};

// Quotes every cell and neutralises leading = + - @ so spreadsheets don't run them as formulas.
const cell = (value: unknown) => {
  if (value === null || value === undefined) return '""';
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  try {
    await ensureReady();
    const actor = await requireActor();
    const type = new URL(req.url).searchParams.get("type") ?? "";
    const report = REPORTS[type];
    if (!report) throw new DomainError("Unknown report.", 400);
    requireGrant(actor, report.permission);

    const rows = await database().query<Record<string, unknown>>(report.sql);
    const lines = [report.headers.map(cell).join(","), ...rows.map((row) => Object.values(row).map(cell).join(","))];
    return new NextResponse(`﻿${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="imasa-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const status = err instanceof DomainError ? err.status : 500;
    return NextResponse.json({ error: err instanceof DomainError ? err.message : "Export failed." }, { status });
  }
}
