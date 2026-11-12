import React from "react";
import Link from "next/link";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>
        <span className="text-[11px] font-mono text-slate-400">DATA PRIVACY & PROTECTION POLICY</span>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-black text-[#142B4A]">IMASA Privacy & Data Protection Notice</h1>
          <p className="text-slate-400 text-xs">Effective Academic Year 2026</p>
        </div>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-[#142B4A]">1. Scope & Purpose</h3>
          <p>
            The IMASA platform processes personal student information strictly for student identification, Madrasa attendance tracking, and hostel curfew verification. Data is never shared with third-party advertisers or unauthorized commercial entities.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-[#142B4A]">2. Student Photographs & Biometrics</h3>
          <p>
            Student photographs uploaded during registration are stored securely and rendered strictly within authenticated sessions. Photographs are accessible only to authorized Madrasa teachers for physical presence verification and hostel mistresses for identity checks at curfew entry points.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-[#142B4A]">3. QR Code Tokens & Anti-Cheating Data</h3>
          <p>
            Session QR codes contain cryptographic random hashes and session IDs only. They contain NO personal student information, preventing eavesdropping or data leakage during projection.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-[#142B4A]">4. Append-Only Audit Logs</h3>
          <p>
            Administrative actions, ID status changes (suspension, revocation, reinstatement), and hostel entry redemptions are recorded in append-only audit tables. These logs cannot be altered or purged by delegated administrators.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-sm text-[#142B4A]">5. Contact Data Protection Officer</h3>
          <p>
            For privacy inquiries or data correction requests, contact the Secretariat at privacy@imasa.org.
          </p>
        </section>
      </div>
    </div>
  );
}
