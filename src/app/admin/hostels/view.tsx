"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { AccountActions } from "@/components/admin/account-actions";
import { TempPasswordDialog } from "@/components/admin/temp-password";
import { Button, DataTable, Dialog, EmptyState, Field, Input, LoadingBlock, Notice, PageHeader, Panel, PanelHeader, Person, Select, StatusBadge } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { Hostel, HostelStaff } from "@/lib/types";

type Staff = HostelStaff & { email: string };

export default function AdminHostelsPage() {
  const hostels = useResource<{ hostels: Hostel[] }>("/api/hostels");
  const staff = useResource<{ staff: Staff[] }>("/api/hostels/staff");
  const [dialog, setDialog] = useState<"hostel" | "staff" | null>(null);
  const [hostelForm, setHostelForm] = useState({ hostelName: "", hostelLocation: "" });
  const [staffForm, setStaffForm] = useState({ fullName: "", email: "", hostelId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ password: string; login: string; name: string } | null>(null);
  const hostelList = hostels.data?.hostels ?? [];

  const run = async (event: FormEvent, action: () => Promise<void>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await action();
      setDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  const openDialog = (kind: "hostel" | "staff") => {
    setError(null);
    if (kind === "staff") setStaffForm({ fullName: "", email: "", hostelId: hostelList[0]?.id ?? "" });
    else setHostelForm({ hostelName: "", hostelLocation: "" });
    setDialog(kind);
  };

  return (
    <>
      <PageHeader title="Hostels" description="Hostel staff can only search and admit students assigned to their own hostel." />
      {(hostels.error || staff.error) && <Notice tone="bad" className="mb-6">{hostels.error ?? staff.error}</Notice>}

      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Hostels" actions={<Button size="sm" onClick={() => openDialog("hostel")}><Plus className="size-4" /> Add hostel</Button>} />
          {hostels.loading ? <LoadingBlock rows={2} /> : (
            <DataTable
              rows={hostelList}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No hostels yet" />}
              columns={[
                { key: "name", header: "Hostel", primary: true, cell: (row) => <div><p className="font-medium text-ink">{row.hostel_name}</p><p className="text-sm text-ink-3">{row.hostel_location ?? ""}</p></div> },
                { key: "students", header: "Active students", cell: (row) => <span className="tabular-nums">{row.active_student_count ?? 0}</span> },
                { key: "staff", header: "Staff", cell: (row) => <span className="tabular-nums">{(staff.data?.staff ?? []).filter((member) => member.hostel_id === row.id && member.staff_status === "active").length}</span> },
                { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.hostel_status} /> },
              ]}
            />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Hostel staff" actions={<Button size="sm" onClick={() => openDialog("staff")} disabled={!hostelList.length}><Plus className="size-4" /> Add staff</Button>} />
          {staff.loading ? <LoadingBlock rows={2} /> : (
            <DataTable
              rows={staff.data?.staff ?? []}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No hostel staff yet" />}
              columns={[
                { key: "name", header: "Name", primary: true, cell: (row) => <Person name={row.full_name} detail={row.email} /> },
                { key: "hostel", header: "Hostel", cell: (row) => row.hostel_name ?? "—" },
                { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.staff_status} /> },
              ]}
              actions={(row) => <AccountActions userId={row.user_id} name={row.full_name} login={row.email} active={row.staff_status === "active"} onChange={() => void staff.reload()} />}
            />
          )}
        </Panel>
      </div>

      <Dialog
        open={dialog === "hostel"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Add a hostel"
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="hostel-form" busy={busy}>Add hostel</Button></>}
      >
        <form id="hostel-form" className="space-y-5" onSubmit={(event) => run(event, async () => {
          await api("/api/hostels", { body: hostelForm });
          void hostels.reload();
        })}>
          {error && <Notice tone="bad">{error}</Notice>}
          <Field label="Name">{(props) => <Input {...props} value={hostelForm.hostelName} onChange={(event) => setHostelForm({ ...hostelForm, hostelName: event.target.value })} required />}</Field>
          <Field label="Location" optional>{(props) => <Input {...props} value={hostelForm.hostelLocation} onChange={(event) => setHostelForm({ ...hostelForm, hostelLocation: event.target.value })} />}</Field>
        </form>
      </Dialog>

      <Dialog
        open={dialog === "staff"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Add hostel staff"
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="staff-form" busy={busy}>Add staff</Button></>}
      >
        <form id="staff-form" className="space-y-5" onSubmit={(event) => run(event, async () => {
          const result = await api<{ staff: Staff & { temporary_password: string } }>("/api/hostels/staff", { body: staffForm });
          setCreated({ password: result.staff.temporary_password, login: staffForm.email, name: staffForm.fullName });
          void staff.reload();
        })}>
          {error && <Notice tone="bad">{error}</Notice>}
          <Field label="Full name">{(props) => <Input {...props} value={staffForm.fullName} onChange={(event) => setStaffForm({ ...staffForm, fullName: event.target.value })} required />}</Field>
          <Field label="Email" hint="She signs in with this.">{(props) => <Input {...props} type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} required />}</Field>
          <Field label="Hostel">
            {(props) => (
              <Select {...props} value={staffForm.hostelId} onChange={(event) => setStaffForm({ ...staffForm, hostelId: event.target.value })} required>
                {hostelList.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.hostel_name}</option>)}
              </Select>
            )}
          </Field>
        </form>
      </Dialog>
      <TempPasswordDialog value={created} name={created?.name ?? ""} onClose={() => setCreated(null)} />
    </>
  );
}
