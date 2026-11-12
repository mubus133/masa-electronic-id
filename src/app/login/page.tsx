"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      // Role-based redirection
      const role = data.user.role;
      if (role === "student") {
        router.push("/student");
      } else if (role === "teacher") {
        router.push("/teacher");
      } else if (role === "hostel_staff") {
        router.push("/hostel");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-[#0F766E] border border-[#14B8A6]/40 flex items-center justify-center mx-auto shadow-md">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-[#142B4A] tracking-tight">IMASA Platform Login</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Authorized access for students, Madrasa teachers, hostel mistresses, and administration.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. president@imasa.demo or khadijah"
                  className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E] font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Institutional credentials</span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5C55] text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Platform"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <KeyRound className="h-3.5 w-3.5 text-[#C8A45D]" />
              Quick Demo Accounts (1-Click Fill)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemo("president@imasa.demo", "Imasa-Demo-2026")}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <span className="font-bold text-[#142B4A] block">President (Super Admin)</span>
                <span className="text-[10px] text-slate-500">president@imasa.demo</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("teacher@imasa.demo", "Imasa-Demo-2026")}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <span className="font-bold text-blue-900 block">Madrasa Teacher</span>
                <span className="text-[10px] text-slate-500">teacher@imasa.demo</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("hostel@imasa.demo", "Imasa-Demo-2026")}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <span className="font-bold text-purple-900 block">Hostel Mistress</span>
                <span className="text-[10px] text-slate-500">hostel@imasa.demo</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("khadijah@imasa.demo", "Imasa-Demo-2026")}
                className="p-2 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <span className="font-bold text-[#0F766E] block">Student (Active ID)</span>
                <span className="text-[10px] text-slate-500">khadijah@imasa.demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
