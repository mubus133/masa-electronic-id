"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Plus, QrCode, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Session, Teacher } from "@/lib/types";

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [sessionName, setSessionName] = useState("Maghrib Madrasa Session");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [weekday, setWeekday] = useState<"Friday" | "Saturday" | "Sunday">("Friday");
  const [startTime, setStartTime] = useState("18:30");
  const [endTime, setEndTime] = useState("20:30");
  const [classGroup, setClassGroup] = useState("Group A");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("/api/sessions").then((r) => r.json()),
        fetch("/api/teachers").then((r) => r.json()),
      ]);
      if (sRes.sessions) setSessions(sRes.sessions);
      if (tRes.teachers) setTeachers(tRes.teachers);
    } catch (err: any) {
      setFeedback({ type: "error", text: "Failed to load session roster." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim() || !sessionDate) return;

    setSubmitting(true);
    setFeedback(null);

    const startsAt = new Date(`${sessionDate}T${startTime}:00Z`).toISOString();
    const endsAt = new Date(`${sessionDate}T${endTime}:00Z`).toISOString();

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionName: sessionName.trim(),
          sessionDate,
          weekday,
          startsAt,
          endsAt,
          classGroup,
          teacherIds: selectedTeacherId ? [selectedTeacherId] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session.");

      setFeedback({ type: "success", text: `Session '${data.session.session_name}' created.` });
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to schedule session." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <span className="text-[11px] font-mono text-slate-400">SESSION SCHEDULING & MONITORING</span>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex gap-2.5 items-start ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0F766E]" />
              Madrasa Sessions ({sessions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Weekend classes (Friday, Saturday, Sunday) scheduled around Maghrib and evening prayers.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            Schedule Session
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Session Date</th>
                <th className="py-3 px-4">Session Name</th>
                <th className="py-3 px-4">Class Group</th>
                <th className="py-3 px-4">Check-in Submissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                    {s.weekday}, {s.session_date}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{s.session_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.class_group || "Group A"}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.attendance_count || 0} students</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.session_status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/teacher/sessions/${s.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#142B4A] hover:bg-[#0D1E35] text-white font-semibold text-xs shadow-sm transition-colors"
                    >
                      Manage & QR &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Schedule Madrasa Session</h3>
            <p className="text-xs text-slate-500 mb-4">Set up a session for attendance and QR code generation.</p>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name *</label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weekday *</label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(e.target.value as any)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (Maghrib) *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Group</label>
                  <select
                    value={classGroup}
                    onChange={(e) => setClassGroup(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="Group A">Group A</option>
                    <option value="Group B">Group B</option>
                    <option value="Group C">Group C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Teacher</label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="">Select Teacher...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Scheduling..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
