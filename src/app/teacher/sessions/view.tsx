"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useSession } from "@/components/shell/session";
import { SessionList } from "@/components/teacher/session-list";
import { EmptyState, LoadingBlock, Notice, PageHeader, Panel } from "@/components/ui";
import { useResource } from "@/lib/client";
import { cn } from "@/lib/cn";
import type { Session } from "@/lib/types";

export default function TeacherSessions() {
  const { timezone } = useSession();
  const { data, loading, error } = useResource<{ sessions: Session[] }>("/api/sessions");
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const all = data?.sessions ?? [];
  const upcoming = all.filter((session) => !["completed", "cancelled"].includes(session.session_status)).reverse();
  const past = all.filter((session) => !upcoming.includes(session));
  const rows = view === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHeader title="My sessions" description="Every session you're assigned to." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        <div role="tablist" className="flex gap-1 border-b border-line px-2 sm:px-3">
          {(["upcoming", "past"] as const).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn("-mb-px h-11 border-b-2 px-3 text-[15px] font-medium", view === key ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink")}
            >
              {key === "upcoming" ? "Current" : "Past"} <span className="text-ink-3 tabular-nums">({key === "upcoming" ? upcoming.length : past.length})</span>
            </button>
          ))}
        </div>
        {loading ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title={view === "upcoming" ? "Nothing scheduled" : "No past sessions"} />
        ) : (
          <SessionList sessions={rows} timezone={timezone} hrefFor={(session) => `/teacher/sessions/${session.id}`} />
        )}
      </Panel>
    </>
  );
}
