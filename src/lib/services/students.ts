import { database } from "@/lib/db";
import { hashPassword, newTemporaryPassword } from "@/lib/crypto";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import type { Actor } from "@/lib/permissions";
import type { Student, StudentStatus } from "@/lib/types";

export interface RegisterStudentInput {
  fullName: string;
  email: string;
  password?: string;
  hostelId?: string | null;
  classGroup?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  photographUrl?: string | null;
}

export async function generateNextRegistrationNumber(): Promise<string> {
  const db = database();
  const rows = await db.query<{ nextval: string }>("SELECT nextval('registration_seq')::text as nextval");
  const num = rows[0]?.nextval || String(Date.now()).slice(-4);
  return `IMASA-${num}`;
}

export async function listStudents(options: {
  search?: string;
  hostelId?: string;
  status?: StudentStatus;
  limit?: number;
  offset?: number;
} = {}): Promise<{ students: Student[]; total: number }> {
  const db = database();
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(s.full_name ILIKE $${params.length} OR s.registration_number ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }

  if (options.hostelId) {
    params.push(options.hostelId);
    conditions.push(`s.hostel_id = $${params.length}`);
  }

  if (options.status) {
    params.push(options.status);
    conditions.push(`s.student_status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await db.query<{ count: string }>(
    `SELECT count(*)::text as count FROM students s JOIN users u ON u.id = s.user_id ${whereClause}`,
    params
  );
  const total = parseInt(countRows[0]?.count || "0", 10);

  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  params.push(limit, offset);

  const rows = await db.query<any>(
    `SELECT 
      s.id, s.user_id, s.registration_number, s.full_name, s.photograph_url,
      s.hostel_id, h.hostel_name, s.class_group, s.phone, s.emergency_contact,
      s.student_status, s.date_registered, s.created_by, s.updated_at, s.status_reason, u.email
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN hostels h ON h.id = s.hostel_id
     ${whereClause}
     ORDER BY s.date_registered DESC, s.full_name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { students: rows, total };
}

export async function getStudentById(id: string): Promise<Student | null> {
  const db = database();
  const rows = await db.query<any>(
    `SELECT 
      s.id, s.user_id, s.registration_number, s.full_name, s.photograph_url,
      s.hostel_id, h.hostel_name, s.class_group, s.phone, s.emergency_contact,
      s.student_status, s.date_registered, s.created_by, s.updated_at, s.status_reason
     FROM students s
     LEFT JOIN hostels h ON h.id = s.hostel_id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function getStudentByUserId(userId: string): Promise<Student | null> {
  const db = database();
  const rows = await db.query<any>(
    `SELECT 
      s.id, s.user_id, s.registration_number, s.full_name, s.photograph_url,
      s.hostel_id, h.hostel_name, s.class_group, s.phone, s.emergency_contact,
      s.student_status, s.date_registered, s.created_by, s.updated_at, s.status_reason
     FROM students s
     LEFT JOIN hostels h ON h.id = s.hostel_id
     WHERE s.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getStudentByRegistration(regNo: string): Promise<Student | null> {
  const db = database();
  const rows = await db.query<any>(
    `SELECT 
      s.id, s.user_id, s.registration_number, s.full_name, s.photograph_url,
      s.hostel_id, h.hostel_name, s.class_group, s.phone, s.emergency_contact,
      s.student_status, s.date_registered, s.created_by, s.updated_at, s.status_reason
     FROM students s
     LEFT JOIN hostels h ON h.id = s.hostel_id
     WHERE UPPER(s.registration_number) = UPPER($1)`,
    [regNo.trim()]
  );
  return rows[0] || null;
}

export async function registerStudent(input: RegisterStudentInput, actor: Actor): Promise<Student> {
  const db = database();
  const temporaryPassword = input.password || newTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const regNumber = await generateNextRegistrationNumber();

  return await db.transaction(async (tx) => {
    // 1. Create user
    let userRows;
    try {
      userRows = await tx.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, role, account_status, full_name)
         VALUES ($1, $2, 'student', 'active', $3)
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

    // 2. Default avatar if none provided
    const photo = input.photographUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(input.fullName)}&backgroundColor=142B4A`;

    // 3. Create student record
    let studentRows;
    try {
      studentRows = await tx.query<Student>(
        `INSERT INTO students (
          user_id, registration_number, full_name, photograph_url, hostel_id,
          class_group, phone, emergency_contact, student_status, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9)
         RETURNING *`,
        [
          userId,
          regNumber,
          input.fullName.trim(),
          photo,
          input.hostelId || null,
          input.classGroup || "Group A",
          input.phone || null,
          input.emergencyContact || null,
          actor.id,
        ]
      );
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new DomainError("A student with this registration number already exists.", 409);
      }
      throw err;
    }

    const student = studentRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "student.register",
      affectedRecordType: "student",
      affectedRecordId: student.id,
      reason: "New student registration",
      newValue: { id: student.id, registrationNumber: regNumber, email: input.email },
    });

    return { ...student, temporary_password: temporaryPassword };
  });
}

export async function updateStudent(id: string, updates: Partial<Student>, actor: Actor): Promise<Student> {
  const current = await getStudentById(id);
  if (!current) throw new DomainError("Student not found.", 404);

  const db = database();
  const fields: string[] = [];
  const params: unknown[] = [id];

  if (updates.full_name !== undefined) {
    params.push(updates.full_name.trim());
    fields.push(`full_name = $${params.length}`);
  }
  if (updates.photograph_url !== undefined) {
    params.push(updates.photograph_url);
    fields.push(`photograph_url = $${params.length}`);
  }
  if (updates.hostel_id !== undefined) {
    params.push(updates.hostel_id || null);
    fields.push(`hostel_id = $${params.length}`);
  }
  if (updates.class_group !== undefined) {
    params.push(updates.class_group || null);
    fields.push(`class_group = $${params.length}`);
  }
  if (updates.phone !== undefined) {
    params.push(updates.phone || null);
    fields.push(`phone = $${params.length}`);
  }
  if (updates.emergency_contact !== undefined) {
    params.push(updates.emergency_contact || null);
    fields.push(`emergency_contact = $${params.length}`);
  }

  if (fields.length === 0) return current;

  fields.push("updated_at = now()");

  const rows = await db.query<Student>(
    `UPDATE students SET ${fields.join(", ")} WHERE id = $1 RETURNING *`,
    params
  );

  const updated = rows[0];

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "student.update",
    affectedRecordType: "student",
    affectedRecordId: id,
    reason: "Student details updated",
    previousValue: current as any,
    newValue: updated as any,
  });

  return updated;
}

export async function suspendStudent(id: string, reason: string, actor: Actor): Promise<Student> {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A substantive reason is required to suspend a student ID.", 400);
  }

  const current = await getStudentById(id);
  if (!current) throw new DomainError("Student not found.", 404);
  if (current.student_status === "suspended") {
    throw new DomainError("Student ID is already suspended.", 400);
  }
  if (current.student_status === "revoked") {
    throw new DomainError("Student ID is permanently revoked. Reinstatement required first.", 400);
  }

  const db = database();
  return await db.transaction(async (tx) => {
    // 1. Update student status
    const studentRows = await tx.query<Student>(
      `UPDATE students 
       SET student_status = 'suspended', status_reason = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, reason.trim()]
    );

    // 2. Immediately revoke any active daily authorization for this student
    await tx.query(
      `UPDATE daily_authorizations
       SET authorization_status = 'revoked', revoked_at = now(), revoked_by = $2,
           revoke_reason = $3
       WHERE student_id = $1 AND authorization_status = 'active'`,
      [id, actor.id, `Automatic revocation due to ID suspension: ${reason.trim()}`]
    );

    const updated = studentRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "student.suspend",
      affectedRecordType: "student",
      affectedRecordId: id,
      reason: reason.trim(),
      previousValue: { status: current.student_status },
      newValue: { status: "suspended", reason: reason.trim() },
    });

    return updated;
  });
}

export async function revokeStudent(id: string, reason: string, actor: Actor): Promise<Student> {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A substantive reason is required to revoke a student ID.", 400);
  }

  const current = await getStudentById(id);
  if (!current) throw new DomainError("Student not found.", 404);
  if (current.student_status === "revoked") {
    throw new DomainError("Student ID is already revoked.", 400);
  }

  const db = database();
  return await db.transaction(async (tx) => {
    // 1. Permanently revoke student ID
    const studentRows = await tx.query<Student>(
      `UPDATE students 
       SET student_status = 'revoked', status_reason = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, reason.trim()]
    );

    // 2. Immediately revoke any active daily authorizations
    await tx.query(
      `UPDATE daily_authorizations
       SET authorization_status = 'revoked', revoked_at = now(), revoked_by = $2,
           revoke_reason = $3
       WHERE student_id = $1 AND authorization_status = 'active'`,
      [id, actor.id, `Permanent revocation of student ID: ${reason.trim()}`]
    );

    const updated = studentRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "student.revoke",
      affectedRecordType: "student",
      affectedRecordId: id,
      reason: reason.trim(),
      previousValue: { status: current.student_status },
      newValue: { status: "revoked", reason: reason.trim() },
    });

    return updated;
  });
}

export async function reinstateStudent(id: string, reason: string, actor: Actor): Promise<Student> {
  if (!reason || reason.trim().length < 5) {
    throw new DomainError("A substantive reason is required to reinstate a student ID.", 400);
  }

  const current = await getStudentById(id);
  if (!current) throw new DomainError("Student not found.", 404);
  if (current.student_status === "active") {
    throw new DomainError("Student ID is already active.", 400);
  }

  const db = database();
  return await db.transaction(async (tx) => {
    const studentRows = await tx.query<Student>(
      `UPDATE students 
       SET student_status = 'active', status_reason = $2, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, `Reinstated: ${reason.trim()}`]
    );

    const updated = studentRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "student.reinstate",
      affectedRecordType: "student",
      affectedRecordId: id,
      reason: reason.trim(),
      previousValue: { status: current.student_status },
      newValue: { status: "active", reason: reason.trim() },
    });

    return updated;
  });
}
