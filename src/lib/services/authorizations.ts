import { database } from "@/lib/db";
import { badRequest, forbidden, notFound } from "@/lib/access";
import { logAudit } from "@/lib/audit";
import { getStudentById } from "@/lib/services/students";
import { eligibleAttendanceStatuses, getSystemSettings } from "@/lib/services/sessions";
import { formatWhen } from "@/lib/time";
import type { Actor } from "@/lib/permissions";
import type { DailyAuthorization, VerificationResult } from "@/lib/types";

export async function getStudentLatestAuthorization(studentId: string): Promise<DailyAuthorization | null> {
  const db = database();
  const rows = await db.query<any>(
    `SELECT 
      da.*,
      ses.session_name,
      ses.session_date,
      h.hostel_name,
      u.full_name as teacher_name,
      a.attendance_status,
      ses.session_status
     FROM daily_authorizations da
     JOIN sessions ses ON ses.id = da.session_id
     LEFT JOIN hostels h ON h.id = da.hostel_id
     LEFT JOIN attendance a ON a.id = da.attendance_id
     LEFT JOIN users u ON u.id = a.teacher_confirmed_by
     WHERE da.student_id = $1
     ORDER BY da.issued_at DESC
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
}

export async function listStudentAuthorizations(studentId: string): Promise<DailyAuthorization[]> {
  const db = database();
  return await db.query<any>(
    `SELECT 
      da.*,
      ses.session_name,
      ses.session_date,
      h.hostel_name,
      u.full_name as teacher_name,
      a.attendance_status,
      ses.session_status
     FROM daily_authorizations da
     JOIN sessions ses ON ses.id = da.session_id
     LEFT JOIN hostels h ON h.id = da.hostel_id
     LEFT JOIN attendance a ON a.id = da.attendance_id
     LEFT JOIN users u ON u.id = a.teacher_confirmed_by
     WHERE da.student_id = $1
     ORDER BY da.issued_at DESC`,
    [studentId]
  );
}

type StudentSummary = VerificationResult["student"];

function deny(
  verdict: VerificationResult["verdict"],
  headline: string,
  reason: string,
  student: StudentSummary,
  authorization: VerificationResult["authorization"] = null,
): VerificationResult {
  return { valid: false, verdict, headline, reason, student, authorization };
}

// Live check, run every time staff look a student up. Nothing on the student's
// screen is trusted: student status, attendance, session state, pass state,
// expiry and hostel scope are all read fresh from the database.
export async function verifyDailyAuthorization(
  studentId: string,
  hostelStaffHostelId?: string | null,
): Promise<VerificationResult> {
  const student = await getStudentById(studentId);
  if (!student) throw notFound("Student record not found.");

  const settings = await getSystemSettings();
  const tz = settings.timezone || "Africa/Lagos";
  const summary: StudentSummary = {
    id: student.id,
    fullName: student.full_name,
    registrationNumber: student.registration_number,
    photographUrl: student.photograph_url,
    status: student.student_status,
    hostelId: student.hostel_id,
    hostelName: student.hostel_name || null,
    classGroup: student.class_group,
  };

  if (student.student_status === "suspended") {
    return deny("SUSPENDED", "ID suspended", "This student's ID is suspended. Do not admit on a pass; refer to IMASA administration.", summary);
  }
  if (student.student_status === "revoked") {
    return deny("REVOKED", "ID revoked", "This student's ID has been revoked. Do not admit on a pass; refer to IMASA administration.", summary);
  }
  if (student.student_status !== "active") {
    return deny("INVALID", `ID ${student.student_status}`, "Only active students can be admitted on a pass.", summary);
  }

  const auth = await getStudentLatestAuthorization(studentId);
  if (!auth) {
    const recent = await database().query<{ attendance_status: string; session_name: string; session_status: string; rejection_reason: string | null }>(
      `SELECT a.attendance_status, a.rejection_reason, s.session_name, s.session_status
       FROM attendance a JOIN sessions s ON s.id = a.session_id
       WHERE a.student_id = $1 AND a.created_at >= now() - interval '24 hours'
       ORDER BY a.created_at DESC LIMIT 1`,
      [studentId],
    );
    const latest = recent[0];
    if (latest?.attendance_status === "pending") {
      return deny("PENDING", "Waiting for teacher", `Checked in to ${latest.session_name}, but the teacher hasn't confirmed attendance yet. No pass has been issued.`, summary);
    }
    if (latest?.attendance_status === "rejected") {
      return deny("INVALID", "Attendance rejected", `The teacher rejected this check-in for ${latest.session_name}${latest.rejection_reason ? `: ${latest.rejection_reason}` : ""}.`, summary);
    }
    if (latest && latest.session_status !== "completed") {
      return deny("PENDING", "Session not completed", `Attendance for ${latest.session_name} is confirmed, but the session hasn't been completed, so no pass has been issued yet.`, summary);
    }
    return deny("INVALID", "No pass issued", "There is no pass for this student. A permanent ID alone does not allow hostel entry.", summary);
  }

  const details = {
    id: auth.id,
    status: auth.authorization_status,
    issuedAt: auth.issued_at,
    expiresAt: auth.expires_at,
    usedAt: auth.used_at,
    sessionName: auth.session_name || "Session",
    sessionDate: auth.session_date || "",
    teacherName: auth.teacher_name || "—",
    attendanceStatus: ((auth as { attendance_status?: string }).attendance_status ?? "present") as never,
  };

  if (auth.authorization_status === "revoked") {
    return deny("REVOKED", "Pass revoked", auth.revoke_reason ? `This pass was revoked: ${auth.revoke_reason}` : "This pass was revoked.", summary, details);
  }
  if (auth.authorization_status === "redeemed") {
    return deny("ALREADY_REDEEMED", "Pass already used", `This one-time pass was used at ${formatWhen(auth.used_at, tz)}.`, summary, details);
  }
  if (auth.authorization_status === "expired" || new Date(auth.expires_at).getTime() <= Date.now()) {
    return deny("EXPIRED", "Pass expired", `This pass expired at ${formatWhen(auth.expires_at, tz)}.`, summary, details);
  }

  const live = auth as { session_status?: string; attendance_status?: string };
  if (live.session_status !== "completed" || !eligibleAttendanceStatuses(settings).includes(live.attendance_status ?? "")) {
    return deny("INVALID", "Attendance no longer qualifies", "The attendance or session behind this pass has changed since it was issued.", summary, details);
  }

  const passHostel = auth.hostel_id ?? student.hostel_id;
  if (hostelStaffHostelId && passHostel && passHostel !== hostelStaffHostelId) {
    return deny("INVALID", "Wrong hostel", `This pass is for ${auth.hostel_name || student.hostel_name || "another hostel"}.`, summary, details);
  }

  return {
    valid: true,
    verdict: "VALID",
    headline: "Valid pass",
    reason: `Attendance at ${details.sessionName} confirmed by ${details.teacherName}. Valid until ${formatWhen(auth.expires_at, tz)}.`,
    student: summary,
    authorization: details,
  };
}

// Confirms entry. Under one-time entry the status flip is a single conditional
// UPDATE, so two stations pressing "Admit" at once can't both succeed.
export async function redeemDailyAuthorization(
  authorizationId: string,
  hostelId: string,
  actor: Actor,
): Promise<{ success: boolean; logId: string; message: string }> {
  const settings = await getSystemSettings();

  return database().transaction(async (tx) => {
    const rows = await tx.query<DailyAuthorization & { student_status: string; student_hostel_id: string | null }>(
      `SELECT da.*, s.student_status, s.hostel_id AS student_hostel_id
       FROM daily_authorizations da JOIN students s ON s.id = da.student_id
       WHERE da.id = $1`,
      [authorizationId],
    );
    const auth = rows[0];
    if (!auth) throw notFound("Pass not found.");

    const verdict = await verifyDailyAuthorization(auth.student_id, hostelId);
    if (verdict.authorization?.id !== authorizationId) throw badRequest("This is not the student's current pass. Search again.");
    if (!verdict.valid) {
      if (verdict.verdict === "ALREADY_REDEEMED") throw badRequest("This pass has already been redeemed.");
      throw badRequest(`Entry can't be confirmed: ${verdict.headline.toLowerCase()}.`);
    }

    if (settings.one_time_entry) {
      const updated = await tx.query(
        `UPDATE daily_authorizations SET authorization_status = 'redeemed', used_at = now()
         WHERE id = $1 AND authorization_status = 'active' AND expires_at > now()
         RETURNING id`,
        [authorizationId],
      );
      if (!updated.length) throw badRequest("This pass has already been redeemed.");
    }

    const log = await tx.query<{ id: string }>(
      `INSERT INTO hostel_entry_logs (student_id, authorization_id, hostel_id, verified_by, entry_status, verification_method)
       VALUES ($1, $2, $3, $4, 'admitted', 'live_portal') RETURNING id`,
      [auth.student_id, authorizationId, hostelId, actor.id],
    );

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: settings.one_time_entry ? "authorization.redeem" : "hostel.entry_admitted",
      affectedRecordType: "daily_authorization",
      affectedRecordId: authorizationId,
      reason: "Identity checked and entry confirmed at hostel",
      newValue: { logId: log[0].id, hostelId, studentId: auth.student_id },
    });

    return { success: true, logId: log[0].id, message: "Entry confirmed." };
  });
}

// Logs a denial at the desk, or an emergency entry that is explicitly not a pass.
export async function recordHostelDecision(
  input: { studentId: string; hostelId: string; reason: string; approvedBy?: string; decision: "denied" | "exception" },
  actor: Actor,
) {
  const reason = input.reason?.trim() ?? "";
  if (reason.length < 5) throw badRequest("Write a short reason for the record.");

  const student = await getStudentById(input.studentId);
  if (!student) throw notFound("Student not found.");
  if (actor.role === "hostel_staff" && student.hostel_id !== actor.hostelId) {
    throw forbidden("This student is outside your hostel.");
  }

  if (input.decision === "exception") {
    const settings = await getSystemSettings();
    if (!settings.emergency_exceptions_enabled) throw forbidden("Emergency entry is turned off in system settings.");
    if (!input.approvedBy?.trim()) throw badRequest("Name the person who approved this emergency entry.");
  }

  return database().transaction(async (tx) => {
    const rows = await tx.query<{ id: string }>(
      `INSERT INTO hostel_entry_logs (student_id, hostel_id, verified_by, entry_status, verification_method, exception_reason, exception_approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        input.studentId,
        input.hostelId,
        actor.id,
        input.decision,
        input.decision === "exception" ? "emergency_exception" : "live_portal",
        reason,
        input.decision === "exception" ? input.approvedBy!.trim() : null,
      ],
    );
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: input.decision === "exception" ? "hostel.emergency_exception" : "hostel.entry_denied",
      affectedRecordType: "hostel_entry_log",
      affectedRecordId: rows[0].id,
      reason,
      newValue: { studentId: input.studentId, hostelId: input.hostelId, approvedBy: input.approvedBy ?? null },
    });
    return { logId: rows[0].id, success: true };
  });
}

export async function revokeAuthorization(authorizationId: string, reason: string, actor: Actor) {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) throw badRequest("Give a reason for revoking this pass.");
  return database().transaction(async (tx) => {
    const rows = await tx.query<DailyAuthorization>(
      `UPDATE daily_authorizations SET authorization_status = 'revoked', revoked_at = now(), revoked_by = $2, revoke_reason = $3
       WHERE id = $1 AND authorization_status = 'active' RETURNING *`,
      [authorizationId, actor.id, trimmed],
    );
    if (!rows.length) throw badRequest("Only an active pass can be revoked.");
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "authorization.revoke",
      affectedRecordType: "daily_authorization",
      affectedRecordId: authorizationId,
      reason: trimmed,
      newValue: { status: "revoked" },
    });
    return rows[0];
  });
}

export async function listAllAuthorizations(limit = 200) {
  return database().query(
    `SELECT da.*, s.full_name AS student_name, s.registration_number, s.photograph_url,
            h.hostel_name, ses.session_name, ses.session_date
     FROM daily_authorizations da
     JOIN students s ON s.id = da.student_id
     LEFT JOIN hostels h ON h.id = da.hostel_id
     JOIN sessions ses ON ses.id = da.session_id
     ORDER BY da.issued_at DESC
     LIMIT $1`,
    [limit],
  );
}

export async function listHostelEntryLogs(hostelId?: string, limit = 50) {
  const params: unknown[] = [Math.min(Math.max(limit, 1), 500)];
  let filter = "";
  if (hostelId) {
    params.push(hostelId);
    filter = "WHERE hel.hostel_id = $2";
  }
  return database().query(
    `SELECT hel.*, s.full_name AS student_name, s.registration_number, s.photograph_url,
            h.hostel_name, u.full_name AS verified_by_name
     FROM hostel_entry_logs hel
     JOIN students s ON s.id = hel.student_id
     JOIN hostels h ON h.id = hel.hostel_id
     JOIN users u ON u.id = hel.verified_by
     ${filter}
     ORDER BY hel.verification_time DESC
     LIMIT $1`,
    params,
  );
}
