import { cookies } from "next/headers";
import { database } from "@/lib/db";
import { readPayload, signPayload } from "@/lib/crypto";
import { DomainError } from "@/lib/errors";
import type { Actor, Role, Permission } from "@/lib/permissions";
import { hasGrant, isPresident } from "@/lib/permissions";

const COOKIE_NAME = "imasa_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionTokenPayload {
  userId: string;
  role: Role;
  email: string;
  exp: number;
}

export async function createSessionCookie(userId: string, role: Role, email: string) {
  const payload: SessionTokenPayload = {
    userId,
    role,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const signed = signPayload(payload as unknown as Record<string, unknown>);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return signed;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionPayload(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = readPayload<SessionTokenPayload>(token);
  if (!payload) return null;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function getCurrentActor(): Promise<Actor | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  const db = database();
  const users = await db.query<any>(
    `SELECT 
      u.id, u.email, u.role, u.account_status, u.full_name, u.mfa_enabled,
      t.id as teacher_id, t.account_status as teacher_status, t.assigned_class,
      s.id as student_id, s.student_status, s.registration_number,
      hs.id as hostel_staff_id, hs.hostel_id
     FROM users u
     LEFT JOIN teachers t ON t.user_id = u.id
     LEFT JOIN students s ON s.user_id = u.id
     LEFT JOIN hostel_staff hs ON hs.user_id = u.id
     WHERE u.id = $1`,
    [session.userId]
  );

  const user = users[0];
  if (!user || user.account_status !== "active") {
    return null;
  }

  // Load administrator permissions if applicable
  let permissions: string[] = [];
  if (user.role === "administrator" || user.role === "super_admin") {
    const permRows = await db.query<{ permission: string }>(
      `SELECT permission FROM administrator_permissions WHERE user_id = $1`,
      [user.id]
    );
    permissions = permRows.map((r) => r.permission);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    accountStatus: user.account_status,
    fullName: user.full_name,
    permissions,
    teacherId: user.teacher_id || null,
    teacherStatus: user.teacher_status || null,
    assignedClass: user.assigned_class || null,
    studentId: user.student_id || null,
    studentStatus: user.student_status || null,
    registrationNumber: user.registration_number || null,
    hostelStaffId: user.hostel_staff_id || null,
    hostelId: user.hostel_id || null,
    mfaEnabled: user.mfa_enabled ?? false,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) {
    throw new DomainError("Authentication required.", 401);
  }
  return actor;
}

export async function requireRole(allowedRoles: Role[]): Promise<Actor> {
  const actor = await requireActor();
  if (!allowedRoles.includes(actor.role)) {
    throw new DomainError("You do not have permission to access this resource.", 403);
  }
  return actor;
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (isPresident(actor)) return actor;
  if (hasGrant(actor, permission)) return actor;
  throw new DomainError(`Permission denied: requires '${permission}'.`, 403);
}
