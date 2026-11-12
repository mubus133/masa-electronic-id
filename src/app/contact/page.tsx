"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Shield, Mail } from "lucide-react";

export default function ContactPage() {
  const [category, setCategory] = useState<"technical" | "dispute" | "account" | "other">("technical");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>
        <span className="text-[11px] font-mono text-slate-400">SECRETARIAT SUPPORT DESK</span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto mb-2">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold text-[#142B4A]">Support & Dispute Desk</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Report technical issues, submit an attendance dispute, or request credential recovery from IMASA Secretariat.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-emerald-950 text-base">Request Submitted</h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
              Your inquiry has been delivered to the IMASA Administrative Secretariat. Inquiries are audited and reviewed by authorized staff.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 px-4 py-2 bg-[#0F766E] text-white text-xs font-bold rounded-lg"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Inquiry Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              >
                <option value="technical">Technical Support (Scanner, ID Card Display)</option>
                <option value="dispute">Attendance Dispute (Class Presence Review)</option>
                <option value="account">Account & Credential Assistance</option>
                <option value="other">General Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of issue..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include student name, registration number, session date, or technical details..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Send to Secretariat"}
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
