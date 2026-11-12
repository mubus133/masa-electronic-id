"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  Menu,
  X,
  LogOut,
  User,
  QrCode,
  IdCard,
  CheckCircle2,
  Building2,
  Calendar,
  Users,
  FileText,
  Settings,
  Search,
} from "lucide-react";
import type { Actor } from "@/lib/permissions";

export function Navbar() {
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.actor) {
          setActor(data.actor);
        } else {
          setActor(null);
        }
      })
      .catch(() => setActor(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setActor(null);
    router.push("/login");
    router.refresh();
  };

  // Nav links based on role
  const getNavLinks = () => {
    if (!actor) {
      return [
        { href: "/", label: "Home" },
        { href: "/about", label: "About IMASA" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/login", label: "Login Portal" },
      ];
    }

    if (actor.role === "student") {
      return [
        { href: "/student", label: "Dashboard", icon: User },
        { href: "/student/id", label: "Electronic ID", icon: IdCard },
        { href: "/student/scan", label: "Scan QR", icon: QrCode },
        { href: "/student/attendance", label: "My Attendance", icon: CheckCircle2 },
        { href: "/student/authorizations", label: "Hostel Passes", icon: Shield },
      ];
    }

    if (actor.role === "teacher") {
      return [
        { href: "/teacher", label: "Teacher Dashboard", icon: Calendar },
        { href: "/teacher/sessions", label: "Sessions & QR", icon: QrCode },
        { href: "/teacher/reports", label: "Class Reports", icon: FileText },
      ];
    }

    if (actor.role === "hostel_staff") {
      return [
        { href: "/hostel", label: "Hostel Verification", icon: Search },
        { href: "/hostel/history", label: "Verification Logs", icon: FileText },
        { href: "/hostel/exception", label: "Log Exception", icon: Shield },
      ];
    }

    // super_admin & administrator
    return [
      { href: "/admin", label: "Overview", icon: Shield },
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/teachers", label: "Teachers", icon: User },
      { href: "/admin/hostels", label: "Hostels", icon: Building2 },
      { href: "/admin/sessions", label: "Sessions", icon: Calendar },
      { href: "/admin/attendance", label: "Attendance", icon: CheckCircle2 },
      { href: "/admin/authorizations", label: "Passes", icon: IdCard },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-[#142B4A] text-white shadow-md border-b border-[#1E3A5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0F766E] border border-[#14B8A6]/40 flex items-center justify-center shadow-inner">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-wider text-white">IMASA</span>
                <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-[#C8A45D]/20 text-[#DFCA97] font-semibold border border-[#C8A45D]/40">
                  ID & Pass
                </span>
              </div>
              <p className="text-[10px] text-slate-300 hidden sm:block">Madrasa Attendance & Hostel Authorization</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.slice(0, 7).map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#0F766E] text-white"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User profile / Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {actor ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white leading-tight">{actor.fullName}</div>
                  <div className="text-[10px] text-[#C8A45D] font-medium capitalize">
                    {actor.role.replace("_", " ")}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-[#0F766E] hover:bg-[#0B5C55] text-xs font-semibold text-white transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-slate-200 hover:text-white hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0D1E35] border-b border-[#1E3A5F] px-4 pt-2 pb-4 space-y-1">
          {actor && (
            <div className="px-3 py-2 border-b border-white/10 mb-2">
              <div className="font-semibold text-sm text-white">{actor.fullName}</div>
              <div className="text-xs text-[#C8A45D] capitalize">{actor.role.replace("_", " ")}</div>
            </div>
          )}

          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  active ? "bg-[#0F766E] text-white" : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {actor ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 rounded-md mt-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block text-center mt-2 px-3 py-2 bg-[#0F766E] text-white rounded-md text-sm font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
