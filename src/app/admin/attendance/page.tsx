"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, Search, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Attendance } from "@/lib/types";

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then((res) => res.json())
      .then((data) => setAttendance(data.attendance || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <span className="text-[11px] font-mono text-slate-400">ORGANIZATION-WIDE ATTENDANCE AUDIT</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#0F766E]" />
              Attendance Master Records ({attendance.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live audit trail of all student check-ins, verification timestamps, and methods.
            </p>
          </div>

          <a
            href="/api/admin/export?type=attendance"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Download className="h-4 w-4" />
            Download CSV Report
          </a>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0F766E] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Registration #</th>
                  <th className="py-3 px-4">Madrasa Session</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">{rec.student_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0F766E]">{rec.registration_number}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{rec.session_name}</div>
                      <span className="text-[10px] text-slate-400">{(rec as any).session_date}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {new Date(rec.check_in_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {rec.check_in_method === "qr_scan" ? "QR Camera Scan" : "Manual No-Phone"}
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
