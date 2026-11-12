import Link from "next/link";
import {
  Shield,
  QrCode,
  IdCard,
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#142B4A] to-[#0D1E35] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#C8A45D_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F766E]/30 border border-[#14B8A6]/30 text-[#14B8A6] text-xs font-semibold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" />
            Official IMASA Institutional Verification System
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Electronic Student ID & <br className="hidden sm:inline" />
            <span className="text-[#C8A45D]">Madrasa Attendance Platform</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Centralized electronic identification and attendance verification platform powering weekend Madrasa classes, teacher physical presence confirmation, and daily hostel curfew entry authorizations.
          </p>

          {/* Quick Call to Actions */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2"
            >
              Access Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              Operating Principles & Rules
            </Link>
          </div>
        </div>
      </section>

      {/* CORE OPERATING PRINCIPLE BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Foundational Operational Principle
              </span>
              <h3 className="text-lg font-black text-amber-950">
                Permanent Electronic ID &ne; Daily Hostel Authorization
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Possession of an active electronic ID identifies the student, but does <strong>not</strong> authorize hostel entry after curfew. A temporary daily authorization is only issued after the student attends Madrasa, receives explicit physical verification from an authorized teacher, and the session completes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE PORTAL SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A]">
            Dedicated Portals for Every User
          </h2>
          <p className="text-xs text-slate-500">
            Tailored interfaces designed for mobile phones, desktop workstations, and high-security administrative oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200 flex items-center justify-center">
                <IdCard className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#142B4A]">Student Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                View permanent electronic ID, scan teacher session QR codes, track attendance history, and review live daily hostel pass status.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
              >
                Student Login &rarr;
              </Link>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#142B4A]">Madrasa Teacher</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate rotating temporary QR codes, physically verify student presence, record manual no-phone entries, and finalize sessions.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
              >
                Teacher Dashboard &rarr;
              </Link>
            </div>
          </div>

          {/* Hostel Mistress Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#142B4A]">Hostel Mistress</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search students on any desktop browser, verify live server authorization, confirm one-time pass entry, and log emergency exceptions.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
              >
                Hostel Verification Portal &rarr;
              </Link>
            </div>
          </div>

          {/* President Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#142B4A]">President & Admin</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full administrative authority over student registrations, ID suspensions/revocations, hostel rosters, audit logs, and settings.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
              >
                Super Admin Access &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM WORKFLOW STEPS */}
      <section className="bg-white border-y border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">End-to-End Workflow</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142B4A]">
              How Verification Operates Every Session
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="h-6 w-6 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h4 className="font-bold text-sm text-[#142B4A]">QR Generation</h4>
              <p className="text-slate-600 leading-relaxed">
                Teacher opens the session and displays a temporary, unpredictable QR token that rotates automatically.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="h-6 w-6 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h4 className="font-bold text-sm text-[#142B4A]">Student QR Scan</h4>
              <p className="text-slate-600 leading-relaxed">
                Student scans the code. A <em>pending</em> attendance record is created. QR scan alone never counts as confirmed attendance.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="h-6 w-6 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h4 className="font-bold text-sm text-[#142B4A]">Teacher Confirmation</h4>
              <p className="text-slate-600 leading-relaxed">
                Teacher physically verifies the student in the classroom, approves attendance, and formalizes session completion.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 relative">
              <span className="h-6 w-6 rounded-full bg-[#142B4A] text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h4 className="font-bold text-sm text-[#142B4A]">Live Hostel Check</h4>
              <p className="text-slate-600 leading-relaxed">
                Hostel mistress searches the student on her computer, inspects the live server verdict, and confirms entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DEAD BATTERY / NO-PHONE NOTICE */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-lg font-bold">Dead Battery & No-Phone Procedure</h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Students without a working phone are not excluded. Authorized teachers perform visual photograph identification and record an audited manual check-in with documented reasoning.
            </p>
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold shadow shrink-0"
          >
            Access Platform
          </Link>
        </div>
      </section>
    </div>
  );
}
