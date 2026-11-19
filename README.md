# IMASA Electronic ID

Electronic student IDs, Madrasa attendance and hostel passes for IMASA, built from the
*Electronic Student ID & Attendance Verification Blueprint* (v1.0).

The core rule: a student's permanent ID shows who she is. Only teacher-confirmed attendance at a
**completed** session gives her a pass for that night, and hostel staff always check it live.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL` the app uses an embedded Postgres (PGlite)
stored in `.data/imasa` and fills it with demo data.

Demo accounts (password `Imasa-Demo-2026`), also listed on the sign-in page in development:

| Role | Email |
| --- | --- |
| President | president@imasa.demo |
| Administrator | admin@imasa.demo |
| Teacher | teacher@imasa.demo |
| Hostel staff | hostel@imasa.demo |
| Student | khadijah@imasa.demo |
| Suspended student | aisha@imasa.demo |

```bash
npm test
```

## Production

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (e.g. Supabase). Migrations in `supabase/migrations` run on start. |
| `SESSION_SECRET` | Optional. Key for signing sign-in cookies. If unset, the server generates one on first start and stores it in the database. |
| `SEED_DEMO` | Leave unset (or `false`) in production so no demo accounts are created. |
| `PRESIDENT_EMAIL`, `PRESIDENT_PASSWORD`, `PRESIDENT_NAME` | Creates the President's account on first start, only when the database has no users. Password at least 12 characters. Remove these variables once the account exists. |

Apply `supabase/migrations/002_rls.sql` in Supabase for row-level security on direct client access.

## Portals

- **Students**: ID, check-in (camera scan or typed 8-character code), attendance, passes, report a problem.
- **Teachers**: open check-in, show the rotating code full screen, confirm/late/reject, check in a student
  by hand (no phone), complete the session to issue passes.
- **Hostel staff**: search their own hostel's students, see the live verdict with photo, admit, record a
  denial or an emergency entry.
- **Administration**: students (register, edit, suspend, revoke, reinstate, reset password), teachers,
  hostels and staff, sessions, attendance, passes, reports and CSV exports, support requests, audit log,
  administrators and their permissions (President only), settings, and the public website.

## Changing the home page

Sign in as the President (or an administrator with **Edit website**), open **Administration → Website**,
upload the class photo and edit the headline, introduction and an optional announcement strip.

## Still to decide

Section 18 of the blueprint lists policy decisions for IMASA management (pass expiry, late attendance,
one-time entry, emergency entry, retention). They are configurable under **Settings**; the overview shows a
reminder until they are marked approved. Not built yet: MFA for privileged accounts, the offline check-in
procedure, and self-service password reset by email (resets are done by an administrator).
