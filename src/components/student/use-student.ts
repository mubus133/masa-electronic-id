"use client";

import { useSession } from "@/components/shell/session";
import { useResource } from "@/lib/client";
import type { Attendance, DailyAuthorization, Student } from "@/lib/types";

export const useStudentRecord = () => {
  const { actor, timezone } = useSession();
  const student = useResource<{ student: Student }>(actor.studentId ? `/api/students/${actor.studentId}` : null);
  return { actor, timezone, ...student, student: student.data?.student ?? null };
};

export const usePasses = () => useResource<{ authorizations: DailyAuthorization[] }>("/api/authorizations");
export const useAttendance = () => useResource<{ attendance: Attendance[] }>("/api/attendance");
