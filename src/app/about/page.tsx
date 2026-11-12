import React from "react";
import Link from "next/link";
import { Shield, CheckCircle2, ArrowRight, AlertTriangle, BookOpen, Clock } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center mx-auto shadow-md">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#142B4A]">
          About IMASA Platform
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Electronic Student Identification, Madrasa Attendance, and Daily Hostel Entry Authorization System.
        </p>
      </div>

      {/* 1. Background & Context */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
        <h2 className="text-lg font-bold text-[#142B4A] flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#0F766E]" />
          1. Organizational Background
        </h2>
        <p>
          IMASA operates weekend Madrasa classes on <strong>Fridays, Saturdays, and Sundays</strong>, generally around Maghrib through the evening.
        </p>
        <p>
          Students often encounter difficulty returning to their respective university and off-campus hostels due to strict curfew restrictions. Hostel mistresses need an incontrovertible mechanism to verify whether a student genuinely attended the relevant Madrasa session before granting late entry.
        </p>
        <p>
          The IMASA Electronic Platform bridges this gap with an authoritative, centralized digital solution that provides permanent identification while enforcing strict, audited attendance checks before issuing temporary entry authorizations.
        </p>
      </section>

      {/* 2. Core Operating Principle */}
      <section className="bg-amber-50 border-2 border-amber-300 p-6 sm:p-8 rounded-2xl shadow-sm space-y-4 text-xs text-amber-950 leading-relaxed">
        <h2 className="text-lg font-bold text-amber-950 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          2. Foundational Principle: Permanent ID &ne; Daily Hostel Authorization
        </h2>
        <p className="font-semibold text-sm">
          A student can possess an active electronic ID but still have NO authorization for a particular day.
        </p>
        <p>
          A permanent electronic ID establishes identity. Only teacher-confirmed physical attendance in a formally completed Madrasa session results in a valid daily hostel-entry authorization.
        </p>
      </section>

      {/* 3. Dead-battery procedure */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
        <h2 className="text-lg font-bold text-[#142B4A] flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#0F766E]" />
          3. Dead-Battery & No-Phone Contingency Protocol
        </h2>
        <p>
          Printed IDs are not utilized. If a student&apos;s phone has a dead battery or is unavailable:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>The student reports in person to the authorized Madrasa teacher.</li>
          <li>The teacher searches the student&apos;s registration number or full name.</li>
          <li>The teacher visually inspects the student&apos;s photograph on screen to verify physical presence.</li>
          <li>The teacher records attendance under the authorized manual verification procedure with a recorded reason.</li>
          <li>Upon session completion, the system automatically generates the daily hostel authorization.</li>
          <li>The hostel mistress looks up the student&apos;s name or registration number on her terminal.</li>
        </ol>
      </section>

      <div className="text-center pt-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-sm shadow transition-colors"
        >
          Access IMASA Portal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
