"use client";

import { useSession } from "@/components/shell/session";
import { DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel, Person, StatusBadge } from "@/components/ui";
import { useResource } from "@/lib/client";
import { formatWhen } from "@/lib/time";
import type { HostelEntryLog } from "@/lib/types";

type Row = HostelEntryLog & { photograph_url?: string | null };

export default function HostelHistoryPage() {
  const { timezone } = useSession();
  const { data, loading, error } = useResource<{ logs: Row[] }>("/api/hostel/logs?limit=200", { refreshMs: 30_000 });

  return (
    <>
      <PageHeader title="Entry log" description="Every entry, denial and emergency entry recorded at your hostel." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={data?.logs ?? []}
            rowKey={(row) => row.id}
            empty={<EmptyState title="Nothing recorded yet">Entries appear here when you admit or deny a student.</EmptyState>}
            columns={[
              {
                key: "student",
                header: "Student",
                primary: true,
                cell: (row) => (
                  <div className="flex items-center justify-between gap-3">
                    <Person name={row.student_name ?? "Student"} detail={row.registration_number} photo={row.photograph_url} />
                    <span className="md:hidden"><StatusBadge status={row.entry_status} /></span>
                  </div>
                ),
              },
              { key: "result", header: "Result", hideOnMobile: true, cell: (row) => <StatusBadge status={row.entry_status} /> },
              { key: "time", header: "Time", cell: (row) => <span className="tabular-nums">{formatWhen(row.verification_time, timezone)}</span> },
              { key: "by", header: "Recorded by", cell: (row) => row.verified_by_name ?? "—" },
              {
                key: "note",
                header: "Note",
                cell: (row) => (
                  <span className="text-ink-2">
                    {row.exception_reason ?? "—"}
                    {row.exception_approved_by ? ` (approved by ${row.exception_approved_by})` : ""}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
