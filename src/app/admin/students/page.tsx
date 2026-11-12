"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Student, Hostel, StudentStatus } from "@/lib/types";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hostelFilter, setHostelFilter] = useState<string>("all");

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: "suspend" | "revoke" | "reinstate";
    student: Student;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // New Student Form State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newHostelId, setNewHostelId] = useState("");
  const [newClassGroup, setNewClassGroup] = useState("Group A");
  const [newPhone, setNewPhone] = useState("");
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (hostelFilter !== "all") params.set("hostelId", hostelFilter);

      const [sRes, hRes] = await Promise.all([
        fetch(`/api/students?${params.toString()}`).then((r) => r.json()),
        fetch("/api/hostels").then((r) => r.json()),
      ]);

      if (sRes.students) setStudents(sRes.students);
      if (hRes.hostels) setHostels(hRes.hostels);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load students." });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, hostelFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    setRegisterSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          hostelId: newHostelId || null,
          classGroup: newClassGroup,
          phone: newPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register student.");

      setFeedback({
        type: "success",
        text: `Student ${data.student.full_name} registered successfully with registration number ${data.student.registration_number}!`,
      });
      setRegisterModalOpen(false);
      setNewFullName("");
      setNewEmail("");
      setNewPhone("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Registration failed." });
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const handleStatusAction = async () => {
    if (!actionModal || !actionReason.trim()) return;

    setActionSubmitting(true);
    setFeedback(null);
    const { type, student } = actionModal;

    try {
      const res = await fetch(`/api/students/${student.id}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: actionReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${type} student ID.`);

      setFeedback({
        type: "success",
        text: `Student ID for ${student.full_name} was successfully ${type === "suspend" ? "suspended" : type === "revoke" ? "permanently revoked" : "reinstated"}.`,
      });
      setActionModal(null);
      setActionReason("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || `Operation failed.` });
    } finally {
      setActionSubmitting(false);
    }
  };

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
        <span className="text-[11px] font-mono text-slate-400">STUDENT DATABASE & ID CONTROL</span>
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

      {/* Main Student Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with Title and Add Student Button */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0F766E]" />
              Registered Student Roster ({students.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student electronic identification cards, hostel allocations, and disciplinary status.
            </p>
          </div>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Register New Student
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, registration number or email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>

            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="all">All Hostels</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hostel_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Registration #</th>
                <th className="py-3 px-4">Hostel Assignment</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">ID Status</th>
                <th className="py-3 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0F766E] mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No students found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Student Photo & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {student.photograph_url ? (
                            <img src={student.photograph_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-[#142B4A] text-white flex items-center justify-center font-bold">
                              {student.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{student.full_name}</div>
                          {student.status_reason && (
                            <span className="text-[10px] text-rose-700 italic block">
                              Reason: {student.status_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reg No */}
                    <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">
                      {student.registration_number}
                    </td>

                    {/* Hostel */}
                    <td className="py-3 px-4 text-slate-700">{student.hostel_name || "Unassigned"}</td>

                    {/* Class */}
                    <td className="py-3 px-4 text-slate-700">{student.class_group || "Group A"}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={student.student_status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {student.student_status === "active" && (
                          <button
                            onClick={() => {
                              setActionModal({ type: "suspend", student });
                              setActionReason("");
                            }}
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium text-xs transition-colors"
                            title="Temporarily suspend ID"
                          >
                            Suspend
                          </button>
                        )}

                        {student.student_status === "active" && (
                          <button
                            onClick={() => {
                              setActionModal({ type: "revoke", student });
                              setActionReason("");
                            }}
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium text-xs transition-colors"
                            title="Permanently revoke ID"
                          >
                            Revoke
                          </button>
                        )}

                        {(student.student_status === "suspended" || student.student_status === "revoked") && (
                          <button
                            onClick={() => {
                              setActionModal({ type: "reinstate", student });
                              setActionReason("");
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium text-xs transition-colors"
                            title="Reinstate student ID"
                          >
                            Reinstate ID
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Student Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Register New Student</h3>
            <p className="text-xs text-slate-500 mb-4">
              A unique permanent electronic ID and registration number will be generated.
            </p>

            <form onSubmit={handleRegisterStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (First and Last) *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Fatima Muhammad"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional / Student Email *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. fatima.m@imasa.demo"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel</label>
                  <select
                    value={newHostelId}
                    onChange={(e) => setNewHostelId(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="">Select Hostel...</option>
                    {hostels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hostel_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class Group</label>
                  <select
                    value={newClassGroup}
                    onChange={(e) => setNewClassGroup(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="Group A">Group A</option>
                    <option value="Group B">Group B</option>
                    <option value="Group C">Group C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting || !newFullName || !newEmail}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {registerSubmitting ? "Registering..." : "Generate Electronic ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Revoke / Reinstate Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirm ID {actionModal.type.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Student: <strong className="text-slate-800">{actionModal.student.full_name}</strong> ({actionModal.student.registration_number})
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 mb-4 leading-relaxed">
              {actionModal.type === "suspend" && (
                <span>
                  <strong>Suspension Effect:</strong> This temporarily disables the electronic ID. All active daily authorizations are immediately revoked. The student cannot obtain new passes until reinstated.
                </span>
              )}
              {actionModal.type === "revoke" && (
                <span>
                  <strong>Revocation Effect:</strong> This permanently withdraws the student&apos;s electronic ID. Existing passes are instantly invalidated. Reinstatement requires an explicit Super Admin decision.
                </span>
              )}
              {actionModal.type === "reinstate" && (
                <span>
                  <strong>Reinstatement Effect:</strong> This restores the student&apos;s ID to active status and clears the disciplinary lock.
                </span>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-semibold text-slate-700">
                Reason for {actionModal.type} (Mandatory Audit Trail Entry) *
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                placeholder="Specify administrative / disciplinary justification..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusAction}
                disabled={actionSubmitting || actionReason.trim().length < 5}
                className={`px-5 py-2 text-white text-xs font-bold rounded-lg disabled:opacity-50 ${
                  actionModal.type === "reinstate"
                    ? "bg-[#0F766E] hover:bg-[#0B5C55]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionSubmitting ? "Processing..." : `Confirm ${actionModal.type.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
