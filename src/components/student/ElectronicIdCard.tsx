"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Shield, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Student, DailyAuthorization } from "@/lib/types";

interface ElectronicIdCardProps {
  student: Student;
  latestAuth?: DailyAuthorization | null;
}

export function ElectronicIdCard({ student, latestAuth }: ElectronicIdCardProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAuthValid =
    latestAuth &&
    latestAuth.authorization_status === "active" &&
    new Date(latestAuth.expires_at).getTime() > Date.now() &&
    student.student_status === "active";

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
      {/* Top Brand Banner */}
      <div className="bg-[#142B4A] text-white p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#0F766E] border border-[#14B8A6]/40 flex items-center justify-center shadow-inner">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wider text-white">IMASA</h2>
              <p className="text-[10px] text-slate-300 tracking-wider uppercase font-medium">Permanent Electronic Student ID</p>
            </div>
          </div>
          <StatusBadge status={student.student_status} size="sm" />
        </div>

        {/* Live Watermark / Clock */}
        <div className="flex items-center justify-between text-[11px] text-[#DFCA97] bg-black/20 px-2.5 py-1 rounded-md border border-white/10">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Digital ID
          </span>
          <span className="font-mono font-medium">{currentTime || "Active"}</span>
        </div>
      </div>

      {/* Main ID Body */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
          {/* Photo */}
          <div className="relative">
            <div className="h-28 w-28 rounded-xl overflow-hidden border-2 border-[#142B4A] shadow-md bg-slate-100 flex items-center justify-center">
              {student.photograph_url ? (
                <img
                  src={student.photograph_url}
                  alt={student.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#142B4A] flex items-center justify-center text-white text-3xl font-bold">
                  {student.full_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#0F766E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              OFFICIAL
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Student Name</p>
              <h3 className="font-bold text-lg text-[#142B4A] leading-tight">{student.full_name}</h3>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Registration Number</p>
              <p className="font-mono font-bold text-sm text-[#0F766E]">{student.registration_number}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Hostel</p>
                <p className="font-medium text-slate-800">{student.hostel_name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Class</p>
                <p className="font-medium text-slate-800">{student.class_group || "Group A"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Institutional Notice */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs mb-5 flex gap-2.5 items-start">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Operating Notice:</strong> Possession of this permanent ID alone does not authorize hostel entry. Daily entry requires teacher-confirmed Madrasa attendance.
          </p>
        </div>

        {/* DAILY AUTHORIZATION SECTION */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#0F766E]" />
              Today&apos;s Daily Hostel Authorization
            </h4>
            {isAuthValid ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                AUTHORIZED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                <XCircle className="h-3 w-3 text-red-600" />
                NO ACTIVE PASS
              </span>
            )}
          </div>

          {isAuthValid && latestAuth ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-[11px]">Madrasa Session:</span>
                <span className="font-semibold">{latestAuth.session_name || "Madrasa Session"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-[11px]">Confirmed By:</span>
                <span className="font-semibold">{latestAuth.teacher_name || "Ustazah In Charge"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-[11px]">Valid Until:</span>
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(latestAuth.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 text-center">
                Hostel staff will verify this record directly from the IMASA server upon your arrival.
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 text-center space-y-1">
              <p className="font-medium text-slate-800">No Valid Pass Issued For Tonight</p>
              <p className="text-[11px] text-slate-500">
                Attend your assigned Madrasa session, scan the teacher&apos;s QR code, and ensure your presence is confirmed to receive hostel entry authorization.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="bg-[#142B4A]/5 border-t border-slate-200 px-6 py-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>IMASA SECURE ID</span>
        <span>REF: {student.id.slice(0, 8).toUpperCase()}</span>
      </div>
    </div>
  );
}
