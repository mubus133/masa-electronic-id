"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useSession } from "@/components/shell/session";
import { Button, Dialog, EmptyState, Input, LoadingBlock, Notice, PageHeader, Panel } from "@/components/ui";
import { useResource } from "@/lib/client";
import { formatWhen } from "@/lib/time";
import type { AuditLog } from "@/lib/types";

const PAGE_SIZE = 50;

const Json = ({ value }: { value: unknown }) =>
  value ? <pre className="max-h-64 overflow-auto rounded-control bg-sunken p-3 text-xs leading-relaxed text-ink-2">{JSON.stringify(value, null, 2)}</pre> : <p className="text-sm text-ink-3">—</p>;

export default function AuditLogPage() {
  const { timezone } = useSession();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<AuditLog | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
  if (debounced) params.set("search", debounced);
  const { data, loading, error } = useResource<{ logs: AuditLog[]; total: number }>(`/api/admin/audit-logs?${params}`);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Audit log" description="Every sensitive action, newest first. Entries can't be edited or deleted." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        <div className="border-b border-line p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by action, reason or person" className="pl-9" aria-label="Search audit log" />
          </div>
        </div>
        {loading && !data ? <LoadingBlock /> : (data?.logs.length ?? 0) === 0 ? <EmptyState title="Nothing found" /> : (
          <ul className="divide-y divide-line">
            {data!.logs.map((log) => (
              <li key={log.id}>
                <button onClick={() => setOpen(log)} className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-canvas/70 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <span className="text-sm text-ink-3 tabular-nums sm:w-44 sm:shrink-0">{formatWhen(log.created_at, timezone)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-ink">{log.action.replace(/[._]/g, " ")}</span>
                    <span className="text-ink-2"> · {log.actor_name ?? "System"}</span>
                    {log.reason && <span className="block truncate text-sm text-ink-3">{log.reason}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
            <p className="text-sm text-ink-3 tabular-nums">Page {page + 1} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Panel>

      <Dialog open={Boolean(open)} onOpenChange={(value) => !value && setOpen(null)} wide title={open?.action.replace(/[._]/g, " ") ?? ""}>
        {open && (
          <div className="space-y-4 text-[15px]">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div><dt className="text-sm text-ink-3">When</dt><dd className="text-ink">{formatWhen(open.created_at, timezone)}</dd></div>
              <div><dt className="text-sm text-ink-3">Who</dt><dd className="text-ink">{open.actor_name ?? "System"} <span className="text-ink-3">({open.actor_role})</span></dd></div>
              <div><dt className="text-sm text-ink-3">Record</dt><dd className="break-all text-ink">{open.affected_record_type} {open.affected_record_id ?? ""}</dd></div>
              <div><dt className="text-sm text-ink-3">Reference</dt><dd className="font-mono text-xs break-all text-ink-2">{open.request_reference}</dd></div>
            </dl>
            <div><p className="mb-1 text-sm text-ink-3">Reason</p><p className="text-ink">{open.reason ?? "—"}</p></div>
            <div><p className="mb-1 text-sm text-ink-3">Before</p><Json value={open.previous_value} /></div>
            <div><p className="mb-1 text-sm text-ink-3">After</p><Json value={open.new_value} /></div>
          </div>
        )}
      </Dialog>
    </>
  );
}
