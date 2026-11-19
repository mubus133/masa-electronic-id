"use client";

import { useState } from "react";
import { useSession } from "@/components/shell/session";
import { Badge, DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel, Person, Select, StatusBadge } from "@/components/ui";
import { useResource } from "@/lib/client";
import { formatDate, formatWhen } from "@/lib/time";
import type { Attendance } from "@/lib/types";

type Row = Attendance & { session_date?: string };

export default function AdminAttendancePage() {
  const { timezone } = useSession();
  const { data, loading, error } = useResource<{ attendance: Row[] }>("/api/attendance", { refreshMs: 30_000 });
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const rows = (data?.attendance ?? []).filter((row) => (!status || row.attendance_status === status) && (!method || row.check_in_method === method));

  return (
    <>
      <PageHeader title="Attendance" description="The latest 200 check-ins across all sessions." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        <div className="grid gap-3 border-b border-line p-4 sm:flex sm:justify-end sm:p-5">
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-48" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="pending">Waiting for teacher</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select value={method} onChange={(event) => setMethod(event.target.value)} className="sm:w-48" aria-label="Filter by method">
            <option value="">Any method</option>
            <option value="qr">QR scan</option>
            <option value="manual">Manual</option>
          </Select>
        </div>
        {loading ? <LoadingBlock /> : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No attendance matches" />}
            columns={[
              {
                key: "student", header: "Student", primary: true,
                cell: (row) => (
                  <div className="flex items-center justify-between gap-3">
                    <Person name={row.student_name ?? "Student"} detail={row.registration_number} photo={row.photograph_url} />
                    <span className="md:hidden"><StatusBadge status={row.attendance_status} /></span>
                  </div>
                ),
              },
              { key: "session", header: "Session", cell: (row) => <span>{row.session_name} <span className="text-ink-3">· {formatDate(row.session_date, timezone)}</span></span> },
              { key: "status", header: "Status", hideOnMobile: true, cell: (row) => <StatusBadge status={row.attendance_status} /> },
              { key: "method", header: "Method", cell: (row) => <Badge tone={row.check_in_method === "manual" ? "brand" : "neutral"}>{row.check_in_method === "manual" ? "Manual" : "QR scan"}</Badge> },
              { key: "time", header: "Checked in", cell: (row) => <span className="tabular-nums">{formatWhen(row.check_in_at, timezone)}</span> },
              { key: "by", header: "Confirmed by", cell: (row) => row.teacher_name ?? "—" },
              { key: "note", header: "Note", cell: (row) => <span className="text-ink-2">{row.manual_reason || row.rejection_reason || "—"}</span> },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
