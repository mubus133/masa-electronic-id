import { hashPassword, sha256 } from "@/lib/crypto";
import type { Db } from "@/lib/db";

function avatar(initial: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="54%" text-anchor="middle" font-family="Georgia, serif" font-size="140" fill="#F7F8FA">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function seedDemoIfEmpty(db: Db) {
  const existing = await db.query<{ count: number }>("select count(*)::int as count from users");
  if (Number(existing[0]?.count ?? 0) > 0) return;

  const passwordHash = await hashPassword("Imasa-Demo-2026");
  const people = [
    ["10000000-0000-4000-8000-000000000001", "president@imasa.demo", "president", "super_admin", "President Hauwa Bello"],
    ["10000000-0000-4000-8000-000000000002", "admin@imasa.demo", "registrar", "administrator", "Registrar Fatima Sani"],
    ["10000000-0000-4000-8000-000000000003", "teacher@imasa.demo", "teacher.aisha", "teacher", "Ustazah Aisha Danladi"],
    ["10000000-0000-4000-8000-000000000004", "hostel@imasa.demo", "hostel.amina", "hostel_staff", "Hostel Mistress Maryam Lawal"],
    ["10000000-0000-4000-8000-000000000005", "khadijah@imasa.demo", "khadijah", "student", "Khadijah Abdullahi"],
    ["10000000-0000-4000-8000-000000000006", "maryam@imasa.demo", "maryam", "student", "Maryam Ibrahim"],
    ["10000000-0000-4000-8000-000000000007", "aisha@imasa.demo", "aisha.student", "student", "Aisha Yusuf"],
    ["10000000-0000-4000-8000-000000000008", "hafsah@imasa.demo", "hafsah", "student", "Hafsah Umar"],
  ];

  for (const [id, email, username, role, fullName] of people) {
    await db.query(
      `insert into users (id, email, username, password_hash, role, account_status, full_name)
       values ($1, $2, $3, $4, $5, 'active', $6)`,
      [id, email, username, passwordHash, role, fullName],
    );
  }

  await db.query(
    `insert into hostels (id, hostel_name, hostel_location) values
      ('20000000-0000-4000-8000-000000000001', 'Amina House', 'North campus'),
      ('20000000-0000-4000-8000-000000000002', 'Fatimah House', 'South campus')`,
  );
  await db.query(
    `insert into teachers (id, user_id, full_name, teacher_code, assigned_class) values
      ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Ustazah Aisha Danladi', 'T-101', 'Group A')`,
  );
  await db.query(
    `insert into hostel_staff (id, user_id, hostel_id, full_name) values
      ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Hostel Mistress Maryam Lawal')`,
  );

  const students = [
    ["50000000-0000-4000-8000-000000000001", "10000000-0000-4000-8000-000000000005", "IMASA-DEMO-1001", "Khadijah Abdullahi", avatar("K", "#142B4A"), "20000000-0000-4000-8000-000000000001", "Group A", "active", null],
    ["50000000-0000-4000-8000-000000000002", "10000000-0000-4000-8000-000000000006", "IMASA-DEMO-1002", "Maryam Ibrahim", avatar("M", "#0F766E"), "20000000-0000-4000-8000-000000000001", "Group A", "active", null],
    ["50000000-0000-4000-8000-000000000003", "10000000-0000-4000-8000-000000000007", "IMASA-DEMO-1003", "Aisha Yusuf", avatar("A", "#7C5A2A"), "20000000-0000-4000-8000-000000000001", "Group A", "suspended", "Demo suspension — awaiting a reinstatement decision"],
    ["50000000-0000-4000-8000-000000000004", "10000000-0000-4000-8000-000000000008", "IMASA-DEMO-1004", "Hafsah Umar", avatar("H", "#142B4A"), "20000000-0000-4000-8000-000000000002", "Group B", "active", null],
  ];
  for (const row of students) {
    await db.query(
      `insert into students (
         id, user_id, registration_number, full_name, photograph_url, hostel_id, class_group, student_status, created_by, status_reason
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,'10000000-0000-4000-8000-000000000001',$9)`,
      row,
    );
  }

  const permissions = [
    "students.register",
    "students.edit",
    "teachers.manage",
    "hostels.manage",
    "sessions.manage",
    "attendance.view",
    "authorizations.view",
    "reports.view",
  ];
  for (const permission of permissions) {
    await db.query(
      `insert into administrator_permissions (user_id, permission) values ('10000000-0000-4000-8000-000000000002', $1)`,
      [permission],
    );
  }

  await db.query(
    `insert into sessions (
       id, session_name, session_date, weekday, starts_at, ends_at, timezone, class_group, session_status,
       attendance_opened_at, attendance_closed_at, completed_at, created_by
     ) values
      (
        '60000000-0000-4000-8000-000000000001', 'Revision circle', current_date, trim(to_char(current_date, 'Day')),
        now() - interval '5 hours', now() - interval '3 hours', 'Africa/Lagos', 'Group A', 'completed',
        now() - interval '5 hours', now() - interval '3 hours', now() - interval '3 hours',
        '10000000-0000-4000-8000-000000000003'
      ),
      (
        '60000000-0000-4000-8000-000000000002', 'Maghrib class', current_date, trim(to_char(current_date, 'Day')),
        now() - interval '20 minutes', now() + interval '2 hours', 'Africa/Lagos', 'Group A', 'open',
        now() - interval '20 minutes', null, null,
        '10000000-0000-4000-8000-000000000003'
      )`,
  );
  await db.query(
    `insert into session_teacher_assignments (session_id, teacher_id) values
      ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001'),
      ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001')`,
  );
  await db.query(
    `insert into attendance (
       id, student_id, session_id, check_in_at, check_in_method, attendance_status, sync_status,
       teacher_confirmed_by, teacher_confirmed_at, identity_confirmed, manual_reason
     ) values (
       '70000000-0000-4000-8000-000000000001',
       '50000000-0000-4000-8000-000000000001',
       '60000000-0000-4000-8000-000000000001',
       now() - interval '5 hours', 'manual', 'present', 'synced',
       '10000000-0000-4000-8000-000000000003', now() - interval '5 hours', true,
       'Demo record: phone battery was dead'
     )`,
  );
  await db.query(
    `insert into daily_authorizations (
       id, student_id, session_id, attendance_id, token_hash, issued_at, expires_at, authorization_status, hostel_id
     ) values (
       '80000000-0000-4000-8000-000000000001',
       '50000000-0000-4000-8000-000000000001',
       '60000000-0000-4000-8000-000000000001',
       '70000000-0000-4000-8000-000000000001',
       $1, now() - interval '3 hours', now() + interval '8 hours', 'active',
       '20000000-0000-4000-8000-000000000001'
     )`,
    [sha256(`demo-authorization-${crypto.randomUUID()}`)],
  );
  await db.query("update system_settings set demo_mode = true, policies_approved = false where id = 1");
  await db.query(
    `insert into audit_logs (
       actor_user_id, actor_role, action, affected_record_type, affected_record_id, reason, new_value, request_reference
     ) values (
       '10000000-0000-4000-8000-000000000001', 'super_admin', 'demo.seed', 'system', 'demo',
       'Demonstration records created for a local preview. These are not real IMASA records.',
       '{"demo":true}'::jsonb, '90000000-0000-4000-8000-000000000001'
     )`,
  );
}
