"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Actor } from "@/lib/permissions";

type SessionValue = { actor: Actor; timezone: string; refresh: () => Promise<void> };

const SessionContext = createContext<SessionValue | null>(null);

export const useSession = () => {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside a portal layout.");
  return value;
};

type MeResponse = { authenticated: boolean; actor: Actor | null; timezone: string };

export const loadMe = async (): Promise<MeResponse | null> => {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  return response.json();
};

// The portal renders only once the browser has confirmed who is signed in.
export const SessionProvider = ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
  const [state, setState] = useState<{ actor: Actor; timezone: string } | null>(null);

  const apply = (me: MeResponse | null) => {
    if (!me?.authenticated || !me.actor) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setState({ actor: me.actor, timezone: me.timezone });
  };

  const refresh = async () => apply(await loadMe().catch(() => null));

  useEffect(() => {
    let active = true;
    loadMe()
      .catch(() => null)
      .then((me) => active && apply(me));
    return () => {
      active = false;
    };
  }, []);

  if (!state) return <>{fallback}</>;
  return <SessionContext.Provider value={{ ...state, refresh }}>{children}</SessionContext.Provider>;
};
