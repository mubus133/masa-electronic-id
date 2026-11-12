"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";
import type { VerificationResult } from "@/lib/types";

interface VerificationDisplayProps {
  result: VerificationResult;
  onBack: () => void;
  onEntryConfirmed: () => void;
}

export function VerificationDisplay({
  result,
  onBack,
  onEntryConfirmed,
}: VerificationDisplayProps) {
  const [submitting, setSubmitting] = useState(false);
  const [redeemed, setRedeemed] = useState(result.verdict === "ALREADY_REDEEMED");
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionStatus, setExceptionStatus] = useState<"approved" | "denied">("approved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { valid, verdict, headline, reason, student, authorization } = result;

  const handleConfirmEntry = async () => {
    if (!authorization?.id) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/authorizations/${authorization.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelId: student.hostelId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm hostel entry.");

      setRedeemed(true);
      onEntryConfirmed();
    } catch (err: any) {
      setErrorMessage(err.message || "Entry confirmation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogException = async () => {
    if (!exceptionReason.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/hostel/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          hostelId: student.hostelId,
          reason: exceptionReason.trim(),
          entryStatus: exceptionStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log exception.");

      setExceptionModalOpen(false);
      onEntryConfirmed();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log exception entry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Determine Banner Colors
  let bannerBg = "bg-emerald-600 text-white";
  let bannerIcon = <CheckCircle2 className="h-8 w-8" />;
  let bannerTitle = "VALID DAILY AUTHORIZATION";

  if (redeemed) {
    bannerBg = "bg-blue-600 text-white";
    bannerIcon = <CheckCircle2 className="h-8 w-8" />;
    bannerTitle = "PASS ALREADY REDEEMED / ENTERED";
  } else if (!valid) {
    if (verdict === "PENDING") {
      bannerBg = "bg-amber-500 text-white";
      bannerIcon = <Clock className="h-8 w-8" />;
      bannerTitle = "ATTENDANCE PENDING REVIEW";
    } else {
      bannerBg = "bg-red-600 text-white";
      bannerIcon = <XCircle className="h-8 w-8" />;
      bannerTitle = `${verdict} — ENTRY NOT AUTHORIZED`;
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Back button bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Search
        </button>
        <span className="text-[11px] font-mono text-slate-400">IMASA LIVE AUDIT VERIFICATION</span>
      </div>

      {/* Prominent Color Banner */}
      <div className={`${bannerBg} p-6 sm:p-8 text-center transition-colors shadow-inner`}>
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/20 mb-3">
          {bannerIcon}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-wide">{bannerTitle}</h1>
        <p className="text-sm font-medium mt-1 text-white/90 max-w-lg mx-auto">{headline}</p>
      </div>

      {/* Detail Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Reason Explanation */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          valid && !redeemed
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : !valid
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-blue-50 border-blue-200 text-blue-900"
        }`}>
          <strong>Server Verdict Details:</strong> {reason}
        </div>

        {/* Student Photograph & Identity Check */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="h-32 w-32 rounded-xl overflow-hidden bg-white border-2 border-slate-300 shadow shrink-0">
            {student.photographUrl ? (
              <img src={student.photographUrl} alt={student.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#142B4A] text-white flex items-center justify-center text-3xl font-bold">
                {student.fullName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Student Identity Check</p>
              <h2 className="text-xl font-bold text-[#142B4A]">{student.fullName}</h2>
              <p className="font-mono text-sm font-bold text-[#0F766E]">{student.registrationNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Hostel</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {student.hostelName || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Class Group</span>
                <span className="font-semibold text-slate-800">{student.classGroup || "Group A"}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Check photograph against the student standing before you.
            </p>
          </div>
        </div>

        {/* Madrasa Attendance Proof (if authorization exists) */}
        {authorization && (
          <div className="p-5 border border-slate-200 rounded-2xl space-y-3 bg-white">
            <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#0F766E]" />
              Madrasa Attendance Verification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">Session</span>
                <span className="font-bold text-slate-800">{authorization.sessionName}</span>
                <span className="text-[10px] text-slate-500 block">{authorization.sessionDate}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">Confirmed By</span>
                <span className="font-bold text-slate-800">{authorization.teacherName}</span>
                <span className="text-[10px] text-emerald-700 block font-semibold">&bull; Physical Presence</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">Curfew Expiration</span>
                <span className="font-bold text-slate-800">
                  {new Date(authorization.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[10px] text-slate-500 block">Tonight&apos;s Return Window</span>
              </div>
            </div>
          </div>
        )}

        {/* ONE-TIME ENTRY REDEMPTION ACTION */}
        <div className="space-y-3 pt-2">
          {valid && !redeemed && (
            <button
              onClick={handleConfirmEntry}
              disabled={submitting}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-6 w-6" />
              )}
              CONFIRM HOSTEL ENTRY (REDEEM PASS)
            </button>
          )}

          {redeemed && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-900 font-semibold">
              Hostel entry has been confirmed and logged. Pass is now marked as REDEEMED.
            </div>
          )}

          {/* Exception entry button for non-valid passes */}
          {!valid && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setExceptionModalOpen(true)}
                className="flex-1 py-3 px-4 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Log Emergency Exception Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exception Entry Modal */}
      {exceptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h4 className="font-bold text-base text-[#142B4A] mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Emergency / Exception Entry Record
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              If authorized hostel procedures permit entry despite missing/expired digital pass, record an immutable exception log with the reason.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Entry Decision
                </label>
                <select
                  value={exceptionStatus}
                  onChange={(e) => setExceptionStatus(e.target.value as any)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="approved">Permit Entry Under Exception</option>
                  <option value="denied">Deny Entry (Record Refusal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Exception (Required for Audit)
                </label>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="e.g. Approved by Chief Mistress after verbal confirmation from teacher..."
                  rows={3}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExceptionModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogException}
                disabled={submitting || !exceptionReason.trim()}
                className="px-5 py-2 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {submitting ? "Logging..." : "Submit Exception Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
