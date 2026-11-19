"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/shell/session";
import { Button, Field, Input, LoadingBlock, Notice, PageHeader, Panel, PanelBody, PanelHeader, Select, Toggle } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { isPresident } from "@/lib/permissions";
import type { SystemSettings } from "@/lib/types";

export default function SettingsPage() {
  const { actor, refresh } = useSession();
  const { data, loading, error, reload } = useResource<{ settings: SystemSettings }>("/api/admin/settings");
  const [edits, setEdits] = useState<SystemSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = isPresident(actor);
  const draft = edits ?? data?.settings ?? null;

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => setEdits((current) => {
    const base = current ?? data?.settings;
    return base ? { ...base, [key]: value } : null;
  });
  const dirty = Boolean(edits && data && JSON.stringify(edits) !== JSON.stringify(data.settings));

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await api("/api/admin/settings", { method: "PATCH", body: draft });
      await reload();
      setEdits(null);
      toast.success("Settings saved");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const number = (key: keyof SystemSettings, label: string, hint: string, unit: string) => (
    <Field label={label} hint={hint}>
      {(props) => (
        <div className="flex items-center gap-2">
          <Input {...props} type="number" inputMode="numeric" className="w-28" disabled={!editable} value={String(draft?.[key] ?? "")} onChange={(event) => set(key, Number(event.target.value) as never)} />
          <span className="text-sm text-ink-3">{unit}</span>
        </div>
      )}
    </Field>
  );

  return (
    <>
      <PageHeader
        title="Settings"
        description="The rules the system follows. These are management decisions; changes are recorded in the audit log."
        actions={editable && <Button onClick={save} busy={busy} disabled={!dirty}>Save changes</Button>}
      />
      {!editable && <Notice className="mb-6">Only the President can change these settings.</Notice>}
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      {loading || !draft ? <Panel><LoadingBlock /></Panel> : (
        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Check-in" />
            <PanelBody className="grid gap-6 sm:grid-cols-2">
              <Field label="Timezone" hint="All times are shown and scheduled in this timezone.">
                {(props) => <Input {...props} disabled={!editable} value={draft.timezone} onChange={(event) => set("timezone", event.target.value)} />}
              </Field>
              {number("attendance_open_minutes_before", "Check-in opens", "How early before the start time a teacher may open check-in.", "minutes before")}
              {number("qr_ttl_seconds", "Code changes every", "Shorter is safer against shared photos of the code. 60–180 seconds works well.", "seconds")}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Who gets a pass" />
            <PanelBody className="divide-y divide-line py-1">
              <Toggle label="Teachers can mark students late" checked={draft.late_attendance_allowed} onChange={(value) => set("late_attendance_allowed", value)} disabled={!editable} />
              <Toggle label="Late students get a pass" checked={draft.late_receives_pass} onChange={(value) => set("late_receives_pass", value)} disabled={!editable} />
              <Toggle label="Excused students get a pass" checked={draft.excused_receives_pass} onChange={(value) => set("excused_receives_pass", value)} disabled={!editable} />
              <Toggle label="Only students with a hostel get a pass" description="Students with no hostel assigned are skipped when passes are issued." checked={draft.require_hostel_assignment} onChange={(value) => set("require_hostel_assignment", value)} disabled={!editable} />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Passes and entry" />
            <PanelBody className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Pass expires">
                  {(props) => (
                    <Select {...props} disabled={!editable} value={draft.pass_expiry_mode} onChange={(event) => set("pass_expiry_mode", event.target.value as SystemSettings["pass_expiry_mode"])}>
                      <option value="end_of_day">At midnight on the session day</option>
                      <option value="hours_after_completion">A number of hours after completion</option>
                    </Select>
                  )}
                </Field>
                {draft.pass_expiry_mode === "hours_after_completion" && number("pass_expiry_hours", "Hours", "Counted from when the teacher completes the session.", "hours")}
              </div>
              <div className="divide-y divide-line border-t border-line">
                <Toggle label="One-time entry" description="A pass can be used once. Turn off to allow re-entry on the same pass until it expires." checked={draft.one_time_entry} onChange={(value) => set("one_time_entry", value)} disabled={!editable} />
                <Toggle label="Allow emergency entry" description="Hostel staff can log an emergency entry, with the name of whoever approved it." checked={draft.emergency_exceptions_enabled} onChange={(value) => set("emergency_exceptions_enabled", value)} disabled={!editable} />
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Approval" />
            <PanelBody className="py-1">
              <Toggle
                label="Management has approved these settings"
                description="Clears the reminder on the overview page. Keep it off until the policy decisions are signed off."
                checked={draft.policies_approved}
                onChange={(value) => set("policies_approved", value)}
                disabled={!editable}
              />
            </PanelBody>
          </Panel>

          {editable && (
            <div className="flex justify-end">
              <Button onClick={save} busy={busy} disabled={!dirty} className="w-full sm:w-auto">Save changes</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
