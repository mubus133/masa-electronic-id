import { database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { getStudentById } from "@/lib/services/students";
import { getSystemSettings } from "@/lib/services/sessions";
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
      u.full_name as teacher_name
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
      u.full_name as teacher_name
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

export async function verifyDailyAuthorization(
  studentId: string,
  hostelStaffHostelId?: string | null
): Promise<VerificationResult> {
  const student = await getStudentById(studentId);
  if (!student) {
    throw new DomainError("Student record not found.", 404);
  }

  const baseStudentInfo = {
    id: student.id,
    fullName: student.full_name,
    registrationNumber: student.registration_number,
    photographUrl: student.photograph_url,
    status: student.student_status,
    hostelId: student.hostel_id,
    hostelName: student.hostel_name || null,
    classGroup: student.class_group,
  };

  // 1. RE-CHECK STUDENT STATUS (Live security check)
  if (student.student_status === "suspended") {
    return {
      valid: false,
      verdict: "SUSPENDED",
      headline: "Student Electronic ID is Suspended",
      reason: `This student's electronic ID has been temporarily suspended by IMASA Administration. Reason: ${student.status_reason || "Administrative review"}. Hostel entry is not authorized.`,
      student: baseStudentInfo,
      authorization: null,
    };
  }

  if (student.student_status === "revoked") {
    return {
      valid: false,
      verdict: "REVOKED",
      headline: "Student Electronic ID is Permanently Revoked",
      reason: `This student's electronic ID was permanently revoked. Reason: ${student.status_reason || "Disciplinary / withdrawal"}. Hostel entry cannot be authorized.`,
      student: baseStudentInfo,
      authorization: null,
    };
  }

  if (student.student_status !== "active") {
    return {
      valid: false,
      verdict: "INVALID",
      headline: `Student Status: ${student.student_status}`,
      reason: `Student status is ${student.student_status}. Only active students can be authorized.`,
      student: baseStudentInfo,
      authorization: null,
    };
  }

  // 2. Fetch latest authorization
  const auth = await getStudentLatestAuthorization(studentId);
  if (!auth) {
    // Check if there is a pending attendance record
    const db = database();
    const pendingAttendance = await db.query<any>(
      `SELECT a.*, s.session_name, s.session_status 
       FROM attendance a 
       JOIN sessions s ON s.id = a.session_id
       WHERE a.student_id = $1 AND a.created_at >= now() - interval '24 hours'
       ORDER BY a.created_at DESC LIMIT 1`,
      [studentId]
    );

    if (pendingAttendance[0]) {
      const p = pendingAttendance[0];
      if (p.attendance_status === "pending") {
        return {
          valid: false,
          verdict: "PENDING",
          headline: "Attendance Awaiting Teacher Confirmation",
          reason: `Student scanned for '${p.session_name}', but physical presence has not yet been confirmed by the Madrasa teacher. No pass issued.`,
          student: baseStudentInfo,
          authorization: null,
        };
      }
      if (p.session_status !== "completed") {
        return {
          valid: false,
          verdict: "PENDING",
          headline: "Madrasa Session Not Yet Completed",
          reason: `Attendance was confirmed, but session '${p.session_name}' is still in progress. Daily authorization will be generated when the session completes.`,
          student: baseStudentInfo,
          authorization: null,
        };
      }
      if (p.attendance_status === "rejected") {
        return {
          valid: false,
          verdict: "INVALID",
          headline: "Attendance Rejected by Teacher",
          reason: `Attendance for session '${p.session_name}' was rejected by the teacher (${p.rejection_reason || "Absent from class"}). No hostel authorization granted.`,
          student: baseStudentInfo,
          authorization: null,
        };
      }
    }

    return {
      valid: false,
      verdict: "INVALID",
      headline: "No Daily Authorization Issued",
      reason: "No record of completed Madrasa attendance or valid daily authorization found for today. Permanent ID does not grant hostel entry.",
      student: baseStudentInfo,
      authorization: null,
    };
  }

  const authDetails = {
    id: auth.id,
    status: auth.authorization_status,
    issuedAt: auth.issued_at,
    expiresAt: auth.expires_at,
    usedAt: auth.used_at,
    sessionName: auth.session_name || "Madrasa Session",
    sessionDate: auth.session_date || "",
    teacherName: auth.teacher_name || "Ustazah In Charge",
    attendanceStatus: "present" as const,
  };

  // 3. Check revocation
  if (auth.authorization_status === "revoked") {
    return {
      valid: false,
      verdict: "REVOKED",
      headline: "Authorization Revoked",
      reason: `This daily authorization was revoked: ${auth.revocation_reason || "Administrative cancellation"}.`,
      student: baseStudentInfo,
      authorization: authDetails,
    };
  }

  // 4. Check already redeemed (one-time entry)
  if (auth.authorization_status === "redeemed") {
    return {
      valid: false,
      verdict: "ALREADY_REDEEMED",
      headline: "Pass Already Redeemed",
      reason: `This one-time hostel authorization was already used at ${new Date(auth.used_at!).toLocaleTimeString()}. A pass cannot be used more than once.`,
      student: baseStudentInfo,
      authorization: authDetails,
    };
  }

  // 5. Check expiration
  if (new Date(auth.expires_at).getTime() <= Date.now()) {
    return {
      valid: false,
      verdict: "EXPIRED",
      headline: "Authorization Expired",
      reason: `This daily authorization expired at ${new Date(auth.expires_at).toLocaleTimeString()}. The curfew window for this pass has closed.`,
      student: baseStudentInfo,
      authorization: authDetails,
    };
  }

  // 6. Check hostel scope (if hostel staff is searching and student is assigned to another hostel)
  const settings = await getSystemSettings();
  if (settings.require_hostel_assignment && hostelStaffHostelId && student.hostel_id && student.hostel_id !== hostelStaffHostelId) {
    return {
      valid: false,
      verdict: "INVALID",
      headline: "Wrong Hostel Assignment",
      reason: `This student is registered to '${student.hostel_name || "a different hostel"}', not this hostel. Please redirect the student to her assigned hostel.`,
      student: baseStudentInfo,
      authorization: authDetails,
    };
  }

  // All checks passed!
  return {
    valid: true,
    verdict: "VALID",
    headline: "Valid Daily Authorization",
    reason: `Verified Madrasa attendance for '${auth.session_name}'. Confirmed by ${auth.teacher_name}. Authorized for hostel entry until ${new Date(auth.expires_at).toLocaleTimeString()}.`,
    student: baseStudentInfo,
    authorization: authDetails,
  };
}

// ATOMIC REDEMPTION: One-time entry check & transaction
export async function redeemDailyAuthorization(
  authorizationId: string,
  hostelId: string,
  actor: Actor
): Promise<{ success: boolean; logId: string; message: string }> {
  const db = database();
  const settings = await getSystemSettings();

  return await db.transaction(async (tx) => {
    // 1. Atomically query and lock or conditionally update
    const authRows = await tx.query<DailyAuthorization>(
      `SELECT da.*, s.student_status 
       FROM daily_authorizations da
       JOIN students s ON s.id = da.student_id
       WHERE da.id = $1`,
      [authorizationId]
    );

    const auth = authRows[0];
    if (!auth) {
      throw new DomainError("Authorization not found.", 404);
    }

    if ((auth as any).student_status !== "active") {
      throw new DomainError("Cannot redeem pass: student ID is not active.", 403);
    }

    if (auth.authorization_status === "revoked") {
      throw new DomainError("Cannot redeem a revoked authorization.", 400);
    }

    if (auth.authorization_status === "redeemed" && settings.one_time_entry) {
      throw new DomainError("This pass has already been redeemed and cannot be used again.", 409);
    }

    if (new Date(auth.expires_at).getTime() <= Date.now()) {
      throw new DomainError("This authorization has expired.", 400);
    }

    // 2. Conditional atomic update: only update if currently active
    const updateResult = await tx.query<DailyAuthorization>(
      `UPDATE daily_authorizations
       SET authorization_status = 'redeemed', used_at = now()
       WHERE id = $1 AND authorization_status = 'active'
       RETURNING *`,
      [authorizationId]
    );

    if (updateResult.length === 0 && settings.one_time_entry) {
      throw new DomainError("Concurrent redemption error: This pass was already redeemed by another station.", 409);
    }

    // 3. Write immutable hostel entry log
    const logRows = await tx.query<{ id: string }>(
      `INSERT INTO hostel_entry_logs (
        student_id, authorization_id, hostel_id, verified_by,
        verification_time, entry_status, verification_method
       ) VALUES ($1, $2, $3, $4, now(), 'approved', 'digital')
       RETURNING id`,
      [auth.student_id, authorizationId, hostelId, actor.id]
    );

    const logId = logRows[0].id;

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "hostel.entry_confirmed",
      affectedRecordType: "daily_authorization",
      affectedRecordId: authorizationId,
      reason: "Hostel mistress checked identity and confirmed entry",
      newValue: { logId, hostelId, studentId: auth.student_id },
    });

    return {
      success: true,
      logId,
      message: "Hostel entry successfully confirmed and authorization marked as redeemed.",
    };
  });
}

// EMERGENCY / EXCEPTION HOSTEL ENTRY LOG
export async function recordHostelExceptionEntry(input: {
  studentId: string;
  hostelId: string;
  reason: string;
  approvedBy?: string;
  entryStatus: "approved" | "denied";
}, actor: Actor) {
  if (!input.reason || input.reason.trim().length < 5) {
    throw new DomainError("A substantive exception reason is required for emergency entry logging.", 400);
  }

  const db = database();
  const logRows = await db.query<{ id: string }>(
    `INSERT INTO hostel_entry_logs (
      student_id, authorization_id, hostel_id, verified_by,
      verification_time, entry_status, verification_method,
      exception_reason, exception_approved_by
     ) VALUES ($1, null, $2, $3, now(), $4, 'exception', $5, $6)
     RETURNING id`,
    [
      input.studentId,
      input.hostelId,
      actor.id,
      input.entryStatus,
      input.reason.trim(),
      input.approvedBy || actor.fullName,
    ]
  );

  const logId = logRows[0].id;

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "hostel.exception_entry",
    affectedRecordType: "hostel_entry_log",
    affectedRecordId: logId,
    reason: `Emergency/Exception Entry: ${input.reason.trim()}`,
    newValue: { studentId: input.studentId, status: input.entryStatus, reason: input.reason.trim() },
  });

  return { logId, success: true };
}

export async function listHostelEntryLogs(hostelId?: string, limit = 50): Promise<any[]> {
  const db = database();
  const params: unknown[] = [limit];
  let filter = "";
  if (hostelId) {
    params.push(hostelId);
    filter = "WHERE hel.hostel_id = $2";
  }

  return await db.query<any>(
    `SELECT 
      hel.*,
      s.full_name as student_name,
      s.registration_number,
      s.photograph_url,
      h.hostel_name,
      u.full_name as verified_by_name
     FROM hostel_entry_logs hel
     JOIN students s ON s.id = hel.student_id
     JOIN hostels h ON h.id = hel.hostel_id
     JOIN users u ON u.id = hel.verified_by
     ${filter}
     ORDER BY hel.verification_time DESC
     LIMIT $1`,
    params
  );
}
