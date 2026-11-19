import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const NOTICE = {
  info: { box: "border-info/20 bg-info-soft text-info", Icon: Info },
  ok: { box: "border-ok/20 bg-ok-soft text-ok", Icon: CheckCircle2 },
  warn: { box: "border-warn/25 bg-warn-soft text-warn", Icon: AlertTriangle },
  bad: { box: "border-bad/20 bg-bad-soft text-bad", Icon: XCircle },
};

type NoticeProps = { tone?: keyof typeof NOTICE; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode };

export const Notice = ({ tone = "info", title, children, className, action }: NoticeProps) => {
  const { box, Icon } = NOTICE[tone];
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={cn("flex gap-3 rounded-panel border px-4 py-3", box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-[15px]">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-ink-2", title && "mt-0.5")}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};

type EmptyProps = { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string };

export const EmptyState = ({ title, children, action, icon, className }: EmptyProps) => (
  <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
    {icon && <div className="mb-3 text-ink-3 [&>svg]:size-8">{icon}</div>}
    <p className="text-[15px] font-semibold text-ink">{title}</p>
    {children && <div className="mt-1 max-w-sm text-sm text-ink-3">{children}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-sunken", className)} aria-hidden />
);

export const LoadingBlock = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton key={index} className="h-12 w-full" />
    ))}
  </div>
);
