import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#142B4A] text-slate-300 border-t border-[#1E3A5F] py-8 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-[#0F766E] flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-wider text-base">IMASA</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Electronic Student Identification, Madrasa Attendance, and Daily Hostel Entry Authorization System.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wide uppercase text-[11px] text-[#C8A45D]">
              Core Principle
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>Permanent ID ≠ Daily Authorization.</strong> Possession of an electronic ID does not authorize curfew entry without teacher-confirmed Madrasa attendance and session completion.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wide uppercase text-[11px] text-[#C8A45D]">
              Portals
            </h4>
            <ul className="space-y-1.5">
              <li><Link href="/login" className="hover:text-white transition-colors">Student Electronic ID Portal</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Madrasa Teacher Attendance</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Hostel Mistress Verification</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">President & Administrative Office</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wide uppercase text-[11px] text-[#C8A45D]">
              Support & Inquiries
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed mb-2">
              For technical issues, lost credentials, or attendance disputes, contact the IMASA Secretariat.
            </p>
            <Link href="/contact" className="text-[#14B8A6] hover:underline font-medium">
              Technical Support & Inquiries &rarr;
            </Link>
          </div>
        </div>

        <div className="border-t border-[#1E3A5F] pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-3">
          <p>&copy; {new Date().getFullYear()} IMASA. All rights reserved. Authorized organizational use only.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/about" className="hover:text-white">About IMASA</Link>
            <Link href="/contact" className="hover:text-white">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
