import { cn } from "@/lib/cn";

const SIZES = { sm: "size-9 text-sm", md: "size-12 text-base", lg: "size-20 text-2xl", xl: "size-28 text-3xl" };

type PhotoProps = { src?: string | null; name: string; size?: keyof typeof SIZES; className?: string };

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

export const Photo = ({ src, name, size = "md", className }: PhotoProps) =>
  src ? (
    // eslint-disable-next-line @next/next/no-img-element -- photos are data URLs or arbitrary hosts
    <img src={src} alt={`Photo of ${name}`} className={cn("shrink-0 rounded-lg bg-sunken object-cover", SIZES[size], className)} />
  ) : (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-soft font-semibold text-brand-ink", SIZES[size], className)}>
      {initials(name)}
    </span>
  );

type PersonProps = { name: string; detail?: React.ReactNode; photo?: string | null; size?: "sm" | "md" };

export const Person = ({ name, detail, photo, size = "sm" }: PersonProps) => (
  <div className="flex min-w-0 items-center gap-3">
    <Photo src={photo} name={name} size={size} />
    <div className="min-w-0">
      <p className="truncate font-medium text-ink">{name}</p>
      {detail && <p className="truncate text-sm text-ink-3">{detail}</p>}
    </div>
  </div>
);
