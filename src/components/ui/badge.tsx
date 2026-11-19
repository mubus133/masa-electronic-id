import { cn } from "@/lib/cn";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info" | "brand";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand-ink",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "ok" },
  suspended: { label: "Suspended", tone: "warn" },
  revoked: { label: "Revoked", tone: "bad" },
  graduated: { label: "Graduated", tone: "neutral" },
  inactive: { label: "Inactive", tone: "neutral" },
  disabled: { label: "Disabled", tone: "neutral" },

  scheduled: { label: "Scheduled", tone: "neutral" },
  open: { label: "Check-in open", tone: "info" },
  closed: { label: "Check-in closed", tone: "warn" },
  completed: { label: "Completed", tone: "ok" },
  cancelled: { label: "Cancelled", tone: "bad" },

  pending: { label: "Waiting for teacher", tone: "warn" },
  present: { label: "Present", tone: "ok" },
  late: { label: "Late", tone: "info" },
  rejected: { label: "Rejected", tone: "bad" },
  absent: { label: "Absent", tone: "bad" },
  excused: { label: "Excused", tone: "neutral" },

  expired: { label: "Expired", tone: "neutral" },
  redeemed: { label: "Used", tone: "info" },

  admitted: { label: "Admitted", tone: "ok" },
  denied: { label: "Denied", tone: "bad" },
  exception: { label: "Emergency entry", tone: "warn" },

  qr: { label: "QR scan", tone: "neutral" },
  manual: { label: "Manual", tone: "brand" },
  offline: { label: "Offline", tone: "warn" },
};

export const statusLabel = (status: string) => STATUS[status]?.label ?? status.replace(/_/g, " ");

type BadgeProps = { tone?: Tone; children: React.ReactNode; className?: string };

export const Badge = ({ tone = "neutral", children, className }: BadgeProps) => (
  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap", TONES[tone], className)}>
    <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />
    {children}
  </span>
);

const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

// A pass that is still "active" in the database but past its expiry reads as expired.
export const StatusBadge = ({ status, expiresAt, className }: { status: string; expiresAt?: string | null; className?: string }) => {
  const effective = status === "active" && expiresAt && isPast(expiresAt) ? "expired" : status;
  const entry = STATUS[effective] ?? { label: statusLabel(effective), tone: "neutral" as Tone };
  return <Badge tone={entry.tone} className={className}>{entry.label}</Badge>;
};
