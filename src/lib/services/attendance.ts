import { database } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { assertSessionAccess, badRequest, forbidden, isAssignedTeacher, notFound } from "@/lib/access";
import { getStudentById } from "@/lib/services/students";
import { getSessionById, getSystemSettings } from "@/lib/services/sessions";
import { normalizeCheckInCode } from "@/lib/services/qr";
import type { Actor } from "@/lib/permissions";
import type { Attendance, AttendanceStatus, Session } from "@/lib/types";

export interface SubmitScanInput {
  qrPayload?: string;
  code?: string;
}

// Typed codes are short, so repeated wrong guesses from one student are throttled.
const CODE_WINDOW_MS = 10 * 60_000;
const CODE_MAX_FAILURES = 8;
const codeFailures = new Map<string, { count: number; first: number }>();

const assertCodeAttemptsLeft = (studentId: string) => {
  const entry = codeFailures.get(studentId);
  if (entry && Date.now() - entry.first < CODE_WINDOW_MS && entry.count >= CODE_MAX_FAILURES) {
    throw badRequest("Too many wrong codes. Wait a few minutes, or ask your teacher to check you in.");
  }
};

const noteCodeFailure = (studentId: string) => {
  const entry = codeFailures.get(studentId);
  if (!entry || Date.now() - entry.first >= CODE_WINDOW_MS) codeFailures.set(studentId, { count: 1, first: Date.now() });
  else entry.count += 1;
};

async function resolveTypedCode(code: string, studentId: string) {
  assertCodeAttemptsLeft(studentId);
  const normalized = normalizeCheckInCode(code);
  const rows = normalized.length === 8
    ? await database().query<{ session_id: string; token_hash: string }>(
        "SELECT session_id, token_hash FROM qr_tokens WHERE code_hash = $1 AND token_status = 'active' AND expires_at > now()",
        [sha256(normalized)],
      )
    : [];
  if (!rows[0]) {
    noteCodeFailure(studentId);
    throw badRequest("That code isn't valid. Check the code on the teacher's screen. It changes every couple of minutes.");
  }
  return rows[0];
}

const ATTENDANCE_COLUMNS = `
  a.*,
  s.full_name AS student_name,
  s.registration_number,
  s.photograph_url,
  ses.session_name,
  ses.session_date,
  u.full_name AS teacher_name`;

const ATTENDANCE_JOINS = `
  FROM attendance a
  JOIN students s ON s.id = a.student_id
  JOIN sessions ses ON ses.id = a.session_id
  LEFT JOIN users u ON u.id = a.teacher_confirmed_by`;

function parseQrPayload(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.imasa !== "madrasa_session" || typeof parsed.sessionId !== "string" || typeof parsed.token !== "string") {
      throw new Error("shape");
    }
    return { sessionId: parsed.sessionId as string, token: parsed.token as string };
  } catch {
    throw badRequest("This is not an IMASA session code. Scan the code on the teacher's screen.");
  }
}

function assertSessionAcceptsChanges(session: Session) {
  if (session.session_status === "completed") {
    throw badRequest("This session is already completed. Attendance can only be corrected by an administrator.");
  }
  if (session.session_status === "cancelled") {
    throw badRequest("This session was cancelled.");
  }
}

async function loadAttendanceForReview(attendanceId: string, actor: Actor) {
  const rows = await database().query<Attendance & { student_status: string }>(
    `SELECT a.*, s.student_status FROM attendance a JOIN students s ON s.id = a.student_id WHERE a.id = $1`,
    [attendanceId],
  );
  const record = rows[0];
  if (!record) throw notFound("Attendance record not found.");

  await assertSessionAccess(record.session_id, actor, "attendance.confirm");
  const session = await getSessionById(record.session_id);
  if (!session) throw notFound("Session not found.");
  assertSessionAcceptsChanges(session);
  return record;
}

export async function submitQrScan(input: SubmitScanInput, actor: Actor): Promise<Attendance> {
  if (actor.role !== "student" || !actor.studentId) {
    throw forbidden("Only students can check in with a session code.");
  }

  const student = await getStudentById(actor.studentId);
  if (!student) throw notFound("Student profile not found.");
  if (student.student_status !== "active") {
    throw forbidden(`Your ID is ${student.student_status}, so you can't check in. Contact IMASA administration.`);
  }

  let sessionId: string;
  let tokenHash: string;
  if (input.code) {
    const match = await resolveTypedCode(input.code, student.id);
    sessionId = match.session_id;
    tokenHash = match.token_hash;
  } else {
    const parsed = parseQrPayload(input.qrPayload ?? "");
    sessionId = parsed.sessionId;
    tokenHash = sha256(parsed.token);
  }
  const session = await getSessionById(sessionId);
  if (!session) throw badRequest("This code doesn't match any session.");
  if (session.session_status !== "open") {
    if (session.session_status === "completed" || session.session_status === "closed") {
      throw badRequest("Check-in for this session has closed.");
    }
    throw badRequest("Check-in for this session hasn't opened yet.");
  }

  const db = database();
  const tokenRows = await db.query<{ id: string; token_status: string; expires_at: string }>(
    "SELECT id, token_status, expires_at FROM qr_tokens WHERE session_id = $1 AND token_hash = $2",
    [sessionId, tokenHash],
  );
  const qrRecord = tokenRows[0];
  if (!qrRecord) throw badRequest("This code isn't valid for this session.");
  if (qrRecord.token_status !== "active" || new Date(qrRecord.expires_at).getTime() <= Date.now()) {
    if (qrRecord.token_status === "active") {
      await db.query("UPDATE qr_tokens SET token_status = 'expired' WHERE id = $1", [qrRecord.id]);
    }
    throw badRequest("This code has expired. Scan the new code on the teacher's screen.");
  }

  try {
    return await db.transaction(async (tx) => {
      const rows = await tx.query<Attendance>(
        `INSERT INTO attendance (student_id, session_id, check_in_method, attendance_status, sync_status, identity_confirmed)
         VALUES ($1, $2, 'qr', 'pending', 'synced', false)
         RETURNING *`,
        [student.id, sessionId],
      );
      const record = rows[0];
      await logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "attendance.scan",
        affectedRecordType: "attendance",
        affectedRecordId: record.id,
        reason: "Student checked in with session code; waiting for teacher confirmation",
        newValue: { studentId: student.id, sessionId, status: "pending" },
      });
      return record;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw badRequest("You have already submitted attendance for this session.");
    throw err;
  }
}

async function setReviewedStatus(
  attendanceId: string,
  status: "present" | "late" | "rejected",
  actor: Actor,
  reason: string | null,
): Promise<Attendance> {
  const current = await loadAttendanceForReview(attendanceId, actor);

  if (status !== "rejected" && current.student_status !== "active") {
    throw badRequest(`This student's ID is ${current.student_status}. Attendance can't be confirmed.`);
  }
  if (status === "late") {
    const settings = await getSystemSettings();
    if (!settings.late_attendance_allowed) throw badRequest("Late attendance is turned off in system settings.");
  }

  return database().transaction(async (tx) => {
    const rows = await tx.query<Attendance>(
      `UPDATE attendance
       SET attendance_status = $2,
           teacher_confirmed_by = $3,
           teacher_confirmed_at = now(),
           identity_confirmed = $4,
           rejection_reason = $5
       WHERE id = $1
       RETURNING *`,
      [attendanceId, status, actor.id, status !== "rejected", status === "rejected" ? reason : null],
    );
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: `attendance.${status === "present" ? "confirm" : status === "late" ? "mark_late" : "reject"}`,
      affectedRecordType: "attendance",
      affectedRecordId: attendanceId,
      reason: reason ?? (status === "late" ? "Teacher confirmed presence, marked late" : "Teacher confirmed physical presence"),
      previousValue: { status: current.attendance_status },
      newValue: { status, confirmedBy: actor.id },
    });
    return rows[0];
  });
}

export function confirmAttendance(attendanceId: string, actor: Actor) {
  return setReviewedStatus(attendanceId, "present", actor, null);
}

export function markLateAttendance(attendanceId: string, actor: Actor) {
  return setReviewedStatus(attendanceId, "late", actor, null);
}

export function rejectAttendance(attendanceId: string, reason: string, actor: Actor) {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 3) throw badRequest("Give a reason for rejecting this check-in.");
  return setReviewedStatus(attendanceId, "rejected", actor, trimmed);
}

// No-phone / dead-battery procedure. A teacher assigned to the session is the
// person confirming presence, so their record is confirmed immediately. When an
// administrator records it, it stays pending until the teacher confirms.
export async function recordManualAttendance(
  sessionId: string,
  studentId: string,
  reason: string,
  actor: Actor,
): Promise<Attendance> {
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) throw badRequest("Say why the student couldn't scan (for example: phone battery died).");

  await assertSessionAccess(sessionId, actor, "attendance.confirm");
  const session = await getSessionById(sessionId);
  if (!session) throw notFound("Session not found.");
  assertSessionAcceptsChanges(session);

  const student = await getStudentById(studentId);
  if (!student) throw notFound("Student not found.");
  if (student.student_status !== "active") {
    throw forbidden(`This student's ID is ${student.student_status}. Manual attendance can't be recorded.`);
  }

  const confirmedByTeacher = await isAssignedTeacher(sessionId, actor);

  try {
    return await database().transaction(async (tx) => {
      const rows = await tx.query<Attendance>(
        `INSERT INTO attendance (
           student_id, session_id, check_in_method, attendance_status, sync_status,
           teacher_confirmed_by, teacher_confirmed_at, identity_confirmed, manual_reason
         ) VALUES ($1, $2, 'manual', $3, 'synced', $4, $5, $6, $7)
         RETURNING *`,
        [
          studentId,
          sessionId,
          confirmedByTeacher ? "present" : "pending",
          confirmedByTeacher ? actor.id : null,
          confirmedByTeacher ? new Date().toISOString() : null,
          confirmedByTeacher,
          trimmed,
        ],
      );
      const record = rows[0];
      await logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "attendance.manual_entry",
        affectedRecordType: "attendance",
        affectedRecordId: record.id,
        reason: trimmed,
        newValue: { studentId, sessionId, status: record.attendance_status, method: "manual" },
      });
      return record;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw badRequest("This student already has attendance for this session.");
    throw err;
  }
}

export async function listSessionAttendance(sessionId: string, statusFilter?: AttendanceStatus): Promise<Attendance[]> {
  const params: unknown[] = [sessionId];
  let filter = "";
  if (statusFilter) {
    params.push(statusFilter);
    filter = "AND a.attendance_status = $2";
  }
  return database().query<Attendance>(
    `SELECT ${ATTENDANCE_COLUMNS} ${ATTENDANCE_JOINS}
     WHERE a.session_id = $1 ${filter}
     ORDER BY a.check_in_at DESC`,
    params,
  );
}

export async function listStudentAttendance(studentId: string): Promise<Attendance[]> {
  return database().query<Attendance>(
    `SELECT ${ATTENDANCE_COLUMNS} ${ATTENDANCE_JOINS}
     WHERE a.student_id = $1
     ORDER BY a.check_in_at DESC`,
    [studentId],
  );
}

export async function listRecentAttendance(limit = 200): Promise<Attendance[]> {
  return database().query<Attendance>(
    `SELECT ${ATTENDANCE_COLUMNS} ${ATTENDANCE_JOINS}
     ORDER BY a.check_in_at DESC
     LIMIT $1`,
    [limit],
  );
}
