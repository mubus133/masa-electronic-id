"use client";

import { useCallback, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Scanner } from "@/components/student/scanner";
import { useSession } from "@/components/shell/session";
import { Button, ButtonLink, Notice, PageHeader, Panel, PanelBody } from "@/components/ui";
import { api } from "@/lib/client";

export default function StudentScanPage() {
  const { actor } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useCallback(async (body: { qrPayload?: string; code?: string }) => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/attendance/scan", { body });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onPayload = useCallback((qrPayload: string) => void submit({ qrPayload }), [submit]);
  const onCode = useCallback((code: string) => void submit({ code }), [submit]);

  if (actor.studentStatus && actor.studentStatus !== "active") {
    return (
      <>
        <PageHeader title="Check in" />
        <Notice tone="bad" title={`Your ID is ${actor.studentStatus}`}>You can&apos;t check in while your ID is {actor.studentStatus}. Contact the IMASA administration.</Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Check in" description="Scan the code on your teacher's screen when you arrive." />
      <Panel className="mx-auto max-w-xl">
        <PanelBody className="sm:p-6">
          {done ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto size-12 text-ok" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-ink">You&apos;re checked in</h2>
              <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">
                Your teacher still has to confirm you&apos;re in the room. Once she completes the session, your pass will
                appear in your account.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                <ButtonLink href="/student">Back to overview</ButtonLink>
                <Button variant="secondary" onClick={() => setDone(false)}>Scan again</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {error && <Notice tone="bad">{error}</Notice>}
              <Scanner onPayload={onPayload} onCode={onCode} busy={busy} />
            </div>
          )}
        </PanelBody>
      </Panel>
    </>
  );
}
