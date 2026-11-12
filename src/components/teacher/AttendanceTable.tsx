"use client";

import React, { useState } from "react";
import { Check, X, Clock, AlertTriangle, ShieldCheck, UserCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Attendance } from "@/lib/types";

interface AttendanceTableProps {
  attendanceList: Attendance[];
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onMarkLate: (id: string) => Promise<void>;
  isSessionCompleted?: boolean;
}

export function AttendanceTable({
  attendanceList,
  onConfirm,
  onReject,
  onMarkLate,
  isSessionCompleted,
}: AttendanceTableProps) {
  const [filter, setFilter] = useState<string>("all");
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = attendanceList.filter((a) => {
    if (filter === "all") return true;
    return a.attendance_status === filter;
  });

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await onConfirm(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkLate = async (id: string) => {
    setActionLoading(id);
    try {
      await onMarkLate(id);
    } finally {
      setActionLoading(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectionModalId || !rejectionReason.trim()) return;
    setActionLoading(rejectionModalId);
    try {
      await onReject(rejectionModalId, rejectionReason.trim());
      setRejectionModalId(null);
      setRejectionReason("");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header & Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-[#142B4A] flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#0F766E]" />
            Session Attendance Roster ({attendanceList.length})
          </h3>
          <p className="text-xs text-slate-500">
            QR scan creates a pending submission only. You must physically confirm student presence before completion.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["all", "pending", "present", "late", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-full font-medium transition-colors capitalize ${
                filter === st
                  ? "bg-[#142B4A] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st} (
              {st === "all"
                ? attendanceList.length
                : attendanceList.filter((x) => x.attendance_status === st).length}
              )
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Registration #</th>
              <th className="py-3 px-4">Time & Method</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Physical Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No attendance records found matching this filter.
                </td>
              </tr>
            ) : (
              filtered.map((record) => {
                const isLoading = actionLoading === record.id;
                const isPending = record.attendance_status === "pending";

                return (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {record.photograph_url ? (
                            <img
                              src={record.photograph_url}
                              alt={record.student_name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs">
                              {(record.student_name || "S").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{record.student_name}</div>
                          {record.manual_reason && (
                            <span className="text-[10px] text-amber-700 italic">
                              {record.manual_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reg No */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {record.registration_number}
                    </td>

                    {/* Check In info */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">
                        {new Date(record.check_in_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {record.check_in_method === "qr_scan" ? "QR Camera Scan" : "Manual Check-in"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={record.attendance_status} size="sm" />
                    </td>

                    {/* Verification Actions */}
                    <td className="py-3 px-4 text-right">
                      {!isSessionCompleted && (
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleConfirm(record.id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0F766E] hover:bg-[#0B5C55] text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
                              title="Physically verified and present"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Confirm
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleMarkLate(record.id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-medium text-xs transition-colors disabled:opacity-50"
                              title="Mark Late Attendance"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Late
                            </button>
                          )}

                          {(isPending || record.attendance_status === "present") && (
                            <button
                              onClick={() => {
                                setRejectionModalId(record.id);
                                setRejectionReason("");
                              }}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-xs transition-colors disabled:opacity-50"
                              title="Reject attendance"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          )}

                          {record.attendance_status === "rejected" && (
                            <button
                              onClick={() => handleConfirm(record.id)}
                              disabled={isLoading}
                              className="text-xs text-[#0F766E] hover:underline font-medium"
                            >
                              Undo Reject
                            </button>
                          )}
                        </div>
                      )}
                      {isSessionCompleted && (
                        <span className="text-[11px] text-slate-400 italic">Session Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-left">
            <h4 className="font-bold text-base text-[#142B4A] mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Reject Attendance Submission
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              State why this student is being rejected (e.g. absent from classroom, fraudulent QR scan).
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                disabled={!rejectionReason.trim()}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
