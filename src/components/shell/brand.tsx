import Link from "next/link";
import { cn } from "@/lib/cn";

// Simple wordmark: an eight-point star drawn from two squares, plus the name.
export const Mark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
    <rect width="32" height="32" rx="7" fill="currentColor" />
    <g fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round">
      <rect x="9.5" y="9.5" width="13" height="13" />
      <rect x="9.5" y="9.5" width="13" height="13" transform="rotate(45 16 16)" />
    </g>
  </svg>
);

export const Brand = ({ href = "/", subtitle, inverted }: { href?: string; subtitle?: string; inverted?: boolean }) => (
  <Link href={href} className="flex min-w-0 items-center gap-2.5 rounded-control">
    <Mark className={inverted ? "text-white/15" : "text-brand"} />
    <span className="min-w-0 leading-tight">
      <span className={cn("block text-[17px] font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>IMASA</span>
      {subtitle && <span className={cn("block truncate text-xs", inverted ? "text-white/70" : "text-ink-3")}>{subtitle}</span>}
    </span>
  </Link>
);
