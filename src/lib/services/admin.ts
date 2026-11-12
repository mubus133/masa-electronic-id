import { database } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import { GRANTABLE_PERMISSIONS, PERMISSION_KEYS } from "@/lib/permissions";
import type { Actor, Permission } from "@/lib/permissions";
import type { AuditLog, SystemSettings } from "@/lib/types";

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  revokedStudents: number;
  totalTeachers: number;
  totalHostels: number;
  activeHostelStaff: number;
  todaySessions: number;
  todayAttendance: number;
  todayPassesIssued: number;
  todayHostelEntries: number;
  pendingAttendance: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = database();

  const [
    studentCounts,
    teacherCounts,
    hostelCounts,
    staffCounts,
    sessionCounts,
    attendanceCounts,
    passCounts,
    entryCounts,
    pendingCounts,
  ] = await Promise.all([
    db.query<any>(`
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE student_status = 'active')::int as active,
        count(*) FILTER (WHERE student_status = 'suspended')::int as suspended,
        count(*) FILTER (WHERE student_status = 'revoked')::int as revoked
      FROM students
    `),
    db.query<any>("SELECT count(*)::int as total FROM teachers WHERE account_status = 'active'"),
    db.query<any>("SELECT count(*)::int as total FROM hostels WHERE hostel_status = 'active'"),
    db.query<any>("SELECT count(*)::int as total FROM hostel_staff WHERE staff_status = 'active'"),
    db.query<any>("SELECT count(*)::int as total FROM sessions WHERE session_date = current_date"),
    db.query<any>("SELECT count(*)::int as total FROM attendance WHERE check_in_at::date = current_date"),
    db.query<any>("SELECT count(*)::int as total FROM daily_authorizations WHERE issued_at::date = current_date"),
    db.query<any>("SELECT count(*)::int as total FROM hostel_entry_logs WHERE verification_time::date = current_date"),
    db.query<any>("SELECT count(*)::int as total FROM attendance WHERE attendance_status = 'pending'"),
  ]);

  return {
    totalStudents: studentCounts[0]?.total || 0,
    activeStudents: studentCounts[0]?.active || 0,
    suspendedStudents: studentCounts[0]?.suspended || 0,
    revokedStudents: studentCounts[0]?.revoked || 0,
    totalTeachers: teacherCounts[0]?.total || 0,
    totalHostels: hostelCounts[0]?.total || 0,
    activeHostelStaff: staffCounts[0]?.total || 0,
    todaySessions: sessionCounts[0]?.total || 0,
    todayAttendance: attendanceCounts[0]?.total || 0,
    todayPassesIssued: passCounts[0]?.total || 0,
    todayHostelEntries: entryCounts[0]?.total || 0,
    pendingAttendance: pendingCounts[0]?.total || 0,
  };
}

export async function listAdministrators(): Promise<any[]> {
  const db = database();
  const admins = await db.query<any>(
    `SELECT u.id, u.email, u.full_name, u.role, u.account_status, u.created_at, u.last_login_at
     FROM users u
     WHERE u.role IN ('administrator', 'super_admin')
     ORDER BY u.role DESC, u.full_name ASC`
  );

  for (const admin of admins) {
    const perms = await db.query<{ permission: string }>(
      "SELECT permission FROM administrator_permissions WHERE user_id = $1",
      [admin.id]
    );
    admin.permissions = perms.map((p) => p.permission);
  }

  return admins;
}

export async function createAdministrator(
  input: { fullName: string; email: string; password?: string; permissions: Permission[] },
  actor: Actor
): Promise<any> {
  const db = database();
  const defaultPassword = input.password || "Admin-Imasa-2026!";
  const passwordHash = await hashPassword(defaultPassword);

  // Validate permissions
  for (const p of input.permissions) {
    if (!PERMISSION_KEYS.has(p)) {
      throw new DomainError(`Unknown permission: '${p}'.`, 400);
    }
  }

  return await db.transaction(async (tx) => {
    let userRows;
    try {
      userRows = await tx.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, role, account_status, full_name)
         VALUES ($1, $2, 'administrator', 'active', $3)
         RETURNING id`,
        [input.email.toLowerCase().trim(), passwordHash, input.fullName.trim()]
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new DomainError("A user with this email address already exists.", 409);
      }
      throw err;
    }

    const userId = userRows[0].id;

    for (const perm of input.permissions) {
      await tx.query(
        `INSERT INTO administrator_permissions (user_id, permission, granted_by, granted_at)
         VALUES ($1, $2, $3, now())`,
        [userId, perm, actor.id]
      );
    }

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "admin.create",
      affectedRecordType: "user",
      affectedRecordId: userId,
      reason: `Delegated administrator created with ${input.permissions.length} permissions`,
      newValue: { email: input.email, permissions: input.permissions },
    });

    return { id: userId, email: input.email, fullName: input.fullName, permissions: input.permissions };
  });
}

export async function updateAdministratorPermissions(
  userId: string,
  permissions: Permission[],
  actor: Actor
) {
  const db = database();
  const user = (await db.query<any>("SELECT * FROM users WHERE id = $1", [userId]))[0];
  if (!user) throw new DomainError("Administrator not found.", 404);
  if (user.role === "super_admin") {
    throw new DomainError("President (Super Admin) automatically holds all system permissions.", 400);
  }

  for (const p of permissions) {
    if (!PERMISSION_KEYS.has(p)) {
      throw new DomainError(`Unknown permission: '${p}'.`, 400);
    }
  }

  await db.transaction(async (tx) => {
    await tx.query("DELETE FROM administrator_permissions WHERE user_id = $1", [userId]);
    for (const p of permissions) {
      await tx.query(
        "INSERT INTO administrator_permissions (user_id, permission, granted_by, granted_at) VALUES ($1, $2, $3, now())",
        [userId, p, actor.id]
      );
    }
  });

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "admin.permissions_updated",
    affectedRecordType: "user",
    affectedRecordId: userId,
    reason: "Delegated permissions updated by President",
    newValue: { permissions },
  });

  return { success: true };
}

export async function listAuditLogs(options: {
  search?: string;
  action?: string;
  actorUserId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ logs: AuditLog[]; total: number }> {
  const db = database();
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(al.action ILIKE $${params.length} OR al.reason ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
  }

  if (options.action) {
    params.push(options.action);
    conditions.push(`al.action = $${params.length}`);
  }

  if (options.actorUserId) {
    params.push(options.actorUserId);
    conditions.push(`al.actor_user_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await db.query<{ count: string }>(
    `SELECT count(*)::text as count FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_user_id ${whereClause}`,
    params
  );
  const total = parseInt(countRows[0]?.count || "0", 10);

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  params.push(limit, offset);

  const rows = await db.query<any>(
    `SELECT 
      al.*,
      u.full_name as actor_name,
      u.email as actor_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { logs: rows, total };
}

export async function updateSystemSettings(
  updates: Partial<SystemSettings>,
  actor: Actor
): Promise<SystemSettings> {
  const db = database();
  const current = (await db.query<SystemSettings>("SELECT * FROM system_settings WHERE id = 1"))[0];

  const fields: string[] = [];
  const params: unknown[] = [];

  const allowedKeys: (keyof SystemSettings)[] = [
    "timezone",
    "qr_ttl_seconds",
    "pass_expiry_mode",
    "pass_expiry_hours",
    "one_time_entry",
    "late_attendance_allowed",
    "late_cutoff_minutes",
    "late_receives_pass",
    "excused_receives_pass",
    "attendance_open_minutes_before",
    "require_hostel_assignment",
    "emergency_exceptions_enabled",
    "mfa_required_privileged",
    "policies_approved",
  ];

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      params.push(updates[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }

  if (fields.length === 0) return current;

  fields.push("updated_at = now()");

  const rows = await db.query<SystemSettings>(
    `UPDATE system_settings SET ${fields.join(", ")} WHERE id = 1 RETURNING *`,
    params
  );

  const updated = rows[0];

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "system.settings_updated",
    affectedRecordType: "system_settings",
    affectedRecordId: "1",
    reason: "System operational policies updated",
    previousValue: current as any,
    newValue: updated as any,
  });

  return updated;
}
