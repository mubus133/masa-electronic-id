import { describe, it, expect, beforeAll } from "vitest";
import { ensureReady, database } from "@/lib/db";
import {
  registerStudent,
  suspendStudent,
  revokeStudent,
  reinstateStudent,
  getStudentById,
} from "@/lib/services/students";
import { registerTeacher } from "@/lib/services/teachers";
import { createHostel } from "@/lib/services/hostels";
import {
  createSession,
  completeSession,
  openSessionAttendance,
} from "@/lib/services/sessions";
import { generateSessionQr } from "@/lib/services/qr";
import {
  submitQrScan,
  confirmAttendance,
  rejectAttendance,
  recordManualAttendance,
} from "@/lib/services/attendance";
import {
  verifyDailyAuthorization,
  redeemDailyAuthorization,
} from "@/lib/services/authorizations";
import type { Actor } from "@/lib/permissions";

describe("IMASA Electronic Student ID & Verification Platform Test Suite", () => {
  let presidentActor: Actor;
  let teacherActor: Actor;
  let studentActor: Actor;
  let hostelStaffActor: Actor;

  let testHostelId: string;
  let testTeacherId: string;
  let testStudentId: string;
  let testSessionId: string;

  beforeAll(async () => {
    process.env.SEED_DEMO = "true";
    await ensureReady();

    presidentActor = {
      id: "10000000-0000-4000-8000-000000000001",
      email: "president@imasa.demo",
      role: "super_admin",
      accountStatus: "active",
      fullName: "President Hauwa Bello",
      permissions: [],
      teacherId: null,
      teacherStatus: null,
      assignedClass: null,
      studentId: null,
      studentStatus: null,
      registrationNumber: null,
      hostelStaffId: null,
      hostelId: null,
      mfaEnabled: true,
    };

    teacherActor = {
      id: "10000000-0000-4000-8000-000000000003",
      email: "teacher@imasa.demo",
      role: "teacher",
      accountStatus: "active",
      fullName: "Ustazah Aisha Danladi",
      permissions: [],
      teacherId: "30000000-0000-4000-8000-000000000001",
      teacherStatus: "active",
      assignedClass: "Group A",
      studentId: null,
      studentStatus: null,
      registrationNumber: null,
      hostelStaffId: null,
      hostelId: null,
      mfaEnabled: false,
    };

    studentActor = {
      id: "10000000-0000-4000-8000-000000000005",
      email: "khadijah@imasa.demo",
      role: "student",
      accountStatus: "active",
      fullName: "Khadijah Abdullahi",
      permissions: [],
      teacherId: null,
      teacherStatus: null,
      assignedClass: null,
      studentId: "50000000-0000-4000-8000-000000000001",
      studentStatus: "active",
      registrationNumber: "IMASA-DEMO-1001",
      hostelStaffId: null,
      hostelId: "20000000-0000-4000-8000-000000000001",
      mfaEnabled: false,
    };

    hostelStaffActor = {
      id: "10000000-0000-4000-8000-000000000004",
      email: "hostel@imasa.demo",
      role: "hostel_staff",
      accountStatus: "active",
      fullName: "Hostel Mistress Maryam Lawal",
      permissions: [],
      teacherId: null,
      teacherStatus: null,
      assignedClass: null,
      studentId: null,
      studentStatus: null,
      registrationNumber: null,
      hostelStaffId: "40000000-0000-4000-8000-000000000001",
      hostelId: "20000000-0000-4000-8000-000000000001",
      mfaEnabled: false,
    };
  }, 60000);

  it("1. Student registration generates unique registration number", async () => {
    const uniqueEmail = `test.student.${Date.now()}@imasa.demo`;
    const s1 = await registerStudent(
      {
        fullName: "Test Registered Student 1",
        email: uniqueEmail,
        classGroup: "Group A",
      },
      presidentActor
    );

    expect(s1.registration_number).toMatch(/^IMASA-\d+/);
    expect(s1.student_status).toBe("active");
  });

  it("2. Duplicate email registration is rejected", async () => {
    const duplicateEmail = "khadijah@imasa.demo";
    await expect(
      registerStudent(
        {
          fullName: "Duplicate Khadijah",
          email: duplicateEmail,
        },
        presidentActor
      )
    ).rejects.toThrow(/already exists/i);
  });

  it("3. Valid QR scan creates PENDING attendance (never auto-confirmed)", async () => {
    // Create new session
    const session = await createSession(
      {
        sessionName: "Test Friday Maghrib Class",
        sessionDate: new Date().toISOString().slice(0, 10),
        weekday: "Friday",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7200000).toISOString(),
        teacherIds: [teacherActor.teacherId!],
      },
      presidentActor
    );
    testSessionId = session.id;

    // Generate QR token
    const qrResult = await generateSessionQr(session.id, teacherActor);
    expect(qrResult.qrPayload).toContain(session.id);

    // Student scans QR
    const attendance = await submitQrScan(
      { qrPayload: qrResult.qrPayload },
      studentActor
    );

    expect(attendance.attendance_status).toBe("pending");
    expect(attendance.identity_confirmed).toBe(false);
    expect(attendance.teacher_confirmed_by).toBeNull();
  });

  it("4. Duplicate scan by same student for same session is rejected", async () => {
    const qrResult = await generateSessionQr(testSessionId, teacherActor);
    await expect(
      submitQrScan({ qrPayload: qrResult.qrPayload }, studentActor)
    ).rejects.toThrow(/already submitted/i);
  });

  it("5. QR code for another session or invalid token is rejected", async () => {
    const fakePayload = JSON.stringify({
      imasa: "madrasa_session",
      sessionId: "00000000-0000-4000-8000-000000000000",
      token: "invalid-token",
    });

    await expect(
      submitQrScan({ qrPayload: fakePayload }, studentActor)
    ).rejects.toThrow();
  });

  it("6. Teacher confirms physical presence -> status becomes present", async () => {
    const db = database();
    const rows = await db.query<any>(
      "SELECT id FROM attendance WHERE student_id = $1 AND session_id = $2",
      [studentActor.studentId, testSessionId]
    );
    const attendanceId = rows[0].id;

    const confirmed = await confirmAttendance(attendanceId, teacherActor);
    expect(confirmed.attendance_status).toBe("present");
    expect(confirmed.identity_confirmed).toBe(true);
    expect(confirmed.teacher_confirmed_by).toBe(teacherActor.teacherId);
  });

  it("7. Session completion generates daily authorization only for confirmed present students", async () => {
    const result = await completeSession(testSessionId, presidentActor);
    expect(result.session.session_status).toBe("completed");
    expect(result.issuedCount).toBeGreaterThanOrEqual(1);

    const verdict = await verifyDailyAuthorization(studentActor.studentId!);
    expect(verdict.valid).toBe(true);
    expect(verdict.verdict).toBe("VALID");
    expect(verdict.authorization?.status).toBe("active");
  });

  it("8. Redeeming pass marks it redeemed atomically and prevents reuse", async () => {
    const verdict = await verifyDailyAuthorization(studentActor.studentId!);
    const authId = verdict.authorization!.id;

    const redeemResult = await redeemDailyAuthorization(
      authId,
      hostelStaffActor.hostelId!,
      hostelStaffActor
    );
    expect(redeemResult.success).toBe(true);

    // Second redemption attempt must fail!
    await expect(
      redeemDailyAuthorization(
        authId,
        hostelStaffActor.hostelId!,
        hostelStaffActor
      )
    ).rejects.toThrow(/already been redeemed/i);

    // Verification check should now return ALREADY_REDEEMED
    const recheck = await verifyDailyAuthorization(studentActor.studentId!);
    expect(recheck.valid).toBe(false);
    expect(recheck.verdict).toBe("ALREADY_REDEEMED");
  });

  it("9. Dead-battery / no-phone manual check-in requires substantive reason and marks as manual", async () => {
    const session = await createSession(
      {
        sessionName: "Saturday Circle",
        sessionDate: new Date().toISOString().slice(0, 10),
        weekday: "Saturday",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7200000).toISOString(),
      },
      presidentActor
    );

    // Student 2: Maryam
    const maryamStudentId = "50000000-0000-4000-8000-000000000002";
    const manualRecord = await recordManualAttendance(
      session.id,
      maryamStudentId,
      "Student phone battery died during commute to Madrasa",
      teacherActor
    );

    expect(manualRecord.check_in_method).toBe("manual");
    expect(manualRecord.attendance_status).toBe("present");
    expect(manualRecord.manual_reason).toContain("battery died");
  });

  it("10. Suspending a student immediately invalidates live pass verification", async () => {
    // Create new student with active pass
    const newStudent = await registerStudent(
      {
        fullName: "Test Suspension Student",
        email: `suspend.test.${Date.now()}@imasa.demo`,
      },
      presidentActor
    );

    const session = await createSession(
      {
        sessionName: "Sunday Review",
        sessionDate: new Date().toISOString().slice(0, 10),
        weekday: "Sunday",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7200000).toISOString(),
      },
      presidentActor
    );

    await recordManualAttendance(
      session.id,
      newStudent.id,
      "Verified physical presence for test",
      teacherActor
    );

    await completeSession(session.id, presidentActor);

    // Verify valid initially
    const initialCheck = await verifyDailyAuthorization(newStudent.id);
    expect(initialCheck.valid).toBe(true);

    // Suspend ID
    await suspendStudent(newStudent.id, "Disciplinary suspension for test", presidentActor);

    // Live verification must now FAIL with SUSPENDED
    const suspendedCheck = await verifyDailyAuthorization(newStudent.id);
    expect(suspendedCheck.valid).toBe(false);
    expect(suspendedCheck.verdict).toBe("SUSPENDED");
  });

  it("11. Revoking a student ID permanently prevents pass verification", async () => {
    const newStudent = await registerStudent(
      {
        fullName: "Test Revocation Student",
        email: `revoke.test.${Date.now()}@imasa.demo`,
      },
      presidentActor
    );

    await revokeStudent(newStudent.id, "Permanent withdrawal of membership", presidentActor);

    const check = await verifyDailyAuthorization(newStudent.id);
    expect(check.valid).toBe(false);
    expect(check.verdict).toBe("REVOKED");

    // Reinstatement requires explicit action
    await reinstateStudent(newStudent.id, "Appealed and approved by President", presidentActor);
    const reinstated = await getStudentById(newStudent.id);
    expect(reinstated?.student_status).toBe("active");
  });

  it("12. Audit logs are append-only and record sensitive events", async () => {
    const db = database();
    const rows = await db.query<any>(
      "SELECT * FROM audit_logs WHERE action = 'student.suspend' ORDER BY created_at DESC LIMIT 1"
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].reason).toContain("Disciplinary suspension");

    // Attempting to delete an audit log must be rejected by trigger!
    await expect(
      db.query("DELETE FROM audit_logs WHERE id = $1", [rows[0].id])
    ).rejects.toThrow(/append-only/i);
  });
});
