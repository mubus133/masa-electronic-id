"use client";

import React, { useState } from "react";
import { Search, BatteryCharging, AlertCircle, Check, X } from "lucide-react";
import type { Student } from "@/lib/types";

interface ManualAttendanceModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAttendanceModal({
  sessionId,
  isOpen,
  onClose,
  onSuccess,
}: ManualAttendanceModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reason, setReason] = useState("Phone battery was dead upon arrival at Madrasa");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(searchQuery.trim())}&limit=10`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setSearchResults(data.students || []);
      if ((data.students || []).length === 0) {
        setError("No active students found matching your search.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search students.");
    } finally {
      setSearching(false);
    }
  };

  const handleRecord = async () => {
    if (!selectedStudent) return;
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a valid reason for manual attendance.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          studentId: selectedStudent.id,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record manual attendance.");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record manual attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#142B4A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#0F766E] flex items-center justify-center">
              <BatteryCharging className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manual Attendance Procedure</h3>
              <p className="text-[11px] text-slate-300">Dead battery & unavailable phone exception</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Bar */}
          {!selectedStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Search Student (Name or Registration #)
              </label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Khadijah or IMASA-1001"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="px-4 py-2 bg-[#0F766E] text-white text-xs font-semibold rounded-lg hover:bg-[#0B5C55] disabled:opacity-50 transition-colors"
                >
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Search Results List */}
              {searchResults.length > 0 && (
                <div className="mt-3 border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStudent(s)}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          {s.photograph_url ? (
                            <img src={s.photograph_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-[#142B4A] text-white text-xs font-bold flex items-center justify-center">
                              {s.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-800">{s.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.registration_number}</div>
                        </div>
                      </div>
                      <button className="text-xs text-[#0F766E] font-semibold hover:underline">
                        Select &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Student Confirmation */}
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0">
                    {selectedStudent.photograph_url ? (
                      <img
                        src={selectedStudent.photograph_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-[#142B4A] text-white font-bold flex items-center justify-center">
                        {selectedStudent.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#142B4A]">{selectedStudent.full_name}</h4>
                    <p className="font-mono text-xs text-[#0F766E]">{selectedStudent.registration_number}</p>
                    <p className="text-[11px] text-slate-500">
                      Hostel: {selectedStudent.hostel_name || "Unassigned"} &bull; Class: {selectedStudent.class_group || "Group A"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Change
                </button>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Manual Attendance (Audit Record)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder="Specify student's situation..."
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Physical Presence Attestation:</strong> By proceeding, you certify that you have physically identified this student in person and confirmed her presence in this Madrasa session.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRecord}
                  disabled={submitting || !reason.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-semibold rounded-lg disabled:opacity-50 shadow"
                >
                  <Check className="h-4 w-4" />
                  {submitting ? "Recording..." : "Confirm Presence & Record Attendance"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
