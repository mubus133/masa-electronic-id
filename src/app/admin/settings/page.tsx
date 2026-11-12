"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Save, CheckCircle2, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import type { SystemSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch((err) => setFeedback({ type: "error", text: "Failed to load system settings." }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings.");

      setFeedback({ type: "success", text: "Operational settings updated and recorded in audit log." });
      setSettings(data.settings);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Overview
        </Link>
        <span className="text-[11px] font-mono text-slate-400">PRESIDENT CONFIGURATION TERMINAL</span>
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

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#142B4A] flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#0F766E]" />
              System Operational Settings & Policies
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure parameters governing QR expiration, curfew pass validity, entry redemption, and late policies.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save System Policies
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Section 1: QR Parameters */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#142B4A] uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              1. Attendance QR Code Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  QR Token TTL (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={settings.qr_ttl_seconds}
                  onChange={(e) => setSettings({ ...settings, qr_ttl_seconds: parseInt(e.target.value, 10) || 120 })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  How frequently the teacher&apos;s QR code rotates (Default: 120s / 2 minutes).
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Attendance Window Before Session (Minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={settings.attendance_open_minutes_before}
                  onChange={(e) => setSettings({ ...settings, attendance_open_minutes_before: parseInt(e.target.value, 10) || 30 })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Permitted time before session start when QR attendance can open.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Hostel Pass Expiry & Redemption */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-[#142B4A] uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              2. Daily Hostel Pass Validity & Redemption Policy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pass Expiry Calculation Mode
                </label>
                <select
                  value={settings.pass_expiry_mode}
                  onChange={(e) => setSettings({ ...settings, pass_expiry_mode: e.target.value as any })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                >
                  <option value="end_of_day">End of Session Day (Midnight Local Time)</option>
                  <option value="fixed_hours">Fixed Number of Hours After Completion</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fixed Validity Duration (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={settings.pass_expiry_hours}
                  onChange={(e) => setSettings({ ...settings, pass_expiry_hours: parseInt(e.target.value, 10) || 6 })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used if fixed hours mode is selected or fallback curfew margin.
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.one_time_entry}
                  onChange={(e) => setSettings({ ...settings, one_time_entry: e.target.checked })}
                  className="h-4 w-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span className="font-semibold text-slate-800">
                  Enforce One-Time Pass Redemption (Strict Curfew Policy)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                When enabled, once a hostel mistress selects &apos;Confirm Hostel Entry&apos;, the pass is atomically marked as REDEEMED and cannot be reused tonight.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_hostel_assignment}
                  onChange={(e) => setSettings({ ...settings, require_hostel_assignment: e.target.checked })}
                  className="h-4 w-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span className="font-semibold text-slate-800">
                  Enforce Station Hostel Scope (Reject Entry at Wrong Hostel)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6">
                Requires students to verify entry only at their registered hostel.
              </p>
            </div>
          </div>

          {/* Section 3: Late Attendance Policy */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="font-bold text-sm text-[#142B4A] uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
              3. Late Arrival & Attendance Policy
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Late Cutoff Threshold (Minutes after start)
                </label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={settings.late_cutoff_minutes}
                  onChange={(e) => setSettings({ ...settings, late_cutoff_minutes: parseInt(e.target.value, 10) || 20 })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Timezone</label>
                <input
                  type="text"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default: Africa/Lagos</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.late_receives_pass}
                  onChange={(e) => setSettings({ ...settings, late_receives_pass: e.target.checked })}
                  className="h-4 w-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                />
                <span className="font-semibold text-slate-800">
                  Allow Verified Late Students to Receive Daily Hostel Passes
                </span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
