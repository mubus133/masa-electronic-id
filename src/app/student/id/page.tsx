"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, IdCard, AlertCircle } from "lucide-react";
import { ElectronicIdCard } from "@/components/student/ElectronicIdCard";
import type { Student, DailyAuthorization } from "@/lib/types";

export default function StudentIdPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [latestAuth, setLatestAuth] = useState<DailyAuthorization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (authData) => {
        if (!authData.authenticated || !authData.actor.studentId) return;

        const [sRes, aRes] = await Promise.all([
          fetch(`/api/students/${authData.actor.studentId}`).then((r) => r.json()),
          fetch(`/api/authorizations?studentId=${authData.actor.studentId}`).then((r) => r.json()),
        ]);

        if (sRes.student) setStudent(sRes.student);
        if (aRes.authorizations && aRes.authorizations.length > 0) {
          setLatestAuth(aRes.authorizations[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Student ID could not be loaded.</p>
        <Link href="/login" className="text-xs text-[#0F766E] font-semibold underline mt-2 inline-block">
          Return to Login
        </Link>
      </div>
    );
  }

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
        <span className="text-[11px] font-mono text-slate-400">OFFICIAL IMASA DIGITAL ID</span>
      </div>

      <ElectronicIdCard student={student} latestAuth={latestAuth} />

      <div className="text-center text-[11px] text-slate-500 max-w-sm mx-auto">
        Present this screen to hostel staff on your mobile browser. The hostel mistress will look up your registration number on the terminal.
      </div>
    </div>
  );
}
