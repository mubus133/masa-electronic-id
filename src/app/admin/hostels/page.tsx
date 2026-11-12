"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Plus, Users, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Hostel, HostelStaff } from "@/lib/types";

export default function AdminHostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [staff, setStaff] = useState<HostelStaff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [hostelModalOpen, setHostelModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [hostelName, setHostelName] = useState("");
  const [hostelLocation, setHostelLocation] = useState("");
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffHostelId, setStaffHostelId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch("/api/hostels").then((r) => r.json()),
        fetch("/api/hostels/staff").then((r) => r.json()),
      ]);
      if (hRes.hostels) setHostels(hRes.hostels);
      if (sRes.staff) setStaff(sRes.staff);
    } catch {
      setFeedback({ type: "error", text: "Failed to load hostel data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostelName.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostelName: hostelName.trim(), hostelLocation: hostelLocation.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create hostel.");

      setFeedback({ type: "success", text: `Hostel ${data.hostel.hostel_name} created successfully.` });
      setHostelModalOpen(false);
      setHostelName("");
      setHostelLocation("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to create hostel." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFullName.trim() || !staffEmail.trim() || !staffHostelId) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/hostels/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: staffFullName.trim(),
          email: staffEmail.trim(),
          hostelId: staffHostelId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register hostel staff.");

      setFeedback({ type: "success", text: `Hostel mistress ${data.staff.full_name} registered successfully.` });
      setStaffModalOpen(false);
      setStaffFullName("");
      setStaffEmail("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to register staff." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <span className="text-[11px] font-mono text-slate-400">HOSTEL & RESIDENCE MANAGEMENT</span>
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

      {/* Hostels Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#0F766E]" />
              Authorized Hostels ({hostels.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Registered student residences governed by IMASA late curfew entry authorization agreements.
            </p>
          </div>

          <button
            onClick={() => setHostelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Hostel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hostel Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Active Resident Students</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hostels.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{h.hostel_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{h.hostel_location || "Campus vicinity"}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#0F766E]">{h.active_student_count || 0} students</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={h.hostel_status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hostel Staff Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-700" />
              Hostel Mistresses & Staff ({staff.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Authorized gate and entry staff granted access to the live Hostel Verification Portal.
            </p>
          </div>

          <button
            onClick={() => setStaffModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            Register Hostel Staff
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email Account</th>
                <th className="py-3 px-4">Assigned Hostel</th>
                <th className="py-3 px-4">Staff Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{s.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{(s as any).email}</td>
                  <td className="py-3.5 px-4 font-semibold text-purple-900">{s.hostel_name || "Assigned"}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.staff_status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hostel Modal */}
      {hostelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Add Authorized Hostel</h3>
            <p className="text-xs text-slate-500 mb-4">Register a new residential hall or student hostel.</p>
            <form onSubmit={handleCreateHostel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hostel Name *</label>
                <input
                  type="text"
                  required
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  placeholder="e.g. Maryam House or Block C"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Campus Section</label>
                <input
                  type="text"
                  value={hostelLocation}
                  onChange={(e) => setHostelLocation(e.target.value)}
                  placeholder="e.g. North Gate Campus"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHostelModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !hostelName.trim()}
                  className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create Hostel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Register Hostel Mistress / Staff</h3>
            <p className="text-xs text-slate-500 mb-4">Create access for terminal entry verification.</p>
            <form onSubmit={handleRegisterStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  placeholder="e.g. Hostel Mistress Zainab"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="e.g. zainab@imasa.demo"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Hostel *</label>
                <select
                  required
                  value={staffHostelId}
                  onChange={(e) => setStaffHostelId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">Select Hostel...</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.hostel_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !staffFullName || !staffEmail || !staffHostelId}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
