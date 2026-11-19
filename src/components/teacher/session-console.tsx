"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, CheckCircle2, DoorClosed, DoorOpen, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AttendanceReview } from "./attendance-review";
import { ManualCheckIn } from "./manual-checkin";
import { QrPanel } from "./qr-panel";
import { sessionWhen } from "./session-time";
import { useSession } from "@/components/shell/session";
import { Button, ConfirmDialog, LoadingBlock, Notice, Panel, PanelBody, PanelHeader, Stat, StatusBadge } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { can } from "@/lib/permissions";
import type { Attendance, Session } from "@/lib/types";

type Props = { sessionId: string; backHref: string; backLabel: string };

export const SessionConsole = ({ sessionId, backHref, backLabel }: Props) => {
  const { actor, timezone } = useSession();
  const session = useResource<{ session: Session }>(`/api/sessions/${sessionId}`);
  const status = session.data?.session.session_status;
  const live = status === "open" || status === "closed";
  const attendance = useResource<{ attendance: Attendance[] }>(`/api/attendance?sessionId=${sessionId}`, { refreshMs: live ? 5000 : undefined });
  const [manualOpen, setManualOpen] = useState(false);
  const [confirm, setConfirm] = useState<"complete" | "cancel" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reloadAll = useCallback(() => {
    void session.reload();
    void attendance.reload();
  }, [session, attendance]);

  const reloadSession = session.reload;
  const onQrOpened = useCallback(() => {
    if (status === "scheduled") void reloadSession();
  }, [status, reloadSession]);

  const transition = async (action: "open" | "close", message: string) => {
    setBusy(action);
    try {
      await api(`/api/sessions/${sessionId}/${action}`, { method: "POST" });
      toast.success(message);
      reloadAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  };

  if (session.loading) return <Panel><LoadingBlock rows={6} /></Panel>;
  if (session.error || !session.data) return <Notice tone="bad" title="Couldn't open this session">{session.error}</Notice>;

  const current = session.data.session;
  const records = attendance.data?.attendance ?? [];
  const count = (predicate: (record: Attendance) => boolean) => records.filter(predicate).length;
  const pending = count((record) => record.attendance_status === "pending");
  const confirmed = count((record) => ["present", "late", "excused"].includes(record.attendance_status));
  const editable = live;
  const teachers = current.teachers?.map((teacher) => teacher.full_name).join(", ");

  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{current.session_name}</h1>
            <StatusBadge status={current.session_status} />
          </div>
          <p className="mt-1.5 text-[15px] text-ink-2 tabular-nums">
            {sessionWhen(current, timezone)}
            {current.class_group ? ` · ${current.class_group}` : ""}
          </p>
          {teachers && <p className="mt-0.5 text-sm text-ink-3">Teacher: {teachers}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {(status === "scheduled" || status === "closed") && (
            <Button onClick={() => transition("open", "Check-in is open")} busy={busy === "open"}><DoorOpen className="size-4" /> {status === "closed" ? "Reopen check-in" : "Open check-in"}</Button>
          )}
          {status === "open" && (
            <Button variant="secondary" onClick={() => transition("close", "Check-in closed")} busy={busy === "close"}><DoorClosed className="size-4" /> Close check-in</Button>
          )}
          {live && (
            <Button variant="secondary" onClick={() => setManualOpen(true)}><UserPlus className="size-4" /> Check in by hand</Button>
          )}
          {live && (
            <Button onClick={() => setConfirm("complete")} disabled={pending > 0} title={pending > 0 ? "Review waiting check-ins first" : undefined}>
              <CheckCircle2 className="size-4" /> Complete session
            </Button>
          )}
          {can(actor, "sessions.manage") && ["scheduled", "open", "closed"].includes(current.session_status) && (
            <Button variant="ghost" className="text-bad" onClick={() => setConfirm("cancel")}>Cancel session</Button>
          )}
        </div>
      </header>

      {current.session_status === "completed" && (
        <Notice tone="ok" className="mb-6" title="Session completed">Passes were issued to every student confirmed present. Attendance can no longer be changed here.</Notice>
      )}
      {current.session_status === "cancelled" && <Notice tone="bad" className="mb-6" title="Session cancelled">No passes will be issued for this session.</Notice>}
      {live && pending > 0 && (
        <Notice tone="warn" className="mb-6">{pending} check-in{pending === 1 ? " is" : "s are"} waiting for you. Confirm or reject each one before completing the session.</Notice>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Waiting" value={pending} tone={pending ? "warn" : "default"} />
        <Stat label="Confirmed" value={confirmed} tone="ok" />
        <Stat label="Rejected" value={count((record) => record.attendance_status === "rejected")} />
      </div>

      {status === "open" && (
        <Panel className="mb-6">
          <PanelHeader title="Check-in code" description="Put this on the screen. Students scan it or type the code." />
          <PanelBody className="sm:p-6"><QrPanel sessionId={sessionId} onOpened={onQrOpened} /></PanelBody>
        </Panel>
      )}
      {status === "scheduled" && (
        <Notice className="mb-6" title="Check-in isn't open yet">Open check-in when students start arriving. It can open up to 30 minutes before the start time, depending on settings.</Notice>
      )}

      <Panel>
        <PanelHeader title="Students" description={live ? "Updates every few seconds." : undefined} />
        {attendance.loading ? <LoadingBlock /> : <AttendanceReview records={records} timezone={timezone} editable={editable} onChange={() => void attendance.reload()} />}
      </Panel>

      <ManualCheckIn open={manualOpen} onOpenChange={setManualOpen} sessionId={sessionId} onDone={() => { toast.success("Checked in"); void attendance.reload(); }} />

      <ConfirmDialog
        open={confirm === "complete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Complete this session?"
        description={`${confirmed} student${confirmed === 1 ? "" : "s"} will get a pass for tonight. You can't change attendance afterwards.`}
        confirmLabel="Complete and issue passes"
        onConfirm={async () => {
          const result = await api<{ issuedCount: number }>(`/api/sessions/${sessionId}/complete`, { method: "POST" });
          toast.success(`Session completed. ${result.issuedCount} pass${result.issuedCount === 1 ? "" : "es"} issued.`);
          reloadAll();
        }}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Cancel this session?"
        description="Check-in stops and no passes will be issued."
        confirmLabel="Cancel session"
        danger
        reasonLabel="Reason"
        onConfirm={async (reason) => {
          await api(`/api/sessions/${sessionId}/cancel`, { body: { reason } });
          toast.success("Session cancelled");
          reloadAll();
        }}
      />
    </>
  );
};
