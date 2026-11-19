"use client";

import { usePasses } from "@/components/student/use-student";
import { useSession } from "@/components/shell/session";
import { Badge, DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel } from "@/components/ui";
import { passState } from "@/lib/passes";
import { formatDate, formatWhen } from "@/lib/time";

const TONE = { valid: "ok", used: "info", expired: "neutral", revoked: "bad" } as const;
const LABEL = { valid: "Valid", used: "Used", expired: "Expired", revoked: "Revoked" } as const;

export default function StudentPassesPage() {
  const { timezone } = useSession();
  const { data, loading, error } = usePasses();
  const rows = data?.authorizations ?? [];

  return (
    <>
      <PageHeader title="Hostel passes" description="One pass per completed session you attended. Each pass works for that night only." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No passes yet">You get a pass when your teacher confirms you and completes the session.</EmptyState>}
            columns={[
              {
                key: "session",
                header: "Session",
                primary: true,
                cell: (row) => {
                  const state = passState(row);
                  return (
                    <div className="flex items-start justify-between gap-3 md:block">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{row.session_name}</p>
                        <p className="text-sm text-ink-3">{formatDate(row.session_date, timezone)}</p>
                      </div>
                      <span className="md:hidden"><Badge tone={TONE[state]}>{LABEL[state]}</Badge></span>
                    </div>
                  );
                },
              },
              { key: "status", header: "Status", hideOnMobile: true, cell: (row) => { const state = passState(row); return <Badge tone={TONE[state]}>{LABEL[state]}</Badge>; } },
              { key: "teacher", header: "Confirmed by", cell: (row) => row.teacher_name || "—" },
              { key: "hostel", header: "Hostel", cell: (row) => row.hostel_name || "—" },
              { key: "expires", header: "Expires", cell: (row) => <span className="tabular-nums">{formatWhen(row.expires_at, timezone)}</span> },
              { key: "used", header: "Used", cell: (row) => <span className="tabular-nums">{row.used_at ? formatWhen(row.used_at, timezone) : "—"}</span> },
            ]}
          />
        )}
      </Panel>
    </>
  );
}
