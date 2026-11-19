"use client";

import { CalendarDays } from "lucide-react";
import { useSession } from "@/components/shell/session";
import { SessionList } from "@/components/teacher/session-list";
import { ButtonLink, EmptyState, LoadingBlock, Notice, PageHeader, Panel, PanelHeader } from "@/components/ui";
import { useResource } from "@/lib/client";
import { todayIso } from "@/lib/time";
import type { Session } from "@/lib/types";

export default function TeacherToday() {
  const { actor, timezone } = useSession();
  const { data, loading, error } = useResource<{ sessions: Session[] }>("/api/sessions", { refreshMs: 30_000 });
  const today = todayIso(timezone);
  const sessions = data?.sessions ?? [];
  const live = sessions.filter((session) => session.session_status === "open" || session.session_status === "closed");
  const todays = sessions.filter((session) => session.session_date === today && !live.includes(session));
  const upcoming = sessions.filter((session) => session.session_date > today && session.session_status === "scheduled").reverse().slice(0, 5);

  return (
    <>
      <PageHeader title={`Salaam, ${actor.fullName.replace(/^Ustazah\s+/i, "").split(" ")[0]}`} description="Your sessions for today and the days ahead." />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      {loading ? (
        <Panel><LoadingBlock /></Panel>
      ) : (
        <div className="space-y-6">
          {live.length > 0 && (
            <Panel className="border-info/30">
              <PanelHeader title="In progress" description="Check-in is open or waiting to be completed." />
              <SessionList sessions={live} timezone={timezone} hrefFor={(session) => `/teacher/sessions/${session.id}`} />
            </Panel>
          )}
          <Panel>
            <PanelHeader title="Today" />
            {todays.length === 0 ? (
              <EmptyState icon={<CalendarDays />} title="No sessions today">Sessions assigned to you by the administration appear here.</EmptyState>
            ) : (
              <SessionList sessions={todays} timezone={timezone} hrefFor={(session) => `/teacher/sessions/${session.id}`} />
            )}
          </Panel>
          {upcoming.length > 0 && (
            <Panel>
              <PanelHeader title="Coming up" actions={<ButtonLink href="/teacher/sessions" variant="ghost" size="sm">All sessions</ButtonLink>} />
              <SessionList sessions={upcoming} timezone={timezone} hrefFor={(session) => `/teacher/sessions/${session.id}`} />
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
