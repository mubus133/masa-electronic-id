"use client";

import { useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, ConfirmDialog, Details, Field, Input, Notice, Photo, StatusBadge } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { formatDate, formatWhen } from "@/lib/time";
import type { VerificationResult } from "@/lib/types";

type Props = { result: VerificationResult; timezone: string; onRecorded: () => void; onNext: () => void };

export const Verdict = ({ result, timezone, onRecorded, onNext }: Props) => {
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<"deny" | "exception" | null>(null);
  const [approvedBy, setApprovedBy] = useState("");
  const [recorded, setRecorded] = useState<string | null>(null);
  const { student, authorization } = result;

  const admit = async () => {
    if (!authorization) return;
    setBusy(true);
    try {
      await api(`/api/authorizations/${authorization.id}/redeem`, { method: "POST" });
      setRecorded("Entry recorded.");
      toast.success(`${student.fullName} admitted`);
      onRecorded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't record entry.");
      onRecorded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-panel">
      <div className={cn("flex items-start gap-3 px-5 py-4", result.valid ? "bg-ok text-white" : "bg-bad-soft text-bad")} role="status" aria-live="polite">
        {result.valid ? <CheckCircle2 className="mt-0.5 size-7 shrink-0" /> : <XCircle className="mt-0.5 size-7 shrink-0" />}
        <div className="min-w-0">
          <p className="text-xl font-semibold">{result.valid ? "Valid pass: may enter" : `Do not admit: ${result.headline.toLowerCase()}`}</p>
          <p className={cn("mt-0.5 text-[15px]", result.valid ? "text-white/90" : "text-ink-2")}>{result.reason}</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <Photo src={student.photographUrl} name={student.fullName} size="xl" className="size-36 sm:size-40" />
          <p className="text-xs text-ink-3">Check this is the person in front of you.</p>
        </div>
        <div className="min-w-0">
          <p className="text-xl font-semibold text-ink">{student.fullName}</p>
          <p className="font-mono text-ink-2">{student.registrationNumber}</p>
          <div className="mt-2"><StatusBadge status={student.status} /></div>
          <Details
            className="mt-3"
            items={[
              { label: "Hostel", value: student.hostelName ?? "Not assigned" },
              { label: "Session", value: authorization ? `${authorization.sessionName} · ${formatDate(authorization.sessionDate, timezone)}` : "—" },
              { label: "Confirmed by", value: authorization?.teacherName ?? "—" },
              { label: "Pass expires", value: authorization ? formatWhen(authorization.expiresAt, timezone) : "—" },
              ...(authorization?.usedAt ? [{ label: "Used at", value: formatWhen(authorization.usedAt, timezone) }] : []),
            ]}
          />
        </div>
      </div>

      <div className="border-t border-line px-5 py-4">
        {recorded ? (
          <Notice tone="ok" action={<Button onClick={onNext}>Next student</Button>}>{recorded}</Notice>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {result.valid && <Button size="lg" onClick={admit} busy={busy} className="sm:min-w-48"><CheckCircle2 className="size-5" /> Admit</Button>}
            <Button size="lg" variant="secondary" onClick={() => setDialog("deny")} className="text-bad">Record denial</Button>
            {!result.valid && (
              <Button size="lg" variant="ghost" onClick={() => setDialog("exception")}><ShieldAlert className="size-5" /> Emergency entry…</Button>
            )}
            <Button size="lg" variant="ghost" onClick={onNext} className="sm:ml-auto">Search again</Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dialog === "deny"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Deny entry to ${student.fullName}?`}
        description="This is recorded in the entry log."
        confirmLabel="Record denial"
        danger
        reasonLabel="Reason"
        onConfirm={async (reason) => {
          await api("/api/hostel/exception", { body: { studentId: student.id, decision: "denied", reason } });
          setRecorded("Denial recorded.");
          onRecorded();
        }}
      />
      <ConfirmDialog
        open={dialog === "exception"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
          if (open) setApprovedBy("");
        }}
        title="Emergency entry"
        description="Use only under IMASA's emergency procedure. This is logged separately and is not a pass."
        confirmLabel="Record emergency entry"
        reasonLabel="What happened"
        onConfirm={async (reason) => {
          if (!approvedBy.trim()) throw new Error("Enter who approved this entry.");
          await api("/api/hostel/exception", { body: { studentId: student.id, decision: "exception", reason, approvedBy } });
          setRecorded("Emergency entry recorded.");
          onRecorded();
        }}
      >
        <Field label="Approved by" hint="Name of the person who authorised it.">
          {(props) => <Input {...props} value={approvedBy} onChange={(event) => setApprovedBy(event.target.value)} />}
        </Field>
      </ConfirmDialog>
    </div>
  );
};
