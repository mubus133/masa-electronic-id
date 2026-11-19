import type { Permission, Role } from "./permissions";

export type { Permission, Role };

export type AccountStatus = "active" | "disabled" | "pending";
export type StudentStatus = "active" | "suspended" | "revoked" | "graduated" | "inactive";
export type TeacherStatus = "active" | "inactive";
export type HostelStatus = "active" | "inactive";
export type SessionStatus = "scheduled" | "open" | "closed" | "completed" | "cancelled";
export type AttendanceStatus = "pending" | "present" | "late" | "rejected" | "absent" | "excused";
export type CheckInMethod = "qr" | "manual" | "offline";
export type AuthorizationStatus = "active" | "expired" | "revoked" | "redeemed";
export type EntryStatus = "admitted" | "denied" | "exception";
export type EntryMethod = "live_portal" | "emergency_exception";

export interface User {
  id: string;
  email: string;
  username: string | null;
  password_hash?: string;
  auth_provider: "local" | "supabase";
  role: Role;
  account_status: AccountStatus;
  full_name: string;
  mfa_enabled: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface Student {
  id: string;
  user_id: string;
  registration_number: string;
  full_name: string;
  photograph_url: string | null;
  hostel_id: string | null;
  hostel_name?: string;
  email?: string;
  class_group: string | null;
  phone: string | null;
  emergency_contact: string | null;
  student_status: StudentStatus;
  date_registered: string;
  created_by: string | null;
  updated_at: string;
  status_reason: string | null;
}

export interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  teacher_code: string;
  assigned_class: string | null;
  account_status: TeacherStatus;
  created_at: string;
}

export interface Hostel {
  id: string;
  hostel_name: string;
  hostel_location: string | null;
  hostel_status: HostelStatus;
  created_at: string;
  active_student_count?: number;
}

export interface HostelStaff {
  id: string;
  user_id: string;
  hostel_id: string;
  hostel_name?: string;
  full_name: string;
  staff_status: "active" | "inactive";
  created_at: string;
}

export interface AdministratorPermission {
  id: string;
  user_id: string;
  permission: Permission;
  granted_by: string;
  granted_at: string;
}

export interface Session {
  id: string;
  session_name: string;
  session_date: string;
  weekday: "Friday" | "Saturday" | "Sunday";
  starts_at: string;
  ends_at: string;
  timezone: string;
  class_group: string | null;
  session_status: SessionStatus;
  attendance_opened_at: string | null;
  attendance_closed_at: string | null;
  completed_at: string | null;
  completed_by?: string | null;
  created_by: string | null;
  created_at: string;
  teachers?: Teacher[];
  attendance_count?: number;
}

export interface QrToken {
  id: string;
  session_id: string;
  token_hash: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
  token_status: "active" | "expired" | "revoked";
}

export interface Attendance {
  id: string;
  student_id: string;
  session_id: string;
  check_in_at: string;
  check_in_method: CheckInMethod;
  attendance_status: AttendanceStatus;
  sync_status: "synced" | "awaiting_sync";
  teacher_confirmed_by: string | null;
  teacher_confirmed_at: string | null;
  identity_confirmed: boolean;
  rejection_reason: string | null;
  manual_reason: string | null;
  teacher_name?: string | null;
  created_at: string;
  student_name?: string;
  registration_number?: string;
  photograph_url?: string | null;
  session_name?: string;
}

export interface DailyAuthorization {
  id: string;
  student_id: string;
  session_id: string;
  attendance_id: string;
  authorization_token?: string;
  token_hash: string;
  issued_at: string;
  expires_at: string;
  authorization_status: AuthorizationStatus;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  used_at: string | null;
  hostel_id: string | null;
  created_at: string;
  student?: Student;
  session?: Session;
  hostel_name?: string;
  session_name?: string;
  session_date?: string;
  teacher_name?: string;
}

export interface HostelEntryLog {
  id: string;
  student_id: string;
  authorization_id: string | null;
  hostel_id: string;
  verified_by: string;
  verification_time: string;
  entry_status: EntryStatus;
  verification_method: EntryMethod;
  exception_reason: string | null;
  exception_approved_by: string | null;
  student_name?: string;
  registration_number?: string;
  hostel_name?: string;
  verified_by_name?: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_role: string;
  action: string;
  affected_record_type: string | null;
  affected_record_id: string | null;
  reason: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  request_reference: string;
  actor_name?: string;
}

export interface SystemSettings {
  id: number;
  timezone: string;
  qr_ttl_seconds: number;
  pass_expiry_mode: "end_of_day" | "hours_after_completion";
  pass_expiry_hours: number;
  one_time_entry: boolean;
  late_attendance_allowed: boolean;
  late_cutoff_minutes: number;
  late_receives_pass: boolean;
  excused_receives_pass: boolean;
  attendance_open_minutes_before: number;
  require_hostel_assignment: boolean;
  emergency_exceptions_enabled: boolean;
  mfa_required_privileged: boolean;
  demo_mode: boolean;
  policies_approved: boolean;
  updated_at: string;
}

export interface VerificationResult {
  valid: boolean;
  verdict: "VALID" | "INVALID" | "EXPIRED" | "REVOKED" | "SUSPENDED" | "ALREADY_REDEEMED" | "PENDING";
  headline: string;
  reason: string;
  student: {
    id: string;
    fullName: string;
    registrationNumber: string;
    photographUrl: string | null;
    status: StudentStatus;
    hostelId: string | null;
    hostelName: string | null;
    classGroup: string | null;
  };
  authorization?: {
    id: string;
    status: AuthorizationStatus;
    issuedAt: string;
    expiresAt: string;
    usedAt: string | null;
    sessionName: string;
    sessionDate: string;
    teacherName: string;
    attendanceStatus: AttendanceStatus;
  } | null;
}

export interface SupportRequest {
  id: string;
  user_id: string | null;
  category: "technical" | "dispute" | "account" | "other";
  subject: string;
  message: string;
  status: "open" | "reviewed" | "closed";
  resolution: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}
