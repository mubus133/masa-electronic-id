import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Panel = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <section className={cn("rounded-panel border border-line bg-panel", className)} {...rest} />
);

type PanelHeaderProps = { title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string };

export const PanelHeader = ({ title, description, actions, className }: PanelHeaderProps) => (
  <div className={cn("flex flex-col gap-3 border-b border-line px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5", className)}>
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const PanelBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-4 py-4 sm:px-5", className)} {...rest} />
);

type PageHeaderProps = { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode };

export const PageHeader = ({ title, description, actions, eyebrow }: PageHeaderProps) => (
  <header className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1 text-sm font-medium text-brand">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-[15px] text-ink-2">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

type StatProps = { label: string; value: ReactNode; note?: ReactNode; tone?: "default" | "ok" | "warn" | "bad" };

const STAT_TONE = { default: "text-ink", ok: "text-ok", warn: "text-warn", bad: "text-bad" };

export const Stat = ({ label, value, note, tone = "default" }: StatProps) => (
  <div className="rounded-panel border border-line bg-panel px-4 py-3.5">
    <p className="text-sm text-ink-3">{label}</p>
    <p className={cn("mt-1 text-2xl font-semibold tabular-nums", STAT_TONE[tone])}>{value}</p>
    {note && <p className="mt-0.5 text-xs text-ink-3">{note}</p>}
  </div>
);

type DetailsProps = { items: { label: string; value: ReactNode }[]; className?: string };

export const Details = ({ items, className }: DetailsProps) => (
  <dl className={cn("divide-y divide-line", className)}>
    {items.map((item) => (
      <div key={item.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
        <dt className="text-sm text-ink-3 sm:w-40 sm:shrink-0">{item.label}</dt>
        <dd className="min-w-0 break-words text-[15px] text-ink">{item.value}</dd>
      </div>
    ))}
  </dl>
);
