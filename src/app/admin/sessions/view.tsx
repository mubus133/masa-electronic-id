"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/shell/session";
import { SessionList } from "@/components/teacher/session-list";
import { Button, Dialog, EmptyState, Field, Input, LoadingBlock, Notice, PageHeader, Panel, Select } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { cn } from "@/lib/cn";
import { parseZonedDateTime, todayIso, weekdayName } from "@/lib/time";
import type { Session, Teacher } from "@/lib/types";

const blankForm = (date: string) => ({ sessionName: "", sessionDate: date, start: "18:30", end: "20:30", classGroup: "", teacherIds: [] as string[] });

export default function AdminSessionsPage() {
  const { timezone } = useSession();
  const today = todayIso(timezone);
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => blankForm(today));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessions = useResource<{ sessions: Session[] }>(`/api/sessions${status ? `?status=${status}` : ""}`);
  const teachers = useResource<{ teachers: Teacher[] }>("/api/teachers");
  const activeTeachers = (teachers.data?.teachers ?? []).filter((teacher) => teacher.account_status === "active");
  const rows = sessions.data?.sessions ?? [];
  const upcoming = rows.filter((session) => session.session_date >= today).reverse();
  const past = rows.filter((session) => session.session_date < today);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!form.teacherIds.length) throw new Error("Assign at least one teacher.");
      await api("/api/sessions", {
        body: {
          sessionName: form.sessionName,
          sessionDate: form.sessionDate,
          startsAt: parseZonedDateTime(`${form.sessionDate}T${form.start}`, timezone).toISOString(),
          endsAt: parseZonedDateTime(`${form.sessionDate}T${form.end}`, timezone).toISOString(),
          classGroup: form.classGroup,
          teacherIds: form.teacherIds,
        },
      });
      toast.success("Session scheduled");
      setOpen(false);
      void sessions.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't schedule the session.");
    } finally {
      setBusy(false);
    }
  };

  const weekday = /^\d{4}-\d{2}-\d{2}$/.test(form.sessionDate) ? weekdayName(form.sessionDate, timezone) : "";
  const offDay = weekday && !["Friday", "Saturday", "Sunday"].includes(weekday);

  return (
    <>
      <PageHeader
        title="Sessions"
        description={`Times are in ${timezone.replace("_", " ")} time. Set each date's times by hand, since Maghrib moves through the year.`}
        actions={<Button onClick={() => { setForm(blankForm(today)); setError(null); setOpen(true); }}><Plus className="size-4" /> Schedule session</Button>}
      />
      {sessions.error && <Notice tone="bad" className="mb-6">{sessions.error}</Notice>}
      <div className="mb-4 flex justify-end">
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="sm:w-56" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="open">Check-in open</option>
          <option value="closed">Check-in closed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {sessions.loading ? <Panel><LoadingBlock /></Panel> : rows.length === 0 ? (
        <Panel><EmptyState icon={<CalendarDays />} title="No sessions" action={<Button onClick={() => setOpen(true)}>Schedule session</Button>} /></Panel>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Panel>
              <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-ink-3 sm:px-5">Today and upcoming</h2>
              <SessionList sessions={upcoming} timezone={timezone} hrefFor={(session) => `/admin/sessions/${session.id}`} />
            </Panel>
          )}
          {past.length > 0 && (
            <Panel>
              <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-ink-3 sm:px-5">Past</h2>
              <SessionList sessions={past} timezone={timezone} hrefFor={(session) => `/admin/sessions/${session.id}`} />
            </Panel>
          )}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        wide
        title="Schedule a session"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="session-form" busy={busy}>Schedule</Button></>}
      >
        <form id="session-form" onSubmit={submit} className="space-y-5">
          {error && <Notice tone="bad">{error}</Notice>}
          <Field label="Name">{(props) => <Input {...props} value={form.sessionName} onChange={(event) => setForm({ ...form, sessionName: event.target.value })} placeholder="e.g. Friday Maghrib class" required />}</Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Date" hint={weekday ? (offDay ? `${weekday}: not a usual Madrasa day` : weekday) : undefined}>
              {(props) => <Input {...props} type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} required />}
            </Field>
            <Field label="Starts">{(props) => <Input {...props} type="time" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} required />}</Field>
            <Field label="Ends">{(props) => <Input {...props} type="time" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} required />}</Field>
          </div>
          <Field label="Class group" optional>{(props) => <Input {...props} value={form.classGroup} onChange={(event) => setForm({ ...form, classGroup: event.target.value })} placeholder="e.g. Group A" />}</Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Teachers</legend>
            {activeTeachers.length === 0 ? <p className="text-sm text-ink-3">Add a teacher first.</p> : (
              <div className="flex flex-wrap gap-2">
                {activeTeachers.map((teacher) => {
                  const chosen = form.teacherIds.includes(teacher.id);
                  return (
                    <button
                      key={teacher.id}
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => setForm({ ...form, teacherIds: chosen ? form.teacherIds.filter((id) => id !== teacher.id) : [...form.teacherIds, teacher.id] })}
                      className={cn("h-10 rounded-full border px-4 text-sm font-medium transition-colors", chosen ? "border-brand bg-brand-soft text-brand-ink" : "border-line-strong text-ink-2 hover:bg-sunken")}
                    >
                      {teacher.full_name}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        </form>
      </Dialog>
    </>
  );
}
