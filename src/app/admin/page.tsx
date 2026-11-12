"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  UserCheck,
  Building2,
  Calendar,
  IdCard,
  FileText,
  Settings,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Download,
} from "lucide-react";
import type { AdminStats } from "@/lib/services/admin";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.authenticated || (data.actor.role !== "super_admin" && data.actor.role !== "administrator")) {
          router.push("/login");
          return;
        }

        const statsRes = await fetch("/api/admin/stats").then((r) => r.json());
        if (statsRes.stats) setStats(statsRes.stats);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#142B4A] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-[11px] font-bold text-[#C8A45D] uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            President & Administrative Secretariat
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">System Administrative Overview</h1>
          <p className="text-xs text-slate-300 mt-1">
            Complete institutional control over student IDs, attendance verification, hostel entry authorizations, and audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/export?type=students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Students
          </a>
          <a
            href="/api/admin/export?type=attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Attendance
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* METRIC CARDS */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total Students
            </span>
            <div className="text-2xl font-black text-[#142B4A]">{stats.totalStudents}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{stats.activeStudents} active</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Suspended IDs
            </span>
            <div className="text-2xl font-black text-rose-600">{stats.suspendedStudents}</div>
            <span className="text-[10px] text-slate-400">Temporary lock</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Revoked IDs
            </span>
            <div className="text-2xl font-black text-red-700">{stats.revokedStudents}</div>
            <span className="text-[10px] text-slate-400">Permanently withdrawn</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Active Teachers
            </span>
            <div className="text-2xl font-black text-[#0F766E]">{stats.totalTeachers}</div>
            <span className="text-[10px] text-slate-400">{stats.totalHostels} registered hostels</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Passes Issued Today
            </span>
            <div className="text-2xl font-black text-[#142B4A]">{stats.todayPassesIssued}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{stats.todayHostelEntries} entries confirmed</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Pending Check-ins
            </span>
            <div className="text-2xl font-black text-amber-600">{stats.pendingAttendance}</div>
            <span className="text-[10px] text-amber-700 font-semibold">Awaiting teacher verification</span>
          </div>
        </div>
      )}

      {/* QUICK MANAGEMENT MODULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/admin/students"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-[#142B4A] group-hover:text-[#0F766E] transition-colors">
              Student Management
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Register students, manage photographs, suspend, revoke, or reinstate electronic student IDs.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-[#0F766E] flex items-center gap-1">
            Manage Students &rarr;
          </div>
        </Link>

        <Link
          href="/admin/sessions"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-[#142B4A] group-hover:text-blue-700 transition-colors">
              Session Management
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Schedule weekend Madrasa sessions, assign teachers, monitor attendance, and finalize completion.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-blue-700 flex items-center gap-1">
            Manage Sessions &rarr;
          </div>
        </Link>

        <Link
          href="/admin/hostels"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-[#142B4A] group-hover:text-purple-700 transition-colors">
              Hostel Management
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure authorized student hostels, register hostel mistresses, and review entry logs.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-purple-700 flex items-center gap-1">
            Manage Hostels &rarr;
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 group-hover:bg-amber-800 group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-[#142B4A] group-hover:text-amber-800 transition-colors">
              Immutable Audit Logs
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Append-only tamper-proof log of every administrative action, suspension, revocation, and entry.
            </p>
          </div>
          <div className="pt-4 text-xs font-bold text-amber-800 flex items-center gap-1">
            Inspect Audit Logs &rarr;
          </div>
        </Link>
      </div>

      {/* ADDITIONAL ADMIN NAVIGATION TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/admin/administrators"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <h4 className="font-bold text-sm text-[#142B4A]">Delegated Administrators</h4>
          <p className="text-xs text-slate-500 mt-1">
            Grant or revoke specific functional permissions without granting Super Admin rights.
          </p>
        </Link>

        <Link
          href="/admin/teachers"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <h4 className="font-bold text-sm text-[#142B4A]">Madrasa Teachers</h4>
          <p className="text-xs text-slate-500 mt-1">
            Register teachers, manage assigned classes, and audit physical presence verification.
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <h4 className="font-bold text-sm text-[#142B4A]">System Settings & Policies</h4>
          <p className="text-xs text-slate-500 mt-1">
            Configure QR rotation interval, pass expiry hours, one-time entry policy, and timezones.
          </p>
        </Link>
      </div>
    </div>
  );
}
