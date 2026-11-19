import { CheckCircle2, Clock3, Ticket, XCircle } from "lucide-react";
import { formatDate, formatWhen } from "@/lib/time";
import { passState } from "@/lib/passes";
import { cn } from "@/lib/cn";
import type { DailyAuthorization, StudentStatus } from "@/lib/types";

const STATE = {
  valid: { title: "Pass valid", box: "border-ok/25 bg-ok-soft", text: "text-ok", Icon: CheckCircle2 },
  used: { title: "Pass used", box: "border-info/20 bg-info-soft", text: "text-info", Icon: Ticket },
  expired: { title: "Pass expired", box: "border-line bg-sunken", text: "text-ink-2", Icon: Clock3 },
  revoked: { title: "Pass revoked", box: "border-bad/20 bg-bad-soft", text: "text-bad", Icon: XCircle },
};

type PassCardProps = { pass: DailyAuthorization | null; timezone: string; studentStatus?: StudentStatus | string | null };

// The student's latest pass, or why there isn't one. Hostel staff always check live.
export const PassCard = ({ pass, timezone, studentStatus }: PassCardProps) => {
  if (studentStatus && studentStatus !== "active") {
    return (
      <div className="rounded-panel border border-bad/20 bg-bad-soft p-5">
        <p className="flex items-center gap-2 font-semibold text-bad"><XCircle className="size-5" /> Your ID is {studentStatus}</p>
        <p className="mt-1.5 text-[15px] text-ink-2">No pass can be used while your ID is {studentStatus}. Contact the IMASA administration.</p>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="rounded-panel border border-line bg-panel p-5">
        <p className="flex items-center gap-2 font-semibold text-ink"><Ticket className="size-5 text-ink-3" /> No pass yet</p>
        <p className="mt-1.5 text-[15px] text-ink-2">
          You get a pass after your teacher confirms your attendance and completes the session.
        </p>
      </div>
    );
  }

  const state = passState(pass);
  const { title, box, text, Icon } = STATE[state];
  return (
    <div className={cn("rounded-panel border p-5", box)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className={cn("flex items-center gap-2 text-lg font-semibold", text)}><Icon className="size-5" /> {title}</p>
        {state === "valid" && <p className="text-sm text-ink-2 tabular-nums">Until {formatWhen(pass.expires_at, timezone)}</p>}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
        <div><dt className="text-sm text-ink-3">Session</dt><dd className="text-ink">{pass.session_name} · {formatDate(pass.session_date, timezone)}</dd></div>
        <div><dt className="text-sm text-ink-3">Confirmed by</dt><dd className="text-ink">{pass.teacher_name || "—"}</dd></div>
        <div><dt className="text-sm text-ink-3">Hostel</dt><dd className="text-ink">{pass.hostel_name || "—"}</dd></div>
        <div>
          <dt className="text-sm text-ink-3">{state === "used" ? "Used at" : "Expires"}</dt>
          <dd className="text-ink tabular-nums">{formatWhen(state === "used" ? pass.used_at : pass.expires_at, timezone)}</dd>
        </div>
      </dl>
      {state === "valid" && (
        <p className="mt-3 text-sm text-ink-2">Show this screen, or give your name, at the hostel. Staff will check it live and compare your photo.</p>
      )}
    </div>
  );
};
