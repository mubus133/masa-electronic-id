"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  QrCode,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { QrDisplay } from "@/components/teacher/QrDisplay";
import { AttendanceTable } from "@/components/teacher/AttendanceTable";
import { ManualAttendanceModal } from "@/components/teacher/ManualAttendanceModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Session, Attendance } from "@/lib/types";

export default function SessionControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/sessions/${id}`).then((r) => r.json()),
        fetch(`/api/attendance?sessionId=${id}`).then((r) => r.json()),
      ]);

      if (sRes.session) setSession(sRes.session);
      if (aRes.attendance) setAttendance(aRes.attendance);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load session data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling attendance every 10s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleConfirmAttendance = async (attendanceId: string) => {
    const res = await fetch(`/api/attendance/${attendanceId}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Confirmation failed.");
    loadData();
  };

  const handleRejectAttendance = async (attendanceId: string, reason: string) => {
    const res = await fetch(`/api/attendance/${attendanceId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Rejection failed.");
    loadData();
  };

  const handleMarkLate = async (attendanceId: string) => {
    const res = await fetch(`/api/attendance/${attendanceId}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to mark late.");
    loadData();
  };

  const handleCompleteSession = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to formally complete this Madrasa session? This action closes attendance and automatically generates daily hostel entry authorizations for all verified students."
    );
    if (!confirmed) return;

    setCompleting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sessions/${id}/complete`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete session.");

      setCompletionSuccess(data.message || "Session completed successfully!");
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete session.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Session not found.</p>
        <Link href="/teacher/sessions" className="text-xs text-[#0F766E] font-semibold underline mt-2 inline-block">
          Return to Sessions
        </Link>
      </div>
    );
  }

  const isCompleted = session.session_status === "completed";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/teacher/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions List
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Session Status:</span>
          <StatusBadge status={session.session_status} size="sm" />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {completionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{completionSuccess}</span>
        </div>
      )}

      {/* Session Action Header */}
      <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider">
            {session.weekday}, {session.session_date} &bull; {session.class_group || "Group A"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">{session.session_name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Scheduled: {new Date(session.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &ndash;{" "}
            {new Date(session.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {!isCompleted && (
            <button
              onClick={() => setManualModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs border border-slate-600 transition-colors"
            >
              <BatteryCharging className="h-4 w-4 text-[#C8A45D]" />
              Dead-Battery / Manual Check-In
            </button>
          )}

          {!isCompleted && (
            <button
              onClick={handleCompleteSession}
              disabled={completing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-xs shadow-lg transition-colors disabled:opacity-50"
            >
              {completing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Complete Session & Issue Passes
            </button>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Session Completed & Passes Issued
            </span>
          )}
        </div>
      </div>

      {/* Main Layout: Left QR Display (if open), Right Attendance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {!isCompleted && (
          <div className="lg:col-span-5 space-y-4">
            <QrDisplay session={session} onRefreshAttendance={loadData} />
          </div>
        )}

        <div className={isCompleted ? "lg:col-span-12" : "lg:col-span-7"}>
          <AttendanceTable
            attendanceList={attendance}
            onConfirm={handleConfirmAttendance}
            onReject={handleRejectAttendance}
            onMarkLate={handleMarkLate}
            isSessionCompleted={isCompleted}
          />
        </div>
      </div>

      {/* Dead-Battery Manual Attendance Modal */}
      <ManualAttendanceModal
        sessionId={session.id}
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSuccess={() => {
          loadData();
          setCompletionSuccess("Manual attendance recorded under dead-battery/no-phone procedure.");
        }}
      />
    </div>
  );
}
