"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import { Field, Textarea } from "./field";
import { cn } from "@/lib/cn";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

// Bottom sheet on phones, centred dialog from the sm breakpoint up.
export const Dialog = ({ open, onOpenChange, title, description, children, footer, wide }: DialogProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <RadixDialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-panel shadow-xl focus:outline-none",
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <RadixDialog.Title className="text-lg font-semibold text-ink">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-ink-2">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
          </div>
          <RadixDialog.Close className="-mr-2 -mt-1 rounded-control p-2 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="Close">
            <X className="size-5" />
          </RadixDialog.Close>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>
);

type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  reasonLabel?: string;
  reasonHint?: string;
  minReason?: number;
  children?: ReactNode;
  onConfirm: (reason: string) => Promise<void> | void;
};

// High-impact actions ask for confirmation and, when needed, a written reason.
export const ConfirmDialog = (props: ConfirmProps) => <ConfirmBody key={props.open ? "open" : "closed"} {...props} />;

const ConfirmBody = ({
  open, onOpenChange, title, description, confirmLabel, danger, reasonLabel, reasonHint, minReason = 5, children, onConfirm,
}: ConfirmProps) => {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsReason = Boolean(reasonLabel);
  const ready = !needsReason || reason.trim().length >= minReason;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={submit} busy={busy} disabled={!ready}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {children}
        {needsReason && (
          <Field label={reasonLabel!} hint={reasonHint ?? `At least ${minReason} characters. This is kept in the audit log.`} error={error}>
            {(props) => <Textarea {...props} value={reason} onChange={(event) => setReason(event.target.value)} autoFocus />}
          </Field>
        )}
        {!needsReason && error && <p className="text-sm text-bad">{error}</p>}
      </div>
    </Dialog>
  );
};
