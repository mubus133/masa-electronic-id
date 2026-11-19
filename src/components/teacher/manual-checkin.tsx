"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button, Dialog, EmptyState, Field, Input, Notice, Person, Select, StatusBadge, Textarea } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import type { Student } from "@/lib/types";

const REASONS = ["Phone battery died", "No phone with her", "Camera not working", "Couldn't sign in"];

type Props = { open: boolean; onOpenChange: (open: boolean) => void; sessionId: string; onDone: () => void };

// No-phone procedure: find the student, compare the photo, record why.
export const ManualCheckIn = (props: Props) => <ManualCheckInBody key={props.open ? "open" : "closed"} {...props} />;

const ManualCheckInBody = ({ open, onOpenChange, sessionId, onDone }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const term = query.trim();
  const shownResults = term.length < 2 ? [] : results;

  useEffect(() => {
    if (term.length < 2) return;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ students: Student[] }>(`/api/students?search=${encodeURIComponent(term)}&limit=8`);
        setResults(data.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const fullReason = note.trim() ? `${reason}. ${note.trim()}` : reason;
      await api("/api/attendance/manual", { body: { sessionId, studentId: selected.id, reason: fullReason } });
      onDone();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't record that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      wide
      title="Check in a student by hand"
      description="For a student in front of you who can't scan. Compare her face with the photo before you confirm."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} busy={busy} disabled={!selected || selected.student_status !== "active"}>Confirm she is present</Button>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Notice tone="bad">{error}</Notice>}
        {!selected ? (
          <>
            <Field label="Name or registration number">
              {(props) => (
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
                  <Input {...props} value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" autoFocus autoComplete="off" />
                </div>
              )}
            </Field>
            {term.length >= 2 && !searching && shownResults.length === 0 ? (
              <EmptyState title="No students found" className="py-6">Check the spelling, or try the registration number.</EmptyState>
            ) : (
              <ul className="divide-y divide-line rounded-control border border-line empty:hidden">
                {shownResults.map((student) => (
                  <li key={student.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(student)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-sunken"
                    >
                      <Person name={student.full_name} detail={`${student.registration_number} · ${student.class_group ?? "No class"}`} photo={student.photograph_url} />
                      <StatusBadge status={student.student_status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 rounded-panel border border-line p-4 sm:flex-row sm:items-start">
              {/* eslint-disable-next-line @next/next/no-img-element -- student photo */}
              {selected.photograph_url && <img src={selected.photograph_url} alt={`Photo of ${selected.full_name}`} className="size-32 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-lg font-semibold text-ink">{selected.full_name}</p>
                <p className="font-mono text-ink-2">{selected.registration_number}</p>
                <p className="text-sm text-ink-3">{selected.hostel_name ?? "No hostel"} · {selected.class_group ?? "No class"}</p>
                <div className="mt-2"><StatusBadge status={selected.student_status} /></div>
                <button type="button" onClick={() => setSelected(null)} className={cn("mt-3 text-sm font-medium text-brand hover:underline")}>Choose someone else</button>
              </div>
            </div>
            {selected.student_status !== "active" ? (
              <Notice tone="bad">This student&apos;s ID is {selected.student_status}. She can&apos;t be checked in.</Notice>
            ) : (
              <>
                <Field label="Why couldn't she scan?">
                  {(props) => (
                    <Select {...props} value={reason} onChange={(event) => setReason(event.target.value)}>
                      {REASONS.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Note" optional>
                  {(props) => <Textarea {...props} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />}
                </Field>
              </>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
};
