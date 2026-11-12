"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Search, Shield, AlertCircle, Loader2 } from "lucide-react";
import type { AuditLog } from "@/lib/types";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <span className="text-[11px] font-mono text-slate-400">IMMUTABLE APPEND-ONLY AUDIT LEDGER</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-700" />
              System Audit Logs ({logs.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Protected against administrative tampering, modification, and deletion by database triggers.
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, reasons, or actors..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <option value="">All Action Types</option>
            <option value="student.suspend">student.suspend</option>
            <option value="student.revoke">student.revoke</option>
            <option value="student.reinstate">student.reinstate</option>
            <option value="student.register">student.register</option>
            <option value="session.complete">session.complete</option>
            <option value="attendance.confirm">attendance.confirm</option>
            <option value="hostel.entry_confirmed">hostel.entry_confirmed</option>
            <option value="admin.permissions_updated">admin.permissions_updated</option>
            <option value="system.settings_updated">system.settings_updated</option>
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0F766E] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Reason & Justification</th>
                  <th className="py-3 px-4">Request Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-[#142B4A]">
                      {log.actor_name || "System"}
                    </td>
                    <td className="py-3 px-4 font-sans capitalize text-slate-600">
                      {log.actor_role.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0F766E]">{log.action}</td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-xs truncate">
                      {log.reason || "Operational action"}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-slate-400">
                      {log.request_reference?.slice(0, 10)}...
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
