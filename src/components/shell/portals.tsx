"use client";

// Navigation for each signed-in area. Kept client-side because items carry icons and permission checks.

import {
  BarChart3, Building2, CalendarCheck, CalendarDays, CircleHelp, Globe, GraduationCap, History, IdCard, Inbox, LayoutGrid, QrCode, ScanSearch, ScrollText, Settings, ShieldCheck, Ticket, Users,
} from "lucide-react";
import { AppShell, type NavItem } from "./app-shell";
import { can, isPresident, type Actor } from "@/lib/permissions";

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/student/id", label: "My ID", icon: IdCard },
  { href: "/student/scan", label: "Check in", icon: QrCode },
  { href: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/student/authorizations", label: "Hostel passes", icon: Ticket },
  { href: "/student/support", label: "Report a problem", icon: CircleHelp },
];

export const StudentPortal = ({ children }: { children: React.ReactNode }) => (
  <AppShell items={STUDENT_NAV} area="Student">{children}</AppShell>
);

const TEACHER_NAV: NavItem[] = [
  { href: "/teacher", label: "Today", icon: LayoutGrid, exact: true },
  { href: "/teacher/sessions", label: "My sessions", icon: CalendarDays },
];

export const TeacherPortal = ({ children }: { children: React.ReactNode }) => (
  <AppShell items={TEACHER_NAV} area="Teacher">{children}</AppShell>
);

const HOSTEL_NAV: NavItem[] = [
  { href: "/hostel", label: "Verify a student", icon: ScanSearch, exact: true },
  { href: "/hostel/history", label: "Entry log", icon: History },
];

export const HostelPortal = ({ children }: { children: React.ReactNode }) => (
  <AppShell items={HOSTEL_NAV} area="Hostel desk">{children}</AppShell>
);

const any = (...keys: string[]) => (actor: Actor) => keys.some((key) => can(actor, key));

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/students", label: "Students", icon: GraduationCap, show: any("students.register", "students.edit", "students.suspend", "students.revoke", "students.reinstate") },
  { href: "/admin/teachers", label: "Teachers", icon: Users, show: any("teachers.manage") },
  { href: "/admin/hostels", label: "Hostels", icon: Building2, show: any("hostels.manage") },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays, show: any("sessions.manage") },
  { href: "/admin/attendance", label: "Attendance", icon: CalendarCheck, show: any("attendance.view") },
  { href: "/admin/authorizations", label: "Hostel passes", icon: Ticket, show: any("authorizations.view") },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, show: any("reports.view") },
  { href: "/admin/support", label: "Support requests", icon: Inbox, show: any("reports.view") },
  { href: "/admin/audit-logs", label: "Audit log", icon: ScrollText, show: any("audit.view") },
  { href: "/admin/website", label: "Website", icon: Globe, show: any("website.edit") },
  { href: "/admin/administrators", label: "Administrators", icon: ShieldCheck, show: isPresident },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const AdminPortal = ({ children }: { children: React.ReactNode }) => (
  <AppShell items={ADMIN_NAV} area="Administration">{children}</AppShell>
);
