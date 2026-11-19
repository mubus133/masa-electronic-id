"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AccountActions } from "@/components/admin/account-actions";
import { TempPasswordDialog } from "@/components/admin/temp-password";
import { useSession } from "@/components/shell/session";
import { Badge, Button, DataTable, Dialog, EmptyState, Field, Input, LoadingBlock, Notice, PageHeader, Panel, Person, StatusBadge } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { GRANTABLE_PERMISSIONS, isPresident } from "@/lib/permissions";

type Admin = { id: string; email: string; full_name: string; role: string; account_status: string; permissions: string[]; last_login_at: string | null };

const PermissionPicker = ({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) => (
  <fieldset>
    <legend className="mb-2 text-sm font-medium text-ink">Permissions</legend>
    <div className="divide-y divide-line rounded-control border border-line">
      {GRANTABLE_PERMISSIONS.map((permission) => (
        <label key={permission.key} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-canvas/70">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-brand"
            checked={value.includes(permission.key)}
            onChange={(event) => onChange(event.target.checked ? [...value, permission.key] : value.filter((key) => key !== permission.key))}
          />
          <span>
            <span className="block text-[15px] font-medium text-ink">{permission.label}</span>
            <span className="block text-sm text-ink-3">{permission.detail}</span>
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

export default function AdministratorsPage() {
  const { actor } = useSession();
  const { data, loading, error, reload } = useResource<{ administrators: Admin[] }>(isPresident(actor) ? "/api/administrators" : null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", permissions: [] as string[] });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ password: string; login: string; name: string } | null>(null);

  if (!isPresident(actor)) return <Notice tone="warn" title="President only">Only the President can appoint administrators and set their permissions.</Notice>;

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const result = await api<{ administrator: { temporary_password: string } }>("/api/administrators", { body: form });
      setCreating(false);
      setCreated({ password: result.administrator.temporary_password, login: form.email, name: form.fullName });
      void reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't add the administrator.");
    } finally {
      setBusy(false);
    }
  };

  const savePermissions = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await api(`/api/administrators/${editing.id}/permissions`, { method: "PATCH", body: { permissions } });
      toast.success("Permissions updated");
      setEditing(null);
      void reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Administrators"
        description="Administrators can only do what you allow. They never get your President powers automatically."
        actions={<Button onClick={() => { setForm({ fullName: "", email: "", permissions: [] }); setFormError(null); setCreating(true); }}><Plus className="size-4" /> Add administrator</Button>}
      />
      {error && <Notice tone="bad" className="mb-6">{error}</Notice>}
      <Panel>
        {loading ? <LoadingBlock /> : (
          <DataTable
            rows={(data?.administrators ?? []).filter((row) => row.role !== "super_admin")}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No administrators yet" />}
            columns={[
              { key: "name", header: "Name", primary: true, cell: (row) => <Person name={row.full_name} detail={row.email} /> },
              {
                key: "permissions",
                header: "Can",
                cell: (row) => (
                  <div className="flex flex-wrap gap-1 md:max-w-md">
                    {row.permissions.length === 0 ? <span className="text-ink-3">Nothing yet</span> : row.permissions.map((key) => (
                      <Badge key={key} tone="neutral">{GRANTABLE_PERMISSIONS.find((item) => item.key === key)?.label ?? key}</Badge>
                    ))}
                  </div>
                ),
              },
              { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.account_status} /> },
            ]}
            actions={(row) => (
              <>
                <Button size="sm" variant="secondary" onClick={() => { setEditing(row); setPermissions(row.permissions); }}>Permissions</Button>
                <AccountActions userId={row.id} name={row.full_name} login={row.email} active={row.account_status === "active"} onChange={() => void reload()} />
              </>
            )}
          />
        )}
      </Panel>

      <Dialog
        open={creating}
        onOpenChange={setCreating}
        wide
        title="Add an administrator"
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" form="admin-form" busy={busy}>Add administrator</Button></>}
      >
        <form id="admin-form" onSubmit={create} className="space-y-5">
          {formError && <Notice tone="bad">{formError}</Notice>}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name">{(props) => <Input {...props} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />}</Field>
            <Field label="Email">{(props) => <Input {...props} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />}</Field>
          </div>
          <PermissionPicker value={form.permissions} onChange={(value) => setForm({ ...form, permissions: value })} />
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        wide
        title={`Permissions for ${editing?.full_name ?? ""}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={savePermissions} busy={busy}>Save</Button></>}
      >
        <PermissionPicker value={permissions} onChange={setPermissions} />
      </Dialog>
      <TempPasswordDialog value={created} name={created?.name ?? ""} onClose={() => setCreated(null)} />
    </>
  );
}
