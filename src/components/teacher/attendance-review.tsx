"use client";

import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, ConfirmDialog, EmptyState, Person, StatusBadge } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import type { Attendance } from "@/lib/types";

const TABS = [
  { key: "pending", label: "Waiting" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const inTab = (record: Attendance, tab: TabKey) =>
  tab === "pending" ? record.attendance_status === "pending" : tab === "rejected" ? record.attendance_status === "rejected" : !["pending", "rejected"].includes(record.attendance_status);

const timeOf = (value: string, timezone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));

type Props = { records: Attendance[]; timezone: string; editable: boolean; onChange: () => void };

export const AttendanceReview = ({ records, timezone, editable, onChange }: Props) => {
  const pendingCount = records.filter((record) => record.attendance_status === "pending").length;
  const [tab, setTab] = useState<TabKey>(pendingCount > 0 ? "pending" : "confirmed");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Attendance | null>(null);
  const visible = records.filter((record) => inTab(record, tab));

  const decide = async (record: Attendance, status: "present" | "late") => {
    setBusyId(record.id);
    try {
      await api(`/api/attendance/${record.id}/confirm`, { body: { status } });
      toast.success(`${record.student_name} marked ${status}`);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-2 sm:px-3">
        {TABS.map((item) => {
          const count = records.filter((record) => inTab(record, item.key)).length;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-[15px] font-medium whitespace-nowrap",
                tab === item.key ? "border-brand text-ink" : "border-transparent text-ink-3 hover:text-ink",
              )}
            >
              {item.label}
              <span className={cn("rounded-full px-2 text-xs tabular-nums", item.key === "pending" && count > 0 ? "bg-warn-soft text-warn" : "bg-sunken text-ink-3")}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState title={tab === "pending" ? "Nobody waiting" : tab === "rejected" ? "No rejected check-ins" : "Nobody confirmed yet"}>
          {tab === "pending" ? "New check-ins appear here as students scan." : undefined}
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((record) => (
            <li key={record.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Person name={record.student_name ?? "Student"} detail={record.registration_number} photo={record.photograph_url} size="md" />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-sm text-ink-3 tabular-nums">{timeOf(record.check_in_at, timezone)}</span>
                {record.check_in_method === "manual" && <Badge tone="brand">Manual</Badge>}
                {tab !== "pending" && <StatusBadge status={record.attendance_status} />}
                {editable && tab === "pending" && (
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button size="sm" className="flex-1 sm:flex-none" busy={busyId === record.id} onClick={() => decide(record, "present")}><Check className="size-4" /> Present</Button>
                    <Button size="sm" variant="secondary" className="flex-1 sm:flex-none" disabled={busyId === record.id} onClick={() => decide(record, "late")}><Clock className="size-4" /> Late</Button>
                    <Button size="sm" variant="secondary" className="flex-1 text-bad sm:flex-none" disabled={busyId === record.id} onClick={() => setRejecting(record)}><X className="size-4" /> Reject</Button>
                  </div>
                )}
                {editable && tab !== "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => (record.attendance_status === "rejected" ? decide(record, "present") : setRejecting(record))}>
                    {record.attendance_status === "rejected" ? "Mark present" : "Reject"}
                  </Button>
                )}
              </div>
              {record.rejection_reason && <p className="text-sm text-ink-3 sm:basis-full">Reason: {record.rejection_reason}</p>}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.student_name ?? "this check-in"}?`}
        description="She won't get a pass for this session."
        confirmLabel="Reject check-in"
        danger
        reasonLabel="Reason"
        minReason={3}
        reasonHint="For example: not in the room."
        onConfirm={async (reason) => {
          if (!rejecting) return;
          await api(`/api/attendance/${rejecting.id}/reject`, { body: { reason } });
          toast.success("Check-in rejected");
          onChange();
        }}
      />
    </>
  );
};
