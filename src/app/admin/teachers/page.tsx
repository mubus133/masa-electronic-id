"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, User, Plus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Teacher } from "@/lib/types";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [assignedClass, setAssignedClass] = useState("Group A");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: "Failed to load teachers roster." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          teacherCode: teacherCode.trim() || undefined,
          assignedClass,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register teacher.");

      setFeedback({
        type: "success",
        text: `Ustazah ${data.teacher.full_name} registered successfully with code ${data.teacher.teacher_code}.`,
      });
      setModalOpen(false);
      setFullName("");
      setEmail("");
      setTeacherCode("");
      loadTeachers();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Teacher registration failed." });
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
        <span className="text-[11px] font-mono text-slate-400">TEACHER ROSTER & CLASS ALLOCATION</span>
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
              <User className="h-5 w-5 text-[#0F766E]" />
              Madrasa Teachers ({teachers.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized teachers who can open sessions, generate attendance QR codes, and confirm physical presence.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            Register Teacher
          </button>
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
                  <th className="py-3 px-4">Teacher Name</th>
                  <th className="py-3 px-4">Teacher Code</th>
                  <th className="py-3 px-4">Assigned Class</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">{t.full_name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0F766E]">{t.teacher_code}</td>
                    <td className="py-3.5 px-4 text-slate-700">{t.assigned_class || "Group A"}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.account_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Register Madrasa Teacher</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create an authorized teacher account for session attendance verification.
            </p>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ustazah Aisha Danladi"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. teacher@imasa.demo"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Class</label>
                <select
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="Group A">Group A</option>
                  <option value="Group B">Group B</option>
                  <option value="Group C">Group C</option>
                </select>
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
                  disabled={submitting || !fullName || !email}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Create Teacher Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
