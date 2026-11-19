-- IMASA electronic ID, attendance, and hostel authorization schema.
-- Safe to run more than once. Service-role connections used by the Next.js
-- server bypass row level security; policies below protect direct client access.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  password_hash text,
  auth_provider text NOT NULL DEFAULT 'local' CHECK (auth_provider IN ('local', 'supabase')),
  role text NOT NULL CHECK (role IN ('super_admin', 'administrator', 'teacher', 'student', 'hostel_staff')),
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'disabled', 'pending')),
  full_name text NOT NULL,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_secret text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE IF NOT EXISTS hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_name text NOT NULL UNIQUE,
  hostel_location text,
  hostel_status text NOT NULL DEFAULT 'active' CHECK (hostel_status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id),
  registration_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  photograph_url text,
  hostel_id uuid REFERENCES hostels (id),
  class_group text,
  phone text,
  emergency_contact text,
  student_status text NOT NULL DEFAULT 'active' CHECK (student_status IN ('active', 'suspended', 'revoked', 'graduated', 'inactive')),
  date_registered date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES users (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status_reason text
);

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id),
  full_name text NOT NULL,
  teacher_code text NOT NULL UNIQUE,
  assigned_class text,
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hostel_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users (id),
  hostel_id uuid NOT NULL REFERENCES hostels (id),
  full_name text NOT NULL,
  staff_status text NOT NULL DEFAULT 'active' CHECK (staff_status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS administrator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  permission text NOT NULL,
  granted_by uuid REFERENCES users (id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

ALTER TABLE administrator_permissions ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES users (id);
ALTER TABLE administrator_permissions ADD COLUMN IF NOT EXISTS granted_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL,
  session_date date NOT NULL,
  weekday text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL,
  class_group text,
  session_status text NOT NULL DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'open', 'closed', 'completed', 'cancelled')),
  attendance_opened_at timestamptz,
  attendance_closed_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS session_teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions (id),
  teacher_id uuid NOT NULL REFERENCES teachers (id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions (id),
  token_hash text NOT NULL UNIQUE,
  issued_by uuid NOT NULL REFERENCES users (id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  token_status text NOT NULL DEFAULT 'active' CHECK (token_status IN ('active', 'expired', 'revoked'))
);

-- Short typed code shown next to the QR, for phones whose camera won't scan.
ALTER TABLE qr_tokens ADD COLUMN IF NOT EXISTS code_hash text;
CREATE INDEX IF NOT EXISTS qr_code_hash_idx ON qr_tokens (code_hash) WHERE token_status = 'active';

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id),
  session_id uuid NOT NULL REFERENCES sessions (id),
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_in_method text NOT NULL CHECK (check_in_method IN ('qr', 'manual', 'offline')),
  attendance_status text NOT NULL CHECK (attendance_status IN ('pending', 'present', 'late', 'rejected', 'absent', 'excused')),
  sync_status text NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'awaiting_sync')),
  teacher_confirmed_by uuid REFERENCES users (id),
  teacher_confirmed_at timestamptz,
  rejection_reason text,
  manual_reason text,
  identity_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, session_id)
);

CREATE TABLE IF NOT EXISTS daily_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id),
  session_id uuid NOT NULL REFERENCES sessions (id),
  attendance_id uuid NOT NULL REFERENCES attendance (id),
  token_hash text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  authorization_status text NOT NULL CHECK (authorization_status IN ('active', 'expired', 'revoked', 'redeemed')),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users (id),
  revoke_reason text,
  used_at timestamptz,
  hostel_id uuid REFERENCES hostels (id),
  UNIQUE (student_id, session_id)
);

CREATE TABLE IF NOT EXISTS hostel_entry_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students (id),
  authorization_id uuid REFERENCES daily_authorizations (id),
  hostel_id uuid NOT NULL REFERENCES hostels (id),
  verified_by uuid NOT NULL REFERENCES users (id),
  verification_time timestamptz NOT NULL DEFAULT now(),
  entry_status text NOT NULL CHECK (entry_status IN ('admitted', 'denied', 'exception')),
  verification_method text NOT NULL CHECK (verification_method IN ('live_portal', 'emergency_exception')),
  exception_reason text,
  exception_approved_by text
);

ALTER TABLE hostel_entry_logs ADD COLUMN IF NOT EXISTS exception_approved_by text;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users (id),
  actor_role text,
  action text NOT NULL,
  affected_record_type text NOT NULL,
  affected_record_id text,
  reason text,
  previous_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  request_reference uuid NOT NULL
);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address text;

CREATE TABLE IF NOT EXISTS system_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  timezone text NOT NULL,
  qr_ttl_seconds integer NOT NULL,
  pass_expiry_mode text NOT NULL CHECK (pass_expiry_mode IN ('end_of_day', 'hours_after_completion')),
  pass_expiry_hours integer NOT NULL,
  one_time_entry boolean NOT NULL,
  late_attendance_allowed boolean NOT NULL,
  late_cutoff_minutes integer NOT NULL,
  late_receives_pass boolean NOT NULL,
  excused_receives_pass boolean NOT NULL,
  attendance_open_minutes_before integer NOT NULL,
  require_hostel_assignment boolean NOT NULL,
  emergency_exceptions_enabled boolean NOT NULL,
  mfa_required_privileged boolean NOT NULL,
  demo_mode boolean NOT NULL DEFAULT false,
  policies_approved boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id),
  category text NOT NULL CHECK (category IN ('technical', 'dispute', 'account', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'closed')),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Editable public website text and images (home page hero, announcement).
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES users (id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Server-generated keys, e.g. the cookie signing key when SESSION_SECRET isn't set.
CREATE TABLE IF NOT EXISTS app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS registration_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS teacher_code_seq START 101;

CREATE INDEX IF NOT EXISTS students_name_idx ON students (full_name);
CREATE INDEX IF NOT EXISTS students_hostel_idx ON students (hostel_id);
CREATE INDEX IF NOT EXISTS students_status_idx ON students (student_status);
CREATE INDEX IF NOT EXISTS sessions_date_idx ON sessions (session_date);
CREATE INDEX IF NOT EXISTS attendance_session_idx ON attendance (session_id);
CREATE INDEX IF NOT EXISTS attendance_student_idx ON attendance (student_id);
CREATE INDEX IF NOT EXISTS authorizations_student_idx ON daily_authorizations (student_id, authorization_status);
CREATE INDEX IF NOT EXISTS authorizations_expiry_idx ON daily_authorizations (expires_at);
CREATE INDEX IF NOT EXISTS qr_session_idx ON qr_tokens (session_id, token_status);
CREATE INDEX IF NOT EXISTS entry_hostel_idx ON hostel_entry_logs (hostel_id, verification_time);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION imasa_reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION imasa_reject_audit_mutation();

INSERT INTO system_settings (
  id, timezone, qr_ttl_seconds, pass_expiry_mode, pass_expiry_hours, one_time_entry,
  late_attendance_allowed, late_cutoff_minutes, late_receives_pass, excused_receives_pass,
  attendance_open_minutes_before, require_hostel_assignment, emergency_exceptions_enabled,
  mfa_required_privileged, demo_mode, policies_approved
) VALUES (
  1, 'Africa/Lagos', 120, 'end_of_day', 6, true,
  true, 20, true, false,
  30, true, true,
  false, false, false
) ON CONFLICT (id) DO NOTHING;

-- Row level security for Supabase is in 002_rls.sql.
-- It is not applied to the local PGlite demo database because it depends on
-- Supabase's auth.jwt() helper. The Next.js server enforces authorization
-- before every query regardless.
