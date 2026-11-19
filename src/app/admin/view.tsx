"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSession } from "@/components/shell/session";
import { SessionList } from "@/components/teacher/session-list";
import { EmptyState, LoadingBlock, Notice, PageHeader, Panel, PanelHeader, Stat } from "@/components/ui";
import { useResource } from "@/lib/client";
import { can, isPresident } from "@/lib/permissions";
import { formatWhen, todayIso } from "@/lib/time";
import type { AuditLog, Session, SystemSettings } from "@/lib/types";
import type { AdminStats } from "@/lib/services/admin";

export default function AdminOverview() {
  const { actor, timezone } = useSession();
  const stats = useResource<{ stats: AdminStats }>("/api/admin/stats", { refreshMs: 30_000 });
  const sessions = useResource<{ sessions: Session[] }>(can(actor, "sessions.manage") ? `/api/sessions?date=${todayIso(timezone)}` : null);
  const audit = useResource<{ logs: AuditLog[] }>(can(actor, "audit.view") ? "/api/admin/audit-logs?limit=6" : null);
  const settings = useResource<{ settings: SystemSettings }>("/api/admin/settings");
  const s = stats.data?.stats;

  return (
    <>
      <PageHeader title="Overview" description={`Signed in as ${actor.fullName}.`} />
      {settings.data && !settings.data.settings.policies_approved && (
        <Notice tone="warn" className="mb-6" title="Policy settings not yet approved"
          action={isPresident(actor) ? <Link href="/admin/settings" className="text-sm font-medium underline">Review</Link> : undefined}>
          Pass expiry, late attendance and entry rules are still on their defaults. Management should confirm them before relying on the system.
        </Notice>
      )}
      {stats.error && <Notice tone="bad" className="mb-6">{stats.error}</Notice>}

      <h2 className="mb-3 text-sm font-medium text-ink-3">Today</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sessions" value={s?.todaySessions ?? "–"} />
        <Stat label="Check-ins" value={s?.todayAttendance ?? "–"} />
        <Stat label="Passes issued" value={s?.todayPassesIssued ?? "–"} tone="ok" />
        <Stat label="Hostel entries" value={s?.todayHostelEntries ?? "–"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {can(actor, "sessions.manage") && (
            <Panel>
              <PanelHeader title="Today's sessions" actions={<Link href="/admin/sessions" className="text-sm font-medium text-brand hover:underline">All sessions</Link>} />
              {sessions.loading ? <LoadingBlock rows={2} /> : (sessions.data?.sessions.length ?? 0) === 0 ? (
                <EmptyState title="No sessions today" />
              ) : (
                <SessionList sessions={sessions.data!.sessions} timezone={timezone} hrefFor={(session) => `/admin/sessions/${session.id}`} />
              )}
            </Panel>
          )}
          {can(actor, "audit.view") && (
            <Panel>
              <PanelHeader title="Recent activity" actions={<Link href="/admin/audit-logs" className="text-sm font-medium text-brand hover:underline">Audit log</Link>} />
              {audit.loading ? <LoadingBlock rows={3} /> : (
                <ul className="divide-y divide-line">
                  {(audit.data?.logs ?? []).map((log) => (
                    <li key={log.id} className="px-4 py-3 sm:px-5">
                      <p className="text-[15px] text-ink"><span className="font-medium">{log.actor_name ?? "System"}</span> · {log.action.replace(/[._]/g, " ")}</p>
                      <p className="mt-0.5 truncate text-sm text-ink-3">{formatWhen(log.created_at, timezone)}{log.reason ? ` · ${log.reason}` : ""}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Students" />
            <ul className="divide-y divide-line text-[15px]">
              {[
                { label: "Active", value: s?.activeStudents, href: "/admin/students?status=active" },
                { label: "Suspended", value: s?.suspendedStudents, href: "/admin/students?status=suspended" },
                { label: "Revoked", value: s?.revokedStudents, href: "/admin/students?status=revoked" },
                { label: "Check-ins waiting for a teacher", value: s?.pendingAttendance, href: "/admin/attendance" },
              ].map((row) => (
                <li key={row.label}>
                  <Link href={row.href} className="flex items-center justify-between px-4 py-3 hover:bg-canvas/70 sm:px-5">
                    <span className="text-ink-2">{row.label}</span>
                    <span className="flex items-center gap-2 font-semibold text-ink tabular-nums">{row.value ?? "–"}<ChevronRight className="size-4 text-ink-3" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader title="Staff" />
            <dl className="divide-y divide-line text-[15px]">
              {[
                { label: "Teachers", value: s?.totalTeachers },
                { label: "Hostels", value: s?.totalHostels },
                { label: "Hostel staff", value: s?.activeHostelStaff },
              ].map((row) => (
                <div key={row.label} className="flex justify-between px-4 py-3 sm:px-5">
                  <dt className="text-ink-2">{row.label}</dt>
                  <dd className="font-semibold text-ink tabular-nums">{row.value ?? "–"}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
