"use client";

import { useAttendance } from "@/components/student/use-student";
import { useSession } from "@/components/shell/session";
import { Badge, DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { formatDate, formatWhen } from "@/lib/time";
import type { Attendance } from "@/lib/types";

type Row = Attendance & { session_date?: string };

export default function StudentAttendancePage() {
  const { timezone } = useSession();
  const { data, loading, error } = useAttendance();
  const rows = (data?.attendance ?? []) as Row[];

  return (
    <>
      <PageHeader title="Attendance" description="Every session you've checked in to. If something is wrong, use Report a problem." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No attendance yet">Check in at your next session and it will show here.</EmptyState>}
            columns={[
              {
                key: "session",
                header: "Session",
                primary: true,
                cell: (row) => (
                  <div className="flex items-start justify-between gap-3 md:block">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{row.session_name}</p>
                      <p className="text-sm text-ink-3">{formatDate(row.session_date, timezone)}</p>
                    </div>
                    <span className="md:hidden"><StatusBadge status={row.attendance_status} /></span>
                  </div>
                ),
              },
              { key: "status", header: "Status", hideOnMobile: true, cell: (row) => <StatusBadge status={row.attendance_status} /> },
              { key: "method", header: "Check-in", cell: (row) => <Badge tone={row.check_in_method === "manual" ? "brand" : "neutral"}>{row.check_in_method === "manual" ? "By teacher" : "QR scan"}</Badge> },
              { key: "time", header: "Time", cell: (row) => <span className="tabular-nums">{formatWhen(row.check_in_at, timezone)}</span> },
              { key: "by", header: "Confirmed by", cell: (row) => row.teacher_name || (row.attendance_status === "pending" ? "Waiting" : "—") },
              { key: "note", header: "Note", cell: (row) => <span className="text-ink-2">{row.rejection_reason || "—"}</span> },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
