"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Session, Teacher } from "@/lib/types";

export default function TeacherDashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (authData) => {
        if (!authData.authenticated || (authData.actor.role !== "teacher" && authData.actor.role !== "super_admin")) {
          router.push("/login");
          return;
        }

        const teacherId = authData.actor.teacherId;
        const [teacherRes, sessionsRes] = await Promise.all([
          teacherId ? fetch(`/api/teachers/${teacherId}`).then((r) => r.json()) : { teacher: null },
          fetch("/api/sessions").then((r) => r.json()),
        ]);

        if (teacherRes.teacher) setTeacher(teacherRes.teacher);
        if (sessionsRes.sessions) setSessions(sessionsRes.sessions);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => s.session_status === "open" || s.session_status === "scheduled");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Teacher Welcome Header */}
      <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider">
            Teacher Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Ustazah Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Assigned Class: <strong className="text-white">{teacher?.assigned_class || "Group A"}</strong> &bull; Teacher Code:{" "}
            <strong className="text-[#14B8A6] font-mono">{teacher?.teacher_code || "T-101"}</strong>
          </p>
        </div>

        <Link
          href="/teacher/sessions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-xs shadow transition-colors shrink-0"
        >
          <QrCode className="h-4 w-4" />
          View All Sessions & QR
        </Link>
      </div>

      {/* Active Sessions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#142B4A] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#0F766E]" />
            Upcoming & Live Madrasa Sessions
          </h2>
          <span className="text-xs text-slate-500">{activeSessions.length} active sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {session.weekday}, {session.session_date}
                  </span>
                  <StatusBadge status={session.session_status} size="sm" />
                </div>

                <h3 className="font-bold text-lg text-[#142B4A] leading-tight">
                  {session.session_name}
                </h3>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>Class: <strong className="text-slate-800">{session.class_group || "All Classes"}</strong></p>
                  <p>
                    Hours: {new Date(session.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &ndash;{" "}
                    {new Date(session.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {session.attendance_count || 0} students checked in
                </span>
                <Link
                  href={`/teacher/sessions/${session.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold transition-colors"
                >
                  Manage Session
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
