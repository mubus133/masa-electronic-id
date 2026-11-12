import { database } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import type { Actor } from "@/lib/permissions";
import type { Teacher } from "@/lib/types";

export interface RegisterTeacherInput {
  fullName: string;
  email: string;
  teacherCode?: string;
  assignedClass?: string;
  password?: string;
}

export async function generateNextTeacherCode(): Promise<string> {
  const db = database();
  const rows = await db.query<{ nextval: string }>("SELECT nextval('teacher_code_seq')::text as nextval");
  const num = rows[0]?.nextval || String(Date.now()).slice(-3);
  return `T-${num}`;
}

export async function listTeachers(): Promise<Teacher[]> {
  const db = database();
  return await db.query<Teacher>(
    `SELECT t.id, t.user_id, t.full_name, t.teacher_code, t.assigned_class, t.account_status, t.created_at, u.email
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     ORDER BY t.full_name ASC`
  );
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  const db = database();
  const rows = await db.query<Teacher>(
    `SELECT t.id, t.user_id, t.full_name, t.teacher_code, t.assigned_class, t.account_status, t.created_at, u.email
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getTeacherByUserId(userId: string): Promise<Teacher | null> {
  const db = database();
  const rows = await db.query<Teacher>(
    `SELECT t.id, t.user_id, t.full_name, t.teacher_code, t.assigned_class, t.account_status, t.created_at, u.email
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     WHERE t.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function registerTeacher(input: RegisterTeacherInput, actor: Actor): Promise<Teacher> {
  const db = database();
  const teacherCode = input.teacherCode || (await generateNextTeacherCode());
  const defaultPassword = input.password || "Teacher-Imasa-2026!";
  const passwordHash = await hashPassword(defaultPassword);

  return await db.transaction(async (tx) => {
    let userRows;
    try {
      userRows = await tx.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, role, account_status, full_name)
         VALUES ($1, $2, 'teacher', 'active', $3)
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

    let teacherRows;
    try {
      teacherRows = await tx.query<Teacher>(
        `INSERT INTO teachers (user_id, full_name, teacher_code, assigned_class, account_status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING *`,
        [userId, input.fullName.trim(), teacherCode, input.assignedClass || "Group A"]
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new DomainError("A teacher with this code already exists.", 409);
      }
      throw err;
    }

    const teacher = teacherRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "teacher.register",
      affectedRecordType: "teacher",
      affectedRecordId: teacher.id,
      reason: "Teacher account created",
      newValue: { id: teacher.id, code: teacherCode, email: input.email },
    });

    return teacher;
  });
}
