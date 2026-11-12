"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { QrScanner } from "@/components/student/QrScanner";
import type { Attendance } from "@/lib/types";

export default function StudentScanPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<Attendance | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScanSuccess = async (qrPayload: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    setScanMessage(null);

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Attendance submission failed.");
      }

      setSubmittedRecord(data.attendance);
      setScanMessage(data.message || "Attendance scan submitted successfully.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit attendance scan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <span className="text-[11px] font-mono text-slate-400">CAMERA ATTENDANCE CHECK-IN</span>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2.5 items-start">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Attendance Submission Error</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {submittedRecord ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              STATUS: PENDING TEACHER CONFIRMATION
            </span>
            <h2 className="text-xl font-black text-[#142B4A]">Scan Submitted Successfully!</h2>
            <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
              Your attendance submission has been recorded. Your teacher must now physically confirm your presence in the classroom before the session completes.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Submission Timestamp:</span>
              <span className="font-mono font-semibold">{new Date(submittedRecord.check_in_at).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Method:</span>
              <span className="font-semibold uppercase">{submittedRecord.check_in_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hostel Pass:</span>
              <span className="font-semibold text-amber-700">Issued upon session completion</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/student"
              className="flex-1 py-3 px-4 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              Return to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setSubmittedRecord(null);
                setScanMessage(null);
              }}
              className="py-3 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Scan Another Code
            </button>
          </div>
        </div>
      ) : (
        <QrScanner onScanSuccess={handleScanSuccess} isSubmitting={submitting} />
      )}
    </div>
  );
}
