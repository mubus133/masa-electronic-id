"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IdCard,
  QrCode,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { ElectronicIdCard } from "@/components/student/ElectronicIdCard";
import type { Student, DailyAuthorization, Session } from "@/lib/types";

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [latestAuth, setLatestAuth] = useState<DailyAuthorization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (authData) => {
        if (!authData.authenticated || authData.actor.role !== "student") {
          router.push("/login");
          return;
        }

        const studentId = authData.actor.studentId;
        if (!studentId) {
          setError("No student profile linked to this account.");
          return;
        }

        // Fetch student details
        const [studentRes, authRes] = await Promise.all([
          fetch(`/api/students/${studentId}`).then((r) => r.json()),
          fetch(`/api/authorizations?studentId=${studentId}`).then((r) => r.json()),
        ]);

        if (studentRes.student) setStudent(studentRes.student);
        if (authRes.authorizations && authRes.authorizations.length > 0) {
          setLatestAuth(authRes.authorizations[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F766E]" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
        <h3 className="font-bold text-red-900">Student Profile Error</h3>
        <p className="text-xs text-red-700 mt-1">{error || "Could not load student profile."}</p>
        <Link href="/login" className="inline-block mt-4 text-xs font-bold text-[#0F766E] underline">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Welcome, {student.full_name}</h1>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Registration: <strong className="text-white">{student.registration_number}</strong> &bull; Hostel:{" "}
            {student.hostel_name || "Unassigned"}
          </p>
        </div>

        {/* Quick Action Button */}
        <Link
          href="/student/scan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-xs shadow-lg transition-colors shrink-0"
        >
          <QrCode className="h-4 w-4" />
          Scan Attendance QR
        </Link>
      </div>

      {/* Main Grid: Electronic ID + Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Permanent Electronic ID Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#142B4A] uppercase tracking-wider flex items-center gap-2">
              <IdCard className="h-4 w-4 text-[#0F766E]" />
              Permanent Electronic ID
            </h3>
            <Link href="/student/id" className="text-xs font-semibold text-[#0F766E] hover:underline">
              Fullscreen View &rarr;
            </Link>
          </div>
          <ElectronicIdCard student={student} latestAuth={latestAuth} />
        </div>

        {/* Right: Quick Portals & Action Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/student/scan"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#142B4A] group-hover:text-[#0F766E] transition-colors">
                  Scan Attendance QR
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan code displayed by your Madrasa teacher.
                </p>
              </div>
            </Link>

            <Link
              href="/student/attendance"
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#142B4A] group-hover:text-blue-700 transition-colors">
                  Attendance Records
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review verified attendance history.
                </p>
              </div>
            </Link>
          </div>

          {/* Operational Guidance Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#142B4A] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#0F766E]" />
              Hostel Entry Rules & Dead-Battery Protocol
            </h4>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-800 block mb-0.5">Returning to Your Hostel After Madrasa:</strong>
                Present your permanent digital ID to the hostel mistress. She will verify your live authorization directly on her computer screen. Screenshots are strictly rejected.
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <strong className="text-amber-900 block mb-0.5">Phone Battery Dead or Lost?</strong>
                Report immediately to your teacher. The teacher will verify your photograph and submit a manual check-in under the approved no-phone procedure. The hostel mistress will still find your live authorization on her portal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
