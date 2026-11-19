import { database } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertSessionAccess, badRequest, notFound, requireGrant } from "@/lib/access";
import { endOfZonedDay, weekdayName } from "@/lib/time";
import { sha256, randomToken } from "@/lib/crypto";
import type { Actor } from "@/lib/permissions";
import type { Session, SessionStatus, SystemSettings } from "@/lib/types";

export interface CreateSessionInput {
  sessionName: string;
  sessionDate: string; // YYYY-MM-DD
  weekday?: string;
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
  const name = input.sessionName?.trim();
  if (!name) throw badRequest("Give the session a name.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate ?? "")) throw badRequest("Pick a session date.");
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) throw badRequest("Enter a start and end time.");
  if (endsAt <= startsAt) throw badRequest("The session must end after it starts.");

  const settings = await getSystemSettings();
  const timezone = settings.timezone || "Africa/Lagos";
  const weekday = weekdayName(input.sessionDate, timezone);

  return database().transaction(async (tx) => {
    const rows = await tx.query<Session>(
      `INSERT INTO sessions (session_name, session_date, weekday, starts_at, ends_at, timezone, class_group, session_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
       RETURNING *`,
      [name, input.sessionDate, weekday, startsAt.toISOString(), endsAt.toISOString(), timezone, input.classGroup?.trim() || null, actor.id],
    );
    const session = rows[0];

    for (const teacherId of new Set(input.teacherIds ?? [])) {
      const teacher = await tx.query("SELECT 1 FROM teachers WHERE id = $1 AND account_status = 'active'", [teacherId]);
      if (!teacher.length) throw badRequest("One of the selected teachers is inactive or doesn't exist.");
      await tx.query(
        "INSERT INTO session_teacher_assignments (session_id, teacher_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [session.id, teacherId],
      );
    }

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "session.create",
      affectedRecordType: "session",
      affectedRecordId: session.id,
      reason: "Session scheduled",
      newValue: { name, date: input.sessionDate, weekday, teacherIds: input.teacherIds ?? [] },
    });
    return session;
  });
}

// Check-in may open a configurable number of minutes before the planned start.
export function assertCheckInWindow(session: Session, settings: SystemSettings) {
  const opensAt = new Date(session.starts_at).getTime() - (settings.attendance_open_minutes_before ?? 30) * 60_000;
  if (Date.now() < opensAt) {
    const minutes = settings.attendance_open_minutes_before ?? 30;
    throw badRequest(`Check-in opens ${minutes} minutes before the session starts.`);
  }
}

async function transitionSession(
  sessionId: string,
  actor: Actor,
  permission: string,
  allowedFrom: SessionStatus[],
  update: string,
  action: string,
  reason: string,
) {
  await assertSessionAccess(sessionId, actor, permission);
  const session = await getSessionById(sessionId);
  if (!session) throw notFound("Session not found.");
  if (!allowedFrom.includes(session.session_status)) {
    throw badRequest(`This session is ${session.session_status}, so that isn't possible.`);
  }
  return { session, run: () => database().transaction(async (tx) => {
    const rows = await tx.query<Session>(`UPDATE sessions SET ${update} WHERE id = $1 RETURNING *`, [sessionId]);
    await tx.query(
      "UPDATE qr_tokens SET token_status = 'revoked', revoked_at = now() WHERE session_id = $1 AND token_status = 'active'",
      [sessionId],
    );
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action,
      affectedRecordType: "session",
      affectedRecordId: sessionId,
      reason,
      previousValue: { status: session.session_status },
      newValue: { status: rows[0].session_status },
    });
    return rows[0];
  }) };
}

export async function openSessionAttendance(sessionId: string, actor: Actor): Promise<Session> {
  await assertSessionAccess(sessionId, actor, "sessions.manage");
  const session = await getSessionById(sessionId);
  if (!session) throw notFound("Session not found.");
  if (session.session_status !== "scheduled" && session.session_status !== "closed") {
    throw badRequest(`This session is ${session.session_status}, so check-in can't be opened.`);
  }
  assertCheckInWindow(session, await getSystemSettings());
  return database().transaction(async (tx) => {
    const rows = await tx.query<Session>(
      `UPDATE sessions SET session_status = 'open', attendance_opened_at = COALESCE(attendance_opened_at, now()), attendance_closed_at = NULL
       WHERE id = $1 RETURNING *`,
      [sessionId],
    );
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "session.open_attendance",
      affectedRecordType: "session",
      affectedRecordId: sessionId,
      reason: "Check-in opened",
      previousValue: { status: session.session_status },
      newValue: { status: "open" },
    });
    return rows[0];
  });
}

export async function closeSessionAttendance(sessionId: string, actor: Actor): Promise<Session> {
  const { run } = await transitionSession(
    sessionId, actor, "sessions.manage", ["open"],
    "session_status = 'closed', attendance_closed_at = now()",
    "session.close_attendance", "Check-in closed",
  );
  return run();
}

// Cancelling is an administration decision; assigned teachers can't cancel.
export async function cancelSession(sessionId: string, reason: string, actor: Actor): Promise<Session> {
  requireGrant(actor, "sessions.manage");
  const trimmed = reason?.trim() ?? "";
  if (trimmed.length < 5) throw badRequest("Give a reason for cancelling this session.");
  const { run } = await transitionSession(
    sessionId, actor, "sessions.manage", ["scheduled", "open", "closed"],
    "session_status = 'cancelled', attendance_closed_at = COALESCE(attendance_closed_at, now())",
    "session.cancel", trimmed,
  );
  return run();
}

export function eligibleAttendanceStatuses(settings: SystemSettings) {
  const statuses = ["present"];
  if (settings.late_receives_pass) statuses.push("late");
  if (settings.excused_receives_pass) statuses.push("excused");
  return statuses;
}

export function passExpiry(session: Session, settings: SystemSettings, now = new Date()) {
  const hours = settings.pass_expiry_hours || 6;
  if (settings.pass_expiry_mode === "end_of_day") {
    return endOfZonedDay(session.session_date, settings.timezone || "Africa/Lagos");
  }
  return new Date(now.getTime() + hours * 3_600_000);
}

export async function completeSession(sessionId: string, actor: Actor): Promise<{ session: Session; issuedCount: number }> {
  await assertSessionAccess(sessionId, actor, "sessions.manage");
  const session = await getSessionById(sessionId);
  if (!session) throw notFound("Session not found.");
  if (session.session_status === "completed") throw badRequest("This session is already completed.");
  if (session.session_status === "cancelled") throw badRequest("A cancelled session can't be completed.");
  if (session.session_status === "scheduled") throw badRequest("Open check-in before completing this session.");

  const db = database();
  const pending = await db.query<{ count: number }>(
    "SELECT count(*)::int AS count FROM attendance WHERE session_id = $1 AND attendance_status = 'pending'",
    [sessionId],
  );
  if (pending[0].count > 0) {
    throw badRequest(`${pending[0].count} check-in${pending[0].count === 1 ? " is" : "s are"} still waiting for review. Confirm or reject them first.`);
  }

  const settings = await getSystemSettings();
  const expiresAt = passExpiry(session, settings);
  if (expiresAt.getTime() <= Date.now()) {
    throw badRequest("Passes for this session would already be expired. Check the pass expiry setting or the session date.");
  }

  return db.transaction(async (tx) => {
    const rows = await tx.query<Session>(
      `UPDATE sessions
       SET session_status = 'completed', completed_at = now(), attendance_closed_at = COALESCE(attendance_closed_at, now())
       WHERE id = $1 AND session_status IN ('open', 'closed')
       RETURNING *`,
      [sessionId],
    );
    if (!rows.length) throw badRequest("This session changed while you were completing it. Refresh and try again.");

    await tx.query(
      "UPDATE qr_tokens SET token_status = 'revoked', revoked_at = now() WHERE session_id = $1 AND token_status = 'active'",
      [sessionId],
    );

    const eligible = await tx.query<{ attendance_id: string; student_id: string; hostel_id: string | null }>(
      `SELECT a.id AS attendance_id, a.student_id, s.hostel_id
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       WHERE a.session_id = $1
         AND a.attendance_status = ANY($2::text[])
         AND a.teacher_confirmed_by IS NOT NULL
         AND s.student_status = 'active'
         AND u.account_status = 'active'
         AND ($3::boolean = false OR s.hostel_id IS NOT NULL)
         AND NOT EXISTS (SELECT 1 FROM daily_authorizations da WHERE da.student_id = a.student_id AND da.session_id = $1)`,
      [sessionId, eligibleAttendanceStatuses(settings), settings.require_hostel_assignment],
    );

    for (const row of eligible) {
      const inserted = await tx.query<{ id: string }>(
        `INSERT INTO daily_authorizations (student_id, session_id, attendance_id, token_hash, expires_at, authorization_status, hostel_id)
         VALUES ($1, $2, $3, $4, $5, 'active', $6) RETURNING id`,
        [row.student_id, sessionId, row.attendance_id, sha256(randomToken()), expiresAt.toISOString(), row.hostel_id],
      );
      await logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "authorization.issue",
        affectedRecordType: "daily_authorization",
        affectedRecordId: inserted[0].id,
        reason: "Issued on session completion",
        newValue: { studentId: row.student_id, sessionId, expiresAt: expiresAt.toISOString() },
      });
    }

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "session.complete",
      affectedRecordType: "session",
      affectedRecordId: sessionId,
      reason: `Session completed; ${eligible.length} pass${eligible.length === 1 ? "" : "es"} issued`,
      previousValue: { status: session.session_status },
      newValue: { status: "completed", issuedCount: eligible.length, expiresAt: expiresAt.toISOString() },
    });

    return { session: rows[0], issuedCount: eligible.length };
  });
}
