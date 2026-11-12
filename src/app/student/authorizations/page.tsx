"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, Building2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DailyAuthorization } from "@/lib/types";

export default function StudentAuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState<DailyAuthorization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/authorizations")
      .then((res) => res.json())
      .then((data) => setAuthorizations(data.authorizations || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <span className="text-[11px] font-mono text-slate-400">HOSTEL ENTRY AUTHORIZATION LOG</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#0F766E]" />
            My Daily Hostel Entry Passes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authorizations issued after Madrasa attendance confirmation for late hostel entry.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mx-auto" />
          </div>
        ) : authorizations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No daily authorizations issued yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Session Date</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Teacher Verified</th>
                  <th className="py-3.5 px-4">Pass Expiration</th>
                  <th className="py-3.5 px-4">Hostel</th>
                  <th className="py-3.5 px-4">Pass Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authorizations.map((auth) => (
                  <tr key={auth.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {new Date(auth.issued_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#142B4A]">
                      {auth.session_name || "Madrasa Class"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {auth.teacher_name || "Ustazah"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(auth.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {auth.hostel_name || "Assigned Hostel"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={auth.authorization_status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
