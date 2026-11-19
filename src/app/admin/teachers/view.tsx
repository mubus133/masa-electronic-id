"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { AccountActions } from "@/components/admin/account-actions";
import { TempPasswordDialog } from "@/components/admin/temp-password";
import { Button, DataTable, Dialog, EmptyState, Field, Input, LoadingBlock, Notice, PageHeader, Panel, Person, StatusBadge } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { Teacher } from "@/lib/types";

type Row = Teacher & { email: string };

export default function AdminTeachersPage() {
  const { data, loading, error, reload } = useResource<{ teachers: Row[] }>("/api/teachers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", assignedClass: "" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ password: string; login: string; name: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const result = await api<{ teacher: Row & { temporary_password: string } }>("/api/teachers", { body: form });
      setOpen(false);
      setCreated({ password: result.teacher.temporary_password, login: form.email, name: form.fullName });
      setForm({ fullName: "", email: "", assignedClass: "" });
      void reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't add the teacher.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Teachers" description="Teachers run sessions they're assigned to: they show the check-in code, confirm attendance and complete the session." actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add teacher</Button>} />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? <LoadingBlock /> : (
          <DataTable
            rows={data?.teachers ?? []}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No teachers yet" action={<Button onClick={() => setOpen(true)}>Add teacher</Button>} />}
            columns={[
              { key: "name", header: "Teacher", primary: true, cell: (row) => <Person name={row.full_name} detail={row.email} /> },
              { key: "code", header: "Code", cell: (row) => <span className="font-mono">{row.teacher_code}</span> },
              { key: "class", header: "Usual class", cell: (row) => row.assigned_class ?? "—" },
              { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.account_status} /> },
            ]}
            actions={(row) => <AccountActions userId={row.user_id} name={row.full_name} login={row.email} active={row.account_status === "active"} onChange={() => void reload()} />}
          />
        )}
      </Panel>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Add a teacher"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="teacher-form" busy={busy}>Add teacher</Button></>}
      >
        <form id="teacher-form" onSubmit={submit} className="space-y-5">
          {formError && <Notice tone="bad">{formError}</Notice>}
          <Field label="Full name">{(props) => <Input {...props} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />}</Field>
          <Field label="Email" hint="She signs in with this.">{(props) => <Input {...props} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />}</Field>
          <Field label="Usual class" optional>{(props) => <Input {...props} value={form.assignedClass} onChange={(event) => setForm({ ...form, assignedClass: event.target.value })} placeholder="e.g. Group A" />}</Field>
        </form>
      </Dialog>
      <TempPasswordDialog value={created} name={created?.name ?? ""} onClose={() => setCreated(null)} />
    </>
  );
}
