"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { TempPasswordDialog } from "./temp-password";
import { Button, ConfirmDialog } from "@/components/ui";
import { api } from "@/lib/client";

type Props = { userId: string; name: string; login: string; active: boolean; onChange: () => void };

// Reset password and disable/enable, shared by the teacher, hostel staff and administrator lists.
export const AccountActions = ({ userId, name, login, active, onChange }: Props) => {
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    try {
      const result = await api<{ temporaryPassword: string }>(`/api/users/${userId}/password`, { method: "POST" });
      setPassword(result.temporaryPassword);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't reset the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={reset} busy={busy}><KeyRound className="size-4" /> Reset password</Button>
      <Button size="sm" variant="secondary" className={active ? "text-bad" : undefined} onClick={() => setConfirm(true)}>{active ? "Disable" : "Enable"}</Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={active ? `Disable ${name}?` : `Enable ${name}?`}
        description={active ? "They're signed out and can't sign in until the account is enabled again." : "They'll be able to sign in again."}
        confirmLabel={active ? "Disable account" : "Enable account"}
        danger={active}
        reasonLabel="Reason"
        onConfirm={async (reason) => {
          await api(`/api/users/${userId}/status`, { body: { status: active ? "disabled" : "active", reason } });
          toast.success(active ? "Account disabled" : "Account enabled");
          onChange();
        }}
      />
      <TempPasswordDialog value={password ? { password, login } : null} name={name} onClose={() => setPassword(null)} />
    </>
  );
};
