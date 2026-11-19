import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { sessionWhen } from "./session-time";
import type { Session } from "@/lib/types";

export const SessionList = ({ sessions, timezone, hrefFor }: { sessions: Session[]; timezone: string; hrefFor: (session: Session) => string }) => (
  <ul className="divide-y divide-line">
    {sessions.map((session) => (
      <li key={session.id}>
        <Link href={hrefFor(session)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas/70 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{session.session_name}</p>
            <p className="text-sm text-ink-3 tabular-nums">{sessionWhen(session, timezone)}{session.class_group ? ` · ${session.class_group}` : ""}</p>
          </div>
          <div className="hidden text-right text-sm text-ink-3 tabular-nums sm:block">{session.attendance_count ?? 0} checked in</div>
          <StatusBadge status={session.session_status} />
          <ChevronRight className="size-4 shrink-0 text-ink-3" />
        </Link>
      </li>
    ))}
  </ul>
);
