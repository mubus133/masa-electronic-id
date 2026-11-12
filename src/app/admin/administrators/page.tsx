"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Plus, Check, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { GRANTABLE_PERMISSIONS } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

export default function AdminAdministratorsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPermissions, setNewPermissions] = useState<Permission[]>(["students.register", "attendance.view"]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAdmins = async () => {
    try {
      const res = await fetch("/api/administrators");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load administrators.");
      setAdmins(data.administrators || []);
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load administrators." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleOpenPerms = (admin: any) => {
    setSelectedAdmin(admin);
    setSelectedPermissions(admin.permissions || []);
  };

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/administrators/${selectedAdmin.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions.");

      setFeedback({ type: "success", text: `Permissions updated for ${selectedAdmin.full_name}.` });
      setSelectedAdmin(null);
      loadAdmins();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update permissions." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          permissions: newPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to appoint administrator.");

      setFeedback({ type: "success", text: `Administrator ${data.administrator.fullName} appointed.` });
      setCreateModalOpen(false);
      setNewFullName("");
      setNewEmail("");
      loadAdmins();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Appointment failed." });
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
        <span className="text-[11px] font-mono text-slate-400">PRESIDENT&apos;S PERMISSION GOVERNANCE</span>
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
              <Shield className="h-5 w-5 text-[#C8A45D]" />
              Delegated Administrators & Scope
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              The President of IMASA holds unrestricted Super Admin authority. Delegated administrators only possess explicitly granted permissions.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            Appoint Administrator
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">Granted Permissions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{admin.full_name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{admin.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        admin.role === "super_admin"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {admin.role === "super_admin" ? "President (Super Admin)" : "Delegated Admin"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {admin.role === "super_admin" ? (
                      <span className="text-xs font-semibold text-amber-900 italic">
                        All System Privileges (Unrestricted)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600 font-medium">
                        {(admin.permissions || []).length} permissions assigned
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {admin.role !== "super_admin" && (
                      <button
                        onClick={() => handleOpenPerms(admin)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        Edit Permissions
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Edit Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">
              Edit Permissions: {selectedAdmin.full_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select which administrative capabilities this delegated administrator is authorized to execute.
            </p>

            <div className="space-y-2 mb-6">
              {GRANTABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isChecked ? "bg-teal-50/60 border-[#0F766E]/40" : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 h-4 w-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <span className="font-bold text-xs text-[#142B4A] block">{perm.label}</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">{perm.detail}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAdmin(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={submitting}
                className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-bold rounded-lg disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Assigned Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appoint Admin Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-lg font-bold text-[#142B4A] mb-1">Appoint Delegated Administrator</h3>
            <p className="text-xs text-slate-500 mb-4">Create account and assign initial scope.</p>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Registrar Fatima Sani"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. admin@imasa.demo"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newFullName || !newEmail}
                  className="px-5 py-2 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Appointing..." : "Appoint Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
