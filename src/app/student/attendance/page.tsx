"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Attendance } from "@/lib/types";

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((data) => setAttendance(data.attendance || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <span className="text-[11px] font-mono text-slate-400">STUDENT ATTENDANCE LOG</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
            My Madrasa Attendance History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete records of all weekend Madrasa sessions you have attended.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mx-auto" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No attendance records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Session Date</th>
                  <th className="py-3.5 px-4">Session Name</th>
                  <th className="py-3.5 px-4">Check-In Time</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {new Date(rec.check_in_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#142B4A]">
                      {rec.session_name || "Madrasa Class"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(rec.check_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 capitalize">
                      {rec.check_in_method === "qr_scan" ? "QR Camera Scan" : "Manual (No-phone)"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.attendance_status} size="sm" />
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
