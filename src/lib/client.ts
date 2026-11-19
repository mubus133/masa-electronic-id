"use client";

import { useCallback, useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function api<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
    headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(data.error || "Something went wrong. Try again.", response.status);
  }
  return data as T;
}

type Resource<T> = { data: T | null; error: string | null; loading: boolean; reload: () => Promise<void> };

const messageOf = (err: unknown) => (err instanceof Error ? err.message : "Couldn't load this.");

// Loads a URL on mount and whenever it changes. Pass null to skip loading.
// While a new URL loads, the previous data stays on screen.
export function useResource<T>(url: string | null, options?: { refreshMs?: number }): Resource<T> {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: string | null }>({ url: null, data: null, error: null });
  const refreshMs = options?.refreshMs;

  useEffect(() => {
    if (!url) return;
    let active = true;
    const load = () =>
      api<T>(url).then(
        (data) => active && setState({ url, data, error: null }),
        (err) => active && setState((current) => ({ url, data: current.data, error: messageOf(err) })),
      );
    void load();
    const timer = refreshMs ? window.setInterval(load, refreshMs) : undefined;
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [url, refreshMs]);

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const data = await api<T>(url);
      setState({ url, data, error: null });
    } catch (err) {
      setState((current) => ({ ...current, error: messageOf(err) }));
    }
  }, [url]);

  return { data: state.data, error: state.error, loading: Boolean(url) && state.url !== url, reload };
}
