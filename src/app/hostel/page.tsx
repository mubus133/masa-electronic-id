"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search, CheckCircle2, History, AlertTriangle, ShieldCheck } from "lucide-react";
import { StudentSearchPortal } from "@/components/hostel/StudentSearchPortal";
import { VerificationDisplay } from "@/components/hostel/VerificationDisplay";
import type { Student, VerificationResult, HostelStaff } from "@/lib/types";

export default function HostelVerificationPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loadingVerdict, setLoadingVerdict] = useState(false);
  const [hostelStaff, setHostelStaff] = useState<HostelStaff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || (data.actor.role !== "hostel_staff" && data.actor.role !== "super_admin" && data.actor.role !== "administrator")) {
          router.push("/login");
          return;
        }
        if (data.actor.hostelStaffId) {
          setHostelStaff({
            id: data.actor.hostelStaffId,
            user_id: data.actor.id,
            hostel_id: data.actor.hostelId || "",
            full_name: data.actor.fullName,
            staff_status: "active",
            created_at: "",
          });
        }
      });
  }, [router]);

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingVerdict(true);
    setError(null);

    try {
      const res = await fetch(`/api/authorizations/verify?studentId=${student.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify student.");
      setVerificationResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve student verification record.");
    } finally {
      setLoadingVerdict(false);
    }
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setVerificationResult(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Station Header */}
      <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Hostel Mistress Verification Terminal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">Curfew Entry Verification</h1>
          <p className="text-xs text-slate-300">
            Verify student identity, inspect live server-side Madrasa attendance authorization, and confirm one-time entry.
          </p>
        </div>

        <button
          onClick={() => router.push("/hostel/history")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-colors shrink-0"
        >
          <History className="h-4 w-4" />
          View Entry Logs
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main View: Either Search Portal or Verification Display */}
      {loadingVerdict ? (
        <div className="py-16 text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F766E] mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Checking live server authorization...</p>
        </div>
      ) : verificationResult ? (
        <VerificationDisplay
          result={verificationResult}
          onBack={handleReset}
          onEntryConfirmed={() => {
            // Re-fetch verdict to show redeemed status
            if (selectedStudent) handleSelectStudent(selectedStudent);
          }}
        />
      ) : (
        <StudentSearchPortal onSelectStudent={handleSelectStudent} />
      )}
    </div>
  );
}
