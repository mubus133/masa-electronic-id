"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { LogOut, Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { SessionProvider, useSession } from "./session";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { can, type Actor } from "@/lib/permissions";

export type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }>; show?: (actor: Actor) => boolean; exact?: boolean };

const ROLE_LABEL: Record<Actor["role"], string> = {
  super_admin: "President",
  administrator: "Administrator",
  teacher: "Teacher",
  hostel_staff: "Hostel staff",
  student: "Student",
};

const isActive = (pathname: string, item: NavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

const signOut = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
};

const NavLinks = ({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) => {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-3 rounded-control px-3 text-[15px] font-medium transition-colors lg:h-10",
                active ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-ink-3")} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

const Account = () => {
  const { actor } = useSession();
  return (
    <div className="flex items-center gap-3 border-t border-line pt-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{actor.fullName}</p>
        <p className="truncate text-xs text-ink-3">{ROLE_LABEL[actor.role]}</p>
      </div>
      <button onClick={signOut} className="rounded-control p-2.5 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="Sign out" title="Sign out">
        <LogOut className="size-[18px]" />
      </button>
    </div>
  );
};

const Frame = ({ items, area, children }: { items: NavItem[]; area: string; children: ReactNode }) => {
  const { actor } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = items.filter((item) => !item.show || item.show(actor));
  const current = visible.find((item) => isActive(pathname, item));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel px-3 py-5 lg:flex">
        <div className="px-2 pb-6"><Brand subtitle={area} /></div>
        <nav className="flex-1 overflow-y-auto" aria-label={area}><NavLinks items={visible} /></nav>
        <div className="px-2"><Account /></div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-panel/95 px-4 backdrop-blur lg:hidden">
        <Brand subtitle={current?.label ?? area} />
        <RadixDialog.Root open={open} onOpenChange={setOpen}>
          <RadixDialog.Trigger className="-mr-2 rounded-control p-2.5 text-ink-2 hover:bg-sunken" aria-label="Open menu">
            <Menu className="size-6" />
          </RadixDialog.Trigger>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
            <RadixDialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-panel px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl focus:outline-none">
              <div className="flex items-center justify-between px-2 pb-4">
                <RadixDialog.Title className="text-base font-semibold text-ink">{area}</RadixDialog.Title>
                <RadixDialog.Description className="sr-only">Navigation</RadixDialog.Description>
                <RadixDialog.Close className="-mr-1 rounded-control p-2.5 text-ink-3 hover:bg-sunken" aria-label="Close menu">
                  <X className="size-5" />
                </RadixDialog.Close>
              </div>
              <nav className="flex-1 overflow-y-auto" aria-label={area}><NavLinks items={visible} onNavigate={() => setOpen(false)} /></nav>
              <div className="px-2"><Account /></div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      </header>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
};

const ShellFallback = () => (
  <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
    <div className="hidden border-r border-line bg-panel lg:block" />
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10 sm:px-6 lg:px-10">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="mt-6 h-48 w-full" />
    </div>
  </div>
);

export const AppShell = ({ items, area, children }: { items: NavItem[]; area: string; children: ReactNode }) => (
  <SessionProvider fallback={<ShellFallback />}>
    <Frame items={items} area={area}>{children}</Frame>
  </SessionProvider>
);

export { can };
