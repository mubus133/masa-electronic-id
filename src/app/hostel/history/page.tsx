"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, History, CheckCircle2, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HostelEntryLog } from "@/lib/types";

export default function HostelHistoryPage() {
  const [logs, setLogs] = useState<HostelEntryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hostel/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/hostel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Verification Portal
        </Link>
        <span className="text-[11px] font-mono text-slate-400">HOSTEL ENTRY AUDIT LOG</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <History className="h-5 w-5 text-[#0F766E]" />
            Hostel Entry & Verification Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Permanent, immutable record of all student entries, redeemed passes, and emergency exceptions.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No entries logged yet for this hostel station.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Verification Time</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Registration #</th>
                  <th className="py-3.5 px-4">Hostel</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Decision</th>
                  <th className="py-3.5 px-4">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {new Date(log.verification_time).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                      {log.student_name}
                      {log.exception_reason && (
                        <span className="block text-[10px] text-amber-700 italic font-normal">
                          {log.exception_reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {log.registration_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{log.hostel_name || "Assigned Hostel"}</td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {log.verification_method === "digital" ? "Digital Pass" : "Emergency Exception"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.entry_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{log.verified_by_name || "Hostel Staff"}</td>
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
