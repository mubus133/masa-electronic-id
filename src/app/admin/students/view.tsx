"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { StudentForm, emptyStudent, fromStudent, type StudentFormValues } from "@/components/admin/student-form";
import { TempPasswordDialog } from "@/components/admin/temp-password";
import { useSession } from "@/components/shell/session";
import {
  Button, ConfirmDialog, DataTable, Details, Dialog, EmptyState, Input, LoadingBlock, Notice, PageHeader, Panel, Person, Photo, Select, StatusBadge,
} from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { can } from "@/lib/permissions";
import { formatDate, formatWhen } from "@/lib/time";
import type { Attendance, Hostel, Student } from "@/lib/types";

const PAGE_SIZE = 25;
type StatusAction = "suspend" | "revoke" | "reinstate";

const ACTION_COPY: Record<StatusAction, { title: string; body: string; label: string; danger: boolean }> = {
  suspend: { title: "Suspend this ID?", body: "Her current pass stops working straight away and she can't check in or get new passes until reinstated.", label: "Suspend ID", danger: true },
  revoke: { title: "Revoke this ID permanently?", body: "Her passes stop working straight away. The ID stays revoked until the President reinstates it.", label: "Revoke ID", danger: true },
  reinstate: { title: "Reinstate this ID?", body: "She will be able to check in and receive passes again.", label: "Reinstate ID", danger: false },
};

const toBody = (values: StudentFormValues) => ({
  fullName: values.fullName,
  email: values.email,
  hostelId: values.hostelId || null,
  classGroup: values.classGroup,
  phone: values.phone,
  emergencyContact: values.emergencyContact,
  photographUrl: values.photographUrl,
});

export default function AdminStudentsPage() {
  const { actor, timezone } = useSession();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  // The portal renders only on the client (after the session loads), so window is available here.
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get("status") ?? "");
  const [hostelId, setHostelId] = useState("");
  const [page, setPage] = useState(0);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [tempPassword, setTempPassword] = useState<{ password: string; login: string; name: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
  if (debounced) params.set("search", debounced);
  if (status) params.set("status", status);
  if (hostelId) params.set("hostelId", hostelId);
  const list = useResource<{ students: Student[]; total: number }>(`/api/students?${params}`);
  const hostels = useResource<{ hostels: Hostel[] }>("/api/hostels");
  const hostelList = hostels.data?.hostels ?? [];

  const selected = list.data?.students.find((student) => student.id === openId) ?? null;
  const history = useResource<{ attendance: Attendance[] }>(openId && can(actor, "attendance.view") ? `/api/attendance?studentId=${openId}` : null);
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPassword = async (student: Student) => {
    try {
      const result = await api<{ temporaryPassword: string }>(`/api/users/${student.user_id}/password`, { method: "POST" });
      setTempPassword({ password: result.temporaryPassword, login: student.email ?? student.registration_number, name: student.full_name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset the password.");
    }
  };

  return (
    <>
      <PageHeader
        title="Students"
        description={list.data ? `${total} student${total === 1 ? "" : "s"}` : undefined}
        actions={can(actor, "students.register") && <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Register student</Button>}
      />

      <Panel>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[1fr_auto_auto] sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, registration number or email" className="pl-9" aria-label="Search students" />
          </div>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </Select>
          <Select value={hostelId} onChange={(event) => { setHostelId(event.target.value); setPage(0); }} aria-label="Filter by hostel">
            <option value="">All hostels</option>
            {hostelList.map((hostel) => <option key={hostel.id} value={hostel.id}>{hostel.hostel_name}</option>)}
          </Select>
        </div>

        {list.error && <Notice tone="bad" className="m-4">{list.error}</Notice>}
        {list.loading && !list.data ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={list.data?.students ?? []}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No students match">Try a different search or filter.</EmptyState>}
            columns={[
              {
                key: "student",
                header: "Student",
                primary: true,
                cell: (row) => (
                  <button onClick={() => { setOpenId(row.id); setEditing(false); }} className="flex w-full items-center justify-between gap-3 text-left">
                    <Person name={row.full_name} detail={row.registration_number} photo={row.photograph_url} />
                    <span className="md:hidden"><StatusBadge status={row.student_status} /></span>
                  </button>
                ),
              },
              { key: "hostel", header: "Hostel", cell: (row) => row.hostel_name ?? "Not assigned" },
              { key: "class", header: "Class", cell: (row) => row.class_group ?? "—" },
              { key: "status", header: "Status", hideOnMobile: true, cell: (row) => <StatusBadge status={row.student_status} /> },
            ]}
            actions={(row) => <Button size="sm" variant="secondary" onClick={() => { setOpenId(row.id); setEditing(false); }}>Open</Button>}
          />
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
            <p className="text-sm text-ink-3 tabular-nums">Page {page + 1} of {pages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Panel>

      <Dialog open={creating} onOpenChange={setCreating} wide title="Register a student" description="She gets a registration number and a temporary password.">
        <StudentForm
          initial={emptyStudent()}
          hostels={hostelList}
          withEmail
          submitLabel="Register"
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            const result = await api<{ student: Student & { temporary_password: string } }>("/api/students", { body: toBody(values) });
            setCreating(false);
            setTempPassword({ password: result.student.temporary_password, login: values.email, name: result.student.full_name });
            toast.success(`Registered as ${result.student.registration_number}`);
            void list.reload();
          }}
        />
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setOpenId(null)} wide title={editing ? "Edit student" : selected?.full_name ?? "Student"}>
        {selected && (editing ? (
          <StudentForm
            initial={fromStudent(selected)}
            hostels={hostelList}
            withEmail={false}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              await api(`/api/students/${selected.id}`, {
                method: "PATCH",
                body: {
                  full_name: values.fullName,
                  hostel_id: values.hostelId || null,
                  class_group: values.classGroup,
                  phone: values.phone,
                  emergency_contact: values.emergencyContact,
                  photograph_url: values.photographUrl,
                },
              });
              toast.success("Saved");
              setEditing(false);
              void list.reload();
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Photo src={selected.photograph_url} name={selected.full_name} size="xl" />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="font-mono text-ink-2">{selected.registration_number}</p>
                <div className="mt-2"><StatusBadge status={selected.student_status} /></div>
                {selected.status_reason && selected.student_status !== "active" && (
                  <p className="mt-2 text-sm text-ink-2">Reason: {selected.status_reason}</p>
                )}
              </div>
            </div>
            <Details
              items={[
                { label: "Email", value: selected.email ?? "—" },
                { label: "Hostel", value: selected.hostel_name ?? "Not assigned" },
                { label: "Class", value: selected.class_group ?? "—" },
                { label: "Phone", value: selected.phone || "—" },
                { label: "Emergency contact", value: selected.emergency_contact || "—" },
                { label: "Registered", value: formatDate(selected.date_registered, timezone) },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {can(actor, "students.edit") && <Button variant="secondary" onClick={() => setEditing(true)}>Edit details</Button>}
              {can(actor, "students.edit") && <Button variant="secondary" onClick={() => resetPassword(selected)}><KeyRound className="size-4" /> Reset password</Button>}
              {selected.student_status === "active" && can(actor, "students.suspend") && <Button variant="secondary" className="text-warn" onClick={() => setStatusAction("suspend")}>Suspend</Button>}
              {selected.student_status !== "revoked" && can(actor, "students.revoke") && <Button variant="secondary" className="text-bad" onClick={() => setStatusAction("revoke")}>Revoke</Button>}
              {selected.student_status !== "active" && can(actor, "students.reinstate") && <Button onClick={() => setStatusAction("reinstate")}>Reinstate</Button>}
            </div>
            {can(actor, "attendance.view") && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-ink-3">Recent attendance</h3>
                {history.loading ? <LoadingBlock rows={2} /> : (history.data?.attendance.length ?? 0) === 0 ? (
                  <p className="text-sm text-ink-3">No attendance yet.</p>
                ) : (
                  <ul className="divide-y divide-line rounded-control border border-line">
                    {history.data!.attendance.slice(0, 8).map((record) => (
                      <li key={record.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] text-ink">{record.session_name}</p>
                          <p className="text-sm text-ink-3 tabular-nums">{formatWhen(record.check_in_at, timezone)}</p>
                        </div>
                        <StatusBadge status={record.attendance_status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </Dialog>

      {statusAction && selected && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setStatusAction(null)}
          title={ACTION_COPY[statusAction].title}
          description={`${selected.full_name}. ${ACTION_COPY[statusAction].body}`}
          confirmLabel={ACTION_COPY[statusAction].label}
          danger={ACTION_COPY[statusAction].danger}
          reasonLabel="Reason"
          onConfirm={async (reason) => {
            await api(`/api/students/${selected.id}/${statusAction}`, { body: { reason } });
            toast.success(statusAction === "reinstate" ? "ID reinstated" : statusAction === "suspend" ? "ID suspended" : "ID revoked");
            void list.reload();
          }}
        />
      )}

      <TempPasswordDialog value={tempPassword} name={tempPassword?.name ?? ""} onClose={() => setTempPassword(null)} />
    </>
  );
}
