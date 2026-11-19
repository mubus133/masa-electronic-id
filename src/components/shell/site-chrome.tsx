"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/about", label: "How it works" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-control px-3 py-2 text-[15px] text-ink-2 hover:text-ink",
                pathname === link.href && "font-medium text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
          {pathname !== "/login" && <ButtonLink href="/login" size="sm" className="ml-2">Sign in</ButtonLink>}
        </nav>
        <button
          className="-mr-2 rounded-control p-2.5 text-ink-2 hover:bg-sunken md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav id="site-menu" className="border-t border-line px-4 pt-2 pb-4 md:hidden" aria-label="Main">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-control px-2 py-3 text-base text-ink hover:bg-sunken">
              {link.label}
            </Link>
          ))}
          <ButtonLink href="/login" onClick={() => setOpen(false)} className="mt-3 w-full">Sign in</ButtonLink>
        </nav>
      )}
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>IMASA electronic ID and attendance. For students, teachers and staff of IMASA.</p>
      <nav className="flex gap-5" aria-label="Footer">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-ink">{link.label}</Link>
        ))}
      </nav>
    </div>
  </footer>
);
