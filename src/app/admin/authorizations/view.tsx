"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/shell/session";
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, LoadingBlock, Notice, PageHeader, Panel, Person, Select } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { passState } from "@/lib/passes";
import { can } from "@/lib/permissions";
import { formatDate, formatWhen } from "@/lib/time";
import type { DailyAuthorization } from "@/lib/types";

type Row = DailyAuthorization & { student_name: string; registration_number: string; photograph_url: string | null };

const TONE = { valid: "ok", used: "info", expired: "neutral", revoked: "bad" } as const;
const LABEL = { valid: "Valid", used: "Used", expired: "Expired", revoked: "Revoked" } as const;

export default function AdminPassesPage() {
  const { actor, timezone } = useSession();
  const { data, loading, error, reload } = useResource<{ authorizations: Row[] }>("/api/authorizations", { refreshMs: 30_000 });
  const [state, setState] = useState("");
  const [revoking, setRevoking] = useState<Row | null>(null);
  const rows = (data?.authorizations ?? []).filter((row) => !state || passState(row) === state);

  return (
    <>
      <PageHeader title="Hostel passes" description="Passes are issued automatically when a session is completed. Revoking one stops it working at the hostel straight away." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        <div className="flex justify-end border-b border-line p-4 sm:p-5">
          <Select value={state} onChange={(event) => setState(event.target.value)} className="sm:w-48" aria-label="Filter by status">
            <option value="">All passes</option>
            <option value="valid">Valid</option>
            <option value="used">Used</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </Select>
        </div>
        {loading ? <LoadingBlock /> : (
          <DataTable
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No passes" />}
            columns={[
              {
                key: "student", header: "Student", primary: true,
                cell: (row) => (
                  <div className="flex items-center justify-between gap-3">
                    <Person name={row.student_name} detail={row.registration_number} photo={row.photograph_url} />
                    <span className="md:hidden"><Badge tone={TONE[passState(row)]}>{LABEL[passState(row)]}</Badge></span>
                  </div>
                ),
              },
              { key: "session", header: "Session", cell: (row) => <span>{row.session_name} <span className="text-ink-3">· {formatDate(row.session_date, timezone)}</span></span> },
              { key: "hostel", header: "Hostel", cell: (row) => row.hostel_name ?? "—" },
              { key: "status", header: "Status", hideOnMobile: true, cell: (row) => <Badge tone={TONE[passState(row)]}>{LABEL[passState(row)]}</Badge> },
              { key: "expires", header: "Expires", cell: (row) => <span className="tabular-nums">{formatWhen(row.expires_at, timezone)}</span> },
              { key: "used", header: "Used", cell: (row) => <span className="tabular-nums">{row.used_at ? formatWhen(row.used_at, timezone) : "—"}</span> },
            ]}
            actions={can(actor, "authorizations.revoke") ? (row) => passState(row) === "valid" ? <Button size="sm" variant="secondary" className="text-bad" onClick={() => setRevoking(row)}>Revoke</Button> : null : undefined}
          />
        )}
      </Panel>
      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={`Revoke ${revoking?.student_name ?? ""}'s pass?`}
        description="Hostel staff will see it as revoked immediately."
        confirmLabel="Revoke pass"
        danger
        reasonLabel="Reason"
        onConfirm={async (reason) => {
          if (!revoking) return;
          await api(`/api/authorizations/${revoking.id}/revoke`, { body: { reason } });
          toast.success("Pass revoked");
          void reload();
        }}
      />
    </>
  );
}
