export const GRANTABLE_PERMISSIONS = [
  { key: "students.register", label: "Register students", detail: "Create student accounts and registration numbers." },
  { key: "students.edit", label: "Edit students", detail: "Update student profiles, photographs, and hostel assignment." },
  { key: "students.suspend", label: "Suspend IDs", detail: "Temporarily disable an electronic ID." },
  { key: "students.revoke", label: "Revoke IDs", detail: "Permanently withdraw an electronic ID until reinstatement." },
  { key: "students.reinstate", label: "Reinstate IDs", detail: "Restore a suspended or revoked electronic ID." },
  { key: "teachers.manage", label: "Manage teachers", detail: "Register teachers and change their class assignment." },
  { key: "hostels.manage", label: "Manage hostels", detail: "Maintain hostels and hostel staff accounts." },
  { key: "sessions.manage", label: "Manage sessions", detail: "Create, cancel, and complete Madrasa sessions." },
  { key: "qr.generate", label: "Generate QR codes", detail: "Open attendance and issue session QR tokens." },
  { key: "attendance.confirm", label: "Confirm attendance", detail: "Confirm, reject, or record attendance." },
  { key: "attendance.view", label: "View attendance", detail: "Review attendance records." },
  { key: "authorizations.view", label: "View authorizations", detail: "Review daily hostel authorizations." },
  { key: "authorizations.revoke", label: "Revoke authorizations", detail: "Withdraw an issued daily authorization." },
  { key: "reports.view", label: "View reports", detail: "Open operational reports and CSV exports." },
  { key: "audit.view", label: "View audit logs", detail: "Read the append-only audit history." },
  { key: "website.edit", label: "Edit website", detail: "Change the home page text, photo and announcement." },
] as const;

export type Permission = (typeof GRANTABLE_PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS = new Set<string>(GRANTABLE_PERMISSIONS.map((item) => item.key));

export type Role = "super_admin" | "administrator" | "teacher" | "student" | "hostel_staff";

export type Actor = {
  id: string;
  email: string;
  role: Role;
  accountStatus: "active" | "disabled" | "pending";
  fullName: string;
  permissions: string[];
  teacherId: string | null;
  teacherStatus: string | null;
  assignedClass: string | null;
  studentId: string | null;
  studentStatus: string | null;
  registrationNumber: string | null;
  hostelStaffId: string | null;
  hostelId: string | null;
  mfaEnabled: boolean;
};

export function isPresident(actor: Actor) {
  return actor.role === "super_admin" && actor.accountStatus === "active";
}

export function hasGrant(actor: Actor, permission: string) {
  return actor.role === "administrator" && actor.accountStatus === "active" && actor.permissions.includes(permission);
}

export function can(actor: Actor, permission: string) {
  return isPresident(actor) || hasGrant(actor, permission);
}

export function homeForRole(role: Role) {
  if (role === "student") return "/student";
  if (role === "teacher") return "/teacher";
  if (role === "hostel_staff") return "/hostel";
  return "/admin";
}
