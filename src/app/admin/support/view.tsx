"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/shell/session";
import { Badge, Button, ConfirmDialog, EmptyState, LoadingBlock, Notice, PageHeader, Panel, Select, StatusBadge } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { formatWhen } from "@/lib/time";
import type { SupportRequest } from "@/lib/types";

const CATEGORY = { dispute: "Attendance or pass", account: "Account", technical: "Not working", other: "Other" } as const;

export default function SupportRequestsPage() {
  const { timezone } = useSession();
  const [status, setStatus] = useState("open");
  const { data, loading, error, reload } = useResource<{ requests: SupportRequest[] }>(`/api/support${status ? `?status=${status}` : ""}`);
  const [resolving, setResolving] = useState<SupportRequest | null>(null);
  const rows = data?.requests ?? [];

  return (
    <>
      <PageHeader
        title="Support requests"
        description="Problems and attendance disputes sent from the website and student accounts. Correct records from Sessions; corrections are audited."
        actions={
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-40" aria-label="Filter">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="">All</option>
          </Select>
        }
      />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? <LoadingBlock /> : rows.length === 0 ? (
          <EmptyState title={status === "open" ? "Nothing waiting" : "No requests"} />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((request) => (
              <li key={request.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{request.subject}</p>
                      <Badge tone={request.category === "dispute" ? "warn" : "neutral"}>{CATEGORY[request.category]}</Badge>
                      {request.status !== "open" && <StatusBadge status={request.status === "closed" ? "completed" : request.status} />}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-3">
                      {request.user_name ? `${request.user_name} · ${request.user_email}` : "Sent from the website"} · {formatWhen(request.created_at, timezone)}
                    </p>
                  </div>
                  {request.status === "open" && <Button size="sm" variant="secondary" onClick={() => setResolving(request)}>Mark resolved</Button>}
                </div>
                <p className="mt-2 text-[15px] whitespace-pre-line text-ink-2">{request.message}</p>
                {request.resolution && <p className="mt-2 rounded-control bg-sunken px-3 py-2 text-sm text-ink-2">Resolution: {request.resolution}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <ConfirmDialog
        open={Boolean(resolving)}
        onOpenChange={(open) => !open && setResolving(null)}
        title="Mark as resolved"
        description={resolving?.subject}
        confirmLabel="Mark resolved"
        reasonLabel="What was done"
        onConfirm={async (resolution) => {
          if (!resolving) return;
          await api("/api/support", { body: { action: "resolve", id: resolving.id, resolution } });
          toast.success("Marked resolved");
          void reload();
        }}
      />
    </>
  );
}
