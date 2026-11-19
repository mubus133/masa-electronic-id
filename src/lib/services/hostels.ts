import { database } from "@/lib/db";
import { hashPassword, newTemporaryPassword } from "@/lib/crypto";
import { DomainError, isUniqueViolation } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import type { Actor } from "@/lib/permissions";
import type { Hostel, HostelStaff } from "@/lib/types";

export async function listHostels(): Promise<Hostel[]> {
  const db = database();
  return await db.query<Hostel>(
    `SELECT h.id, h.hostel_name, h.hostel_location, h.hostel_status, h.created_at,
      (SELECT count(*)::int FROM students s WHERE s.hostel_id = h.id AND s.student_status = 'active') as active_student_count
     FROM hostels h
     ORDER BY h.hostel_name ASC`
  );
}

export async function getHostelById(id: string): Promise<Hostel | null> {
  const db = database();
  const rows = await db.query<Hostel>(
    `SELECT h.id, h.hostel_name, h.hostel_location, h.hostel_status, h.created_at,
      (SELECT count(*)::int FROM students s WHERE s.hostel_id = h.id AND s.student_status = 'active') as active_student_count
     FROM hostels h
     WHERE h.id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createHostel(name: string, location: string | null, actor: Actor): Promise<Hostel> {
  const db = database();
  try {
    const rows = await db.query<Hostel>(
      `INSERT INTO hostels (hostel_name, hostel_location, hostel_status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [name.trim(), location ? location.trim() : null]
    );

    const hostel = rows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "hostel.create",
      affectedRecordType: "hostel",
      affectedRecordId: hostel.id,
      reason: "Hostel created",
      newValue: { name: hostel.hostel_name, location: hostel.hostel_location },
    });

    return hostel;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new DomainError("A hostel with this name already exists.", 409);
    }
    throw err;
  }
}

export async function listHostelStaff(hostelId?: string): Promise<HostelStaff[]> {
  const db = database();
  const params: unknown[] = [];
  let filter = "";
  if (hostelId) {
    params.push(hostelId);
    filter = "WHERE hs.hostel_id = $1";
  }

  return await db.query<HostelStaff>(
    `SELECT hs.id, hs.user_id, hs.hostel_id, h.hostel_name, hs.full_name, hs.staff_status, hs.created_at, u.email
     FROM hostel_staff hs
     JOIN users u ON u.id = hs.user_id
     JOIN hostels h ON h.id = hs.hostel_id
     ${filter}
     ORDER BY hs.full_name ASC`,
    params
  );
}

export async function registerHostelStaff(
  input: { fullName: string; email: string; hostelId: string; password?: string },
  actor: Actor
): Promise<HostelStaff> {
  const db = database();
  const temporaryPassword = input.password || newTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const hostel = await getHostelById(input.hostelId);
  if (!hostel) throw new DomainError("Hostel not found.", 404);

  return await db.transaction(async (tx) => {
    let userRows;
    try {
      userRows = await tx.query<{ id: string }>(
        `INSERT INTO users (email, password_hash, role, account_status, full_name)
         VALUES ($1, $2, 'hostel_staff', 'active', $3)
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

    const staffRows = await tx.query<HostelStaff>(
      `INSERT INTO hostel_staff (user_id, hostel_id, full_name, staff_status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [userId, input.hostelId, input.fullName.trim()]
    );

    const staff = staffRows[0];

    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "hostel_staff.register",
      affectedRecordType: "hostel_staff",
      affectedRecordId: staff.id,
      reason: "Hostel staff account created",
      newValue: { id: staff.id, hostelId: input.hostelId, email: input.email },
    });

    return { ...staff, temporary_password: temporaryPassword };
  });
}
