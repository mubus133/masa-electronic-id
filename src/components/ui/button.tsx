import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-strong disabled:bg-brand/50",
  secondary: "border border-line-strong bg-panel text-ink hover:bg-sunken disabled:text-ink-3",
  ghost: "text-ink-2 hover:bg-sunken hover:text-ink disabled:text-ink-3",
  danger: "bg-bad text-white hover:bg-[#861b1b] disabled:bg-bad/50",
} as const;

const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-[15px] gap-2 sm:h-10",
  lg: "h-12 px-5 text-base gap-2",
} as const;

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

const base =
  "inline-flex shrink-0 select-none items-center justify-center rounded-control font-medium whitespace-nowrap transition-[background-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100";

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(base, VARIANTS[variant], SIZES[size], className);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; busy?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, busy, className, children, disabled, type = "button", ...rest }, ref) => (
    <button ref={ref} type={type} disabled={disabled || busy} className={buttonClass(variant, size, className)} {...rest}>
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export const ButtonLink = ({ variant, size, className, ...rest }: ButtonLinkProps) => (
  <Link className={buttonClass(variant, size, className)} {...rest} />
);
