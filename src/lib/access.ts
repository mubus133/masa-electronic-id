import { database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { can, type Actor } from "@/lib/permissions";

export const badRequest = (message: string) => new DomainError(message, 400);
export const forbidden = (message = "You do not have permission to do that.") => new DomainError(message, 403);
export const notFound = (message: string) => new DomainError(message, 404);

const STUDENT_RECORD_PERMISSIONS = [
  "students.register",
  "students.edit",
  "students.suspend",
  "students.revoke",
  "students.reinstate",
  "attendance.view",
  "attendance.confirm",
  "reports.view",
];

export function isActiveTeacher(actor: Actor) {
  return actor.role === "teacher" && actor.accountStatus === "active" && Boolean(actor.teacherId) && actor.teacherStatus === "active";
}

export function isActiveHostelStaff(actor: Actor) {
  return actor.role === "hostel_staff" && actor.accountStatus === "active" && Boolean(actor.hostelId);
}

export function isAdministrator(actor: Actor) {
  return (actor.role === "super_admin" || actor.role === "administrator") && actor.accountStatus === "active";
}

export function canAny(actor: Actor, permissions: string[]) {
  return permissions.some((permission) => can(actor, permission));
}

export function requireGrant(actor: Actor, permission: string) {
  if (!can(actor, permission)) throw forbidden(`This needs the "${permission}" permission.`);
}

export async function isAssignedTeacher(sessionId: string, actor: Actor) {
  if (!isActiveTeacher(actor)) return false;
  const rows = await database().query(
    "SELECT 1 FROM session_teacher_assignments WHERE session_id = $1 AND teacher_id = $2",
    [sessionId, actor.teacherId],
  );
  return rows.length > 0;
}

// Session work is allowed for the President, an administrator holding the
// permission, or a teacher assigned to that specific session.
export async function assertSessionAccess(sessionId: string, actor: Actor, permission: string) {
  if (can(actor, permission)) return;
  if (await isAssignedTeacher(sessionId, actor)) return;
  throw forbidden("Only a teacher assigned to this session, or an authorized administrator, can do this.");
}

export function assertStudentVisible(actor: Actor, student: { id: string; hostel_id: string | null }) {
  if (actor.role === "student") {
    if (actor.studentId === student.id) return;
    throw forbidden("You can only view your own record.");
  }
  if (canAny(actor, STUDENT_RECORD_PERMISSIONS)) return;
  if (isActiveTeacher(actor)) return;
  if (isActiveHostelStaff(actor) && student.hostel_id === actor.hostelId) return;
  throw forbidden("This student is outside your access scope.");
}

export function canSearchStudents(actor: Actor) {
  return canAny(actor, STUDENT_RECORD_PERMISSIONS) || isActiveTeacher(actor) || isActiveHostelStaff(actor);
}
