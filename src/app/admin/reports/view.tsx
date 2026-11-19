"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useSession } from "@/components/shell/session";
import { DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel, PanelHeader, Select, StatusBadge, buttonClass } from "@/components/ui";
import { useResource } from "@/lib/client";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import type { HostelReportRow, SessionReportRow } from "@/lib/services/admin";

const EXPORTS = [
  { type: "attendance", label: "Attendance" },
  { type: "passes", label: "Passes" },
  { type: "entries", label: "Hostel entries" },
  { type: "students", label: "Students" },
  { type: "audit", label: "Audit log", permission: "audit.view" },
];

const num = (value: number) => <span className="tabular-nums">{value}</span>;

export default function ReportsPage() {
  const { actor, timezone } = useSession();
  const [days, setDays] = useState("30");
  const { data, loading, error } = useResource<{ sessions: SessionReportRow[]; hostels: HostelReportRow[] }>(`/api/admin/reports?days=${days}`);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Attendance, passes and hostel entries over a period."
        actions={
          <Select value={days} onChange={(event) => setDays(event.target.value)} className="sm:w-44" aria-label="Period">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </Select>
        }
      />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Sessions" description="Counts per session. Passes used shows one-time entries redeemed." />
          {loading ? <LoadingBlock /> : (
            <DataTable
              rows={data?.sessions ?? []}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No sessions in this period" />}
              columns={[
                {
                  key: "session", header: "Session", primary: true,
                  cell: (row) => (
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium text-ink">{row.session_name}</p><p className="text-sm text-ink-3">{formatDate(row.session_date, timezone)}</p></div>
                      <span className="md:hidden"><StatusBadge status={row.session_status} /></span>
                    </div>
                  ),
                },
                { key: "status", header: "Status", hideOnMobile: true, cell: (row) => <StatusBadge status={row.session_status} /> },
                { key: "present", header: "Present", className: "text-right", cell: (row) => num(row.present) },
                { key: "late", header: "Late", className: "text-right", cell: (row) => num(row.late) },
                { key: "pending", header: "Waiting", className: "text-right", cell: (row) => num(row.pending) },
                { key: "rejected", header: "Rejected", className: "text-right", cell: (row) => num(row.rejected) },
                { key: "manual", header: "Manual", className: "text-right", cell: (row) => num(row.manual) },
                { key: "passes", header: "Passes", className: "text-right", cell: (row) => num(row.passes) },
                { key: "used", header: "Used", className: "text-right", cell: (row) => num(row.used) },
              ]}
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Hostel desk" description="Emergency entries are counted separately from normal entries." />
          {loading ? <LoadingBlock rows={2} /> : (
            <DataTable
              rows={data?.hostels ?? []}
              rowKey={(row) => row.hostel_name}
              empty={<EmptyState title="No hostels" />}
              columns={[
                { key: "hostel", header: "Hostel", primary: true, cell: (row) => <span className="font-medium">{row.hostel_name}</span> },
                { key: "admitted", header: "Admitted", className: "text-right", cell: (row) => num(row.admitted) },
                { key: "denied", header: "Denied", className: "text-right", cell: (row) => num(row.denied) },
                { key: "exceptions", header: "Emergency entries", className: "text-right", cell: (row) => num(row.exceptions) },
              ]}
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Download CSV" description="Opens in Excel or Google Sheets. Contains personal data, so store it carefully." />
          <div className="flex flex-wrap gap-2 p-4 sm:p-5">
            {EXPORTS.filter((item) => !item.permission || can(actor, item.permission)).map((item) => (
              <a key={item.type} href={`/api/admin/export?type=${item.type}`} className={buttonClass("secondary", "md")} download>
                <Download className="size-4" /> {item.label}
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
