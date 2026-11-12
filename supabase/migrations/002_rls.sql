-- Apply this file on Supabase (or any Postgres database that provides auth.jwt()).
-- The local demo database does not run this migration.
--
-- Service-role and table-owner connections bypass these policies. The Next.js
-- server is that privileged connection and must keep enforcing permissions.
-- The anon key has no policies, so the public API cannot read student data.
-- The authenticated role can read only the signed-in user's own rows.
-- Attendance, QR tokens, authorizations, audit logs, and passwords have no
-- client write policies.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrator_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_entry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;
ALTER TABLE teachers FORCE ROW LEVEL SECURITY;
ALTER TABLE hostels FORCE ROW LEVEL SECURITY;
ALTER TABLE hostel_staff FORCE ROW LEVEL SECURITY;
ALTER TABLE administrator_permissions FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE session_teacher_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE attendance FORCE ROW LEVEL SECURITY;
ALTER TABLE daily_authorizations FORCE ROW LEVEL SECURITY;
ALTER TABLE hostel_entry_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE system_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE support_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_self ON users;
CREATE POLICY users_select_self ON users FOR SELECT TO authenticated
  USING (id::text = coalesce(auth.jwt() ->> 'sub', ''));

DROP POLICY IF EXISTS students_select_self ON students;
CREATE POLICY students_select_self ON students FOR SELECT TO authenticated
  USING (user_id::text = coalesce(auth.jwt() ->> 'sub', ''));

DROP POLICY IF EXISTS notifications_select_self ON notifications;
CREATE POLICY notifications_select_self ON notifications FOR SELECT TO authenticated
  USING (user_id::text = coalesce(auth.jwt() ->> 'sub', ''));

DROP POLICY IF EXISTS support_insert_self ON support_requests;
CREATE POLICY support_insert_self ON support_requests FOR INSERT TO authenticated
  WITH CHECK (user_id::text = coalesce(auth.jwt() ->> 'sub', ''));

DROP POLICY IF EXISTS support_select_self ON support_requests;
CREATE POLICY support_select_self ON support_requests FOR SELECT TO authenticated
  USING (user_id::text = coalesce(auth.jwt() ->> 'sub', ''));
