import { database } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { getStudentById } from "@/lib/services/students";
import { getSessionById } from "@/lib/services/sessions";
import type { Actor } from "@/lib/permissions";
import type { Attendance, AttendanceStatus } from "@/lib/types";

export interface SubmitScanInput {
  qrPayload: string; // The raw scanned QR content (JSON or token)
}

export async function submitQrScan(input: SubmitScanInput, actor: Actor): Promise<Attendance> {
  // 1. Verify student account
  if (actor.role !== "student" || !actor.studentId) {
    throw new DomainError("Only authenticated students can submit attendance scans.", 403);
  }

  const student = await getStudentById(actor.studentId);
  if (!student) {
    throw new DomainError("Student profile not found.", 404);
  }
  if (student.student_status !== "active") {
    throw new DomainError(
      `Your student ID is currently ${student.student_status}. You cannot register attendance.`,
      403
    );
  }

  // 2. Parse and validate QR payload
  let sessionId = "";
  let tokenPlaintext = "";

  try {
    const parsed = JSON.parse(input.qrPayload);
    if (parsed.imasa !== "madrasa_session" || !parsed.sessionId || !parsed.token) {
      throw new Error();
    }
    sessionId = parsed.sessionId;
    tokenPlaintext = parsed.token;
  } catch {
    throw new DomainError("Invalid QR code. Please scan an authentic IMASA teacher QR code.", 400);
  }

  // 3. Verify session
  const session = await getSessionById(sessionId);
  if (!session) {
    throw new DomainError("Session not found.", 404);
  }
  if (session.session_status !== "open") {
    if (session.session_status === "completed") {
      throw new DomainError("Attendance for this session has already been closed and completed.", 400);
    }
    if (session.session_status === "closed") {
      throw new DomainError("Attendance collection for this session is currently closed.", 400);
    }
    throw new DomainError(`This session is not currently open for attendance (status: ${session.session_status}).`, 400);
  }

  // 4. Validate QR token (hash lookup, check expiry and status)
  const db = database();
  const tokenHash = sha256(tokenPlaintext);

  const tokenRows = await db.query<any>(
    `SELECT * FROM qr_tokens 
     WHERE session_id = $1 AND token_hash = $2`,
    [sessionId, tokenHash]
  );

  const qrRecord = tokenRows[0];
  if (!qrRecord) {
    throw new DomainError("Invalid QR code token. The code may be expired or from another session.", 400);
  }
  if (qrRecord.token_status !== "active") {
    throw new DomainError("This QR code has expired. Please ask the teacher for the current live QR code.", 400);
  }
  if (new Date(qrRecord.expires_at).getTime() <= Date.now()) {
    // Mark as expired
    await db.query(`UPDATE qr_tokens SET token_status = 'expired' WHERE id = $1`, [qrRecord.id]);
    throw new DomainError("This QR code has just expired. Please scan the newly rotated code.", 400);
  }

  // 5. Check duplicate attendance
  const existingRows = await db.query<any>(
    `SELECT * FROM attendance WHERE student_id = $1 AND session_id = $2`,
    [student.id, sessionId]
  );
  if (existingRows.length > 0) {
    throw new DomainError("You have already submitted attendance for this Madrasa session.", 409);
  }

  // 6. Create PENDING attendance record (CRITICAL: scanning never creates a confirmed record!)
  try {
    const rows = await db.query<Attendance>(
      `INSERT INTO attendance (
        student_id, session_id, check_in_at, check_in_method,
        attendance_status, sync_status, identity_confirmed
       ) VALUES ($1, $2, now(), 'qr_scan', 'pending', 'synced', false)
       RETURNING *`,
      [student.id, sessionId]
    );

    const record = rows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "attendance.scan",
      affectedRecordType: "attendance",
      affectedRecordId: record.id,
      reason: "Student QR attendance scan submitted (pending teacher physical verification)",
      newValue: { studentId: student.id, sessionId, status: "pending" },
    });

    return record;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new DomainError("Attendance already submitted for this session.", 409);
    }
    throw err;
  }
}

export async function confirmAttendance(attendanceId: string, actor: Actor): Promise<Attendance> {
  const db = database();
  const rows = await db.query<any>(
    `SELECT a.*, s.student_status 
     FROM attendance a
     JOIN students s ON s.id = a.student_id
     WHERE a.id = $1`,
    [attendanceId]
  );

  const current = rows[0];
  if (!current) throw new DomainError("Attendance record not found.", 404);

  if (current.student_status !== "active") {
    throw new DomainError(`Cannot confirm attendance: student status is ${current.student_status}.`, 400);
  }

  const teacherIdentifier = actor.teacherId || actor.id;

  const updatedRows = await db.query<Attendance>(
    `UPDATE attendance 
     SET attendance_status = 'present',
         teacher_confirmed_by = $2,
         teacher_confirmed_at = now(),
         identity_confirmed = true,
         rejection_reason = null
     WHERE id = $1
     RETURNING *`,
    [attendanceId, teacherIdentifier]
  );

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "attendance.confirm",
    affectedRecordType: "attendance",
    affectedRecordId: attendanceId,
    reason: "Teacher physically verified and confirmed attendance",
    previousValue: { status: current.attendance_status },
    newValue: { status: "present", confirmedBy: teacherIdentifier },
  });

  return updatedRows[0];
}

export async function rejectAttendance(attendanceId: string, reason: string, actor: Actor): Promise<Attendance> {
  if (!reason || reason.trim().length < 3) {
    throw new DomainError("Please specify a reason for rejecting attendance.", 400);
  }

  const db = database();
  const current = (await db.query<any>("SELECT * FROM attendance WHERE id = $1", [attendanceId]))[0];
  if (!current) throw new DomainError("Attendance record not found.", 404);

  const teacherIdentifier = actor.teacherId || actor.id;

  const updatedRows = await db.query<Attendance>(
    `UPDATE attendance 
     SET attendance_status = 'rejected',
         teacher_confirmed_by = $2,
         teacher_confirmed_at = now(),
         rejection_reason = $3
     WHERE id = $1
     RETURNING *`,
    [attendanceId, teacherIdentifier, reason.trim()]
  );

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "attendance.reject",
    affectedRecordType: "attendance",
    affectedRecordId: attendanceId,
    reason: reason.trim(),
    previousValue: { status: current.attendance_status },
    newValue: { status: "rejected", reason: reason.trim() },
  });

  return updatedRows[0];
}

export async function markLateAttendance(attendanceId: string, actor: Actor): Promise<Attendance> {
  const db = database();
  const current = (await db.query<any>("SELECT * FROM attendance WHERE id = $1", [attendanceId]))[0];
  if (!current) throw new DomainError("Attendance record not found.", 404);

  const teacherIdentifier = actor.teacherId || actor.id;

  const updatedRows = await db.query<Attendance>(
    `UPDATE attendance 
     SET attendance_status = 'late',
         teacher_confirmed_by = $2,
         teacher_confirmed_at = now(),
         identity_confirmed = true
     WHERE id = $1
     RETURNING *`,
    [attendanceId, teacherIdentifier]
  );

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "attendance.mark_late",
    affectedRecordType: "attendance",
    affectedRecordId: attendanceId,
    reason: "Marked as late attendance with verified presence",
  });

  return updatedRows[0];
}

// DEAD-BATTERY / NO-PHONE MANUAL VERIFICATION PROCEDURE
export async function recordManualAttendance(
  sessionId: string,
  studentId: string,
  reason: string,
  actor: Actor
): Promise<Attendance> {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A substantive exception reason is required for manual attendance (e.g. dead battery, phone unavailable).", 400);
  }

  const student = await getStudentById(studentId);
  if (!student) throw new DomainError("Student not found.", 404);
  if (student.student_status !== "active") {
    throw new DomainError(`Student is ${student.student_status}. Manual attendance cannot be recorded.`, 403);
  }

  const session = await getSessionById(sessionId);
  if (!session) throw new DomainError("Session not found.", 404);
  if (session.session_status === "completed") {
    throw new DomainError("Cannot record attendance for a completed session.", 400);
  }

  const db = database();
  const existing = await db.query<any>(
    "SELECT * FROM attendance WHERE student_id = $1 AND session_id = $2",
    [studentId, sessionId]
  );
  if (existing.length > 0) {
    throw new DomainError("An attendance record already exists for this student in this session.", 409);
  }

  const teacherIdentifier = actor.teacherId || actor.id;

  const rows = await db.query<Attendance>(
    `INSERT INTO attendance (
      student_id, session_id, check_in_at, check_in_method,
      attendance_status, sync_status, teacher_confirmed_by,
      teacher_confirmed_at, identity_confirmed, manual_reason
     ) VALUES ($1, $2, now(), 'manual', 'present', 'synced', $3, now(), true, $4)
     RETURNING *`,
    [studentId, sessionId, teacherIdentifier, `Manual verification: ${reason.trim()}`]
  );

  const record = rows[0];

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "attendance.manual_entry",
    affectedRecordType: "attendance",
    affectedRecordId: record.id,
    reason: `Manual attendance recorded (Dead-battery/no-phone procedure): ${reason.trim()}`,
    newValue: { studentId, sessionId, reason: reason.trim(), confirmedBy: teacherIdentifier },
  });

  return record;
}

export async function listSessionAttendance(
  sessionId: string,
  statusFilter?: AttendanceStatus
): Promise<Attendance[]> {
  const db = database();
  const params: unknown[] = [sessionId];
  let filter = "";

  if (statusFilter) {
    params.push(statusFilter);
    filter = "AND a.attendance_status = $2";
  }

  return await db.query<Attendance>(
    `SELECT 
      a.*,
      s.full_name as student_name,
      s.registration_number,
      s.photograph_url,
      ses.session_name
     FROM attendance a
     JOIN students s ON s.id = a.student_id
     JOIN sessions ses ON ses.id = a.session_id
     WHERE a.session_id = $1 ${filter}
     ORDER BY a.check_in_at DESC`,
    params
  );
}
