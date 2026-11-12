"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, QrCode, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Session } from "@/lib/types";

export default function TeacherSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>
        <span className="text-[11px] font-mono text-slate-400">MADRASA SESSION ROSTER</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#0F766E]" />
            All Madrasa Sessions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Open attendance, display live QR tokens, verify student presence, and complete sessions.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Session Date</th>
                  <th className="py-3.5 px-4">Session Name</th>
                  <th className="py-3.5 px-4">Class Group</th>
                  <th className="py-3.5 px-4">Attendance Submissions</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {s.weekday}, {s.session_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">{s.session_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{s.class_group || "Group A"}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{s.attendance_count || 0} students</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.session_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/teacher/sessions/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#0B5C55] text-white font-semibold text-xs shadow-sm transition-colors"
                      >
                        Open Control
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
