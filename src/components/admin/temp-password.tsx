"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, Dialog } from "@/components/ui";

// Shown once after creating an account or resetting a password.
export const TempPasswordDialog = ({ value, name, onClose }: { value: { password: string; login: string } | null; name: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog
      open={Boolean(value)}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
      title="Temporary password"
      description={`Give these sign-in details to ${name} in person. The password is shown only once.`}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {value && (
        <div className="space-y-3">
          <div className="rounded-control border border-line bg-sunken px-4 py-3">
            <p className="text-sm text-ink-3">Sign in with</p>
            <p className="font-medium break-all text-ink">{value.login}</p>
          </div>
          <div className="flex items-center gap-2 rounded-control border border-line bg-sunken px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-3">Password</p>
              <p className="font-mono text-lg tracking-wider text-ink">{value.password}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await navigator.clipboard?.writeText(value.password);
                setCopied(true);
              }}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
