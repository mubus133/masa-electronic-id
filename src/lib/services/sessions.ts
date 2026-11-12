import { database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { endOfZonedDay } from "@/lib/time";
import { sha256, randomToken } from "@/lib/crypto";
import type { Actor } from "@/lib/permissions";
import type { Session, SessionStatus, SystemSettings } from "@/lib/types";

export interface CreateSessionInput {
  sessionName: string;
  sessionDate: string; // YYYY-MM-DD
  weekday: "Friday" | "Saturday" | "Sunday";
  startsAt: string; // ISO
  endsAt: string; // ISO
  classGroup?: string;
  teacherIds?: string[];
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const db = database();
  const rows = await db.query<SystemSettings>("SELECT * FROM system_settings WHERE id = 1");
  if (rows[0]) return rows[0];

  return {
    id: 1,
    timezone: "Africa/Lagos",
    qr_ttl_seconds: 120,
    pass_expiry_mode: "end_of_day",
    pass_expiry_hours: 6,
    one_time_entry: true,
    late_attendance_allowed: true,
    late_cutoff_minutes: 20,
    late_receives_pass: true,
    excused_receives_pass: false,
    attendance_open_minutes_before: 30,
    require_hostel_assignment: true,
    emergency_exceptions_enabled: true,
    mfa_required_privileged: false,
    demo_mode: false,
    policies_approved: false,
    updated_at: new Date().toISOString(),
  };
}

export async function listSessions(options: {
  status?: SessionStatus;
  date?: string;
  teacherId?: string;
} = {}): Promise<Session[]> {
  const db = database();
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options.status) {
    params.push(options.status);
    conditions.push(`s.session_status = $${params.length}`);
  }

  if (options.date) {
    params.push(options.date);
    conditions.push(`s.session_date = $${params.length}`);
  }

  if (options.teacherId) {
    params.push(options.teacherId);
    conditions.push(`EXISTS (SELECT 1 FROM session_teacher_assignments sta WHERE sta.session_id = s.id AND sta.teacher_id = $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await db.query<Session>(
    `SELECT s.*,
      (SELECT count(*)::int FROM attendance a WHERE a.session_id = s.id) as attendance_count
     FROM sessions s
     ${whereClause}
     ORDER BY s.session_date DESC, s.starts_at DESC`,
    params
  );

  return rows;
}

export async function getSessionById(id: string): Promise<Session | null> {
  const db = database();
  const rows = await db.query<Session>(
    `SELECT s.*,
      (SELECT count(*)::int FROM attendance a WHERE a.session_id = s.id) as attendance_count
     FROM sessions s
     WHERE s.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const session = rows[0];
  const teachers = await db.query<any>(
    `SELECT t.id, t.user_id, t.full_name, t.teacher_code, t.assigned_class, t.account_status, t.created_at
     FROM teachers t
     JOIN session_teacher_assignments sta ON sta.teacher_id = t.id
     WHERE sta.session_id = $1`,
    [id]
  );
  session.teachers = teachers;

  return session;
}

export async function createSession(input: CreateSessionInput, actor: Actor): Promise<Session> {
  const db = database();
  const settings = await getSystemSettings();

  return await db.transaction(async (tx) => {
    const sessionRows = await tx.query<Session>(
      `INSERT INTO sessions (
        session_name, session_date, weekday, starts_at, ends_at, timezone,
        class_group, session_status, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
       RETURNING *`,
      [
        input.sessionName.trim(),
        input.sessionDate,
        input.weekday,
        input.startsAt,
        input.endsAt,
        settings.timezone || "Africa/Lagos",
        input.classGroup || "Group A",
        actor.id,
      ]
    );

    const session = sessionRows[0];

    // Assign teachers if specified
    if (input.teacherIds && input.teacherIds.length > 0) {
      for (const teacherId of input.teacherIds) {
        await tx.query(
          `INSERT INTO session_teacher_assignments (session_id, teacher_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [session.id, teacherId]
        );
      }
    }

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "session.create",
      affectedRecordType: "session",
      affectedRecordId: session.id,
      reason: "Madrasa session created",
      newValue: { name: session.session_name, date: session.session_date, weekday: session.weekday },
    });

    return session;
  });
}

export async function openSessionAttendance(sessionId: string, actor: Actor): Promise<Session> {
  const session = await getSessionById(sessionId);
  if (!session) throw new DomainError("Session not found.", 404);
  if (session.session_status === "completed") {
    throw new DomainError("Cannot open attendance for a completed session.", 400);
  }
  if (session.session_status === "cancelled") {
    throw new DomainError("Cannot open attendance for a cancelled session.", 400);
  }

  const db = database();
  const rows = await db.query<Session>(
    `UPDATE sessions 
     SET session_status = 'open', attendance_opened_at = COALESCE(attendance_opened_at, now())
     WHERE id = $1
     RETURNING *`,
    [sessionId]
  );

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "session.open_attendance",
    affectedRecordType: "session",
    affectedRecordId: sessionId,
    reason: "Attendance collection opened",
  });

  return rows[0];
}

export async function closeSessionAttendance(sessionId: string, actor: Actor): Promise<Session> {
  const session = await getSessionById(sessionId);
  if (!session) throw new DomainError("Session not found.", 404);

  const db = database();
  const rows = await db.query<Session>(
    `UPDATE sessions 
     SET session_status = 'closed', attendance_closed_at = now()
     WHERE id = $1
     RETURNING *`,
    [sessionId]
  );

  // Revoke active QR tokens for this session
  await db.query(
    `UPDATE qr_tokens 
     SET token_status = 'revoked', revoked_at = now()
     WHERE session_id = $1 AND token_status = 'active'`,
    [sessionId]
  );

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "session.close_attendance",
    affectedRecordType: "session",
    affectedRecordId: sessionId,
    reason: "Attendance collection closed",
  });

  return rows[0];
}

export async function completeSession(sessionId: string, actor: Actor): Promise<{
  session: Session;
  issuedCount: number;
}> {
  const session = await getSessionById(sessionId);
  if (!session) throw new DomainError("Session not found.", 404);
  if (session.session_status === "completed") {
    throw new DomainError("This session is already marked as completed.", 400);
  }
  if (session.session_status === "cancelled") {
    throw new DomainError("Cancelled sessions cannot be completed.", 400);
  }

  const settings = await getSystemSettings();
  const db = database();

  return await db.transaction(async (tx) => {
    // 1. Mark session as completed
    const sessionRows = await tx.query<Session>(
      `UPDATE sessions 
       SET session_status = 'completed', completed_at = now(),
           attendance_closed_at = COALESCE(attendance_closed_at, now())
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    // 2. Revoke any active QR tokens
    await tx.query(
      `UPDATE qr_tokens SET token_status = 'revoked', revoked_at = now()
       WHERE session_id = $1 AND token_status = 'active'`,
      [sessionId]
    );

    // 3. Mark all teacher-confirmed attendance records for this session as session_completed = true
    // (if that column exists or in our attendance table)
    // 4. AUTOMATIC DAILY HOSTEL AUTHORIZATION ENGINE:
    // Query eligible students:
    // - Student account is active
    // - Student status is active (NOT suspended, NOT revoked)
    // - Attendance status is 'present' (or 'late' if late_receives_pass is true)
    // - Attendance was confirmed by authorized teacher (teacher_confirmed_by is NOT null)
    // - No active daily authorization already issued for this student & session

    const allowedAttendanceStatuses = ["present"];
    if (settings.late_receives_pass) allowedAttendanceStatuses.push("late");

    const eligibleRows = await tx.query<any>(
      `SELECT a.id as attendance_id, a.student_id, s.hostel_id, s.student_status, u.account_status
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.session_id = $1
         AND a.attendance_status = ANY($2::text[])
         AND a.teacher_confirmed_by IS NOT NULL
         AND s.student_status = 'active'
         AND u.account_status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM daily_authorizations da 
           WHERE da.student_id = a.student_id AND da.session_id = $1
         )`,
      [sessionId, allowedAttendanceStatuses]
    );

    // Calculate expiry timestamp
    let expiresAt: Date;
    if (settings.pass_expiry_mode === "end_of_day") {
      expiresAt = endOfZonedDay(session.session_date, settings.timezone || "Africa/Lagos");
      // If end of day is already in past or less than 4 hours away, give at least 8 hours
      if (expiresAt.getTime() - Date.now() < 4 * 3600 * 1000) {
        expiresAt = new Date(Date.now() + (settings.pass_expiry_hours || 8) * 3600 * 1000);
      }
    } else {
      expiresAt = new Date(Date.now() + (settings.pass_expiry_hours || 8) * 3600 * 1000);
    }

    let issuedCount = 0;
    for (const eligible of eligibleRows) {
      const rawToken = randomToken();
      const tokenHash = sha256(rawToken);

      await tx.query(
        `INSERT INTO daily_authorizations (
          student_id, session_id, attendance_id, token_hash,
          issued_at, expires_at, authorization_status, hostel_id
         ) VALUES ($1, $2, $3, $4, now(), $5, 'active', $6)`,
        [
          eligible.student_id,
          sessionId,
          eligible.attendance_id,
          tokenHash,
          expiresAt.toISOString(),
          eligible.hostel_id || null,
        ]
      );
      issuedCount++;
    }

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "session.complete",
      affectedRecordType: "session",
      affectedRecordId: sessionId,
      reason: `Madrasa session completed. Generated ${issuedCount} daily hostel authorizations.`,
      newValue: { issuedCount, expiresAt: expiresAt.toISOString() },
    });

    return { session: sessionRows[0], issuedCount };
  });
}
