"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Button, Notice } from "@/components/ui";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

type QrResponse = { qrPayload: string; code: string; expiresAt: string; ttlSeconds: number };

// Shows the rotating check-in code. A fresh code is fetched a few seconds before
// the current one expires, so the screen never shows an expired code.
export const QrPanel = ({ sessionId, onOpened }: { sessionId: string; onOpened?: () => void }) => {
  const [qr, setQr] = useState<{ image: string; code: string; expiresAt: number; ttl: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [fullscreen, setFullscreen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const fetching = useRef(false);
  const expiresAt = useRef(0);

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const result = await api<QrResponse>(`/api/sessions/${sessionId}/qr`, { method: "POST" });
      const image = await QRCode.toDataURL(result.qrPayload, { margin: 1, width: 640, errorCorrectionLevel: "M" });
      expiresAt.current = new Date(result.expiresAt).getTime();
      setQr({ image, code: result.code, expiresAt: expiresAt.current, ttl: result.ttlSeconds });
      setError(null);
      onOpened?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't get a new code.");
      expiresAt.current = Date.now() + 15_000; // wait before retrying
    } finally {
      fetching.current = false;
    }
  }, [sessionId, onOpened]);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      if (expiresAt.current - Date.now() <= 5000) void refresh();
    };
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await container.current?.requestFullscreen?.();
  };

  const secondsLeft = qr ? Math.max(0, Math.ceil((qr.expiresAt - now) / 1000)) : 0;

  return (
    <div ref={container} className={cn("bg-panel", fullscreen && "flex flex-col items-center justify-center p-8")}>
      {error && <Notice tone="bad" className="mb-4" action={<Button size="sm" variant="secondary" onClick={() => void refresh()}>Try again</Button>}>{error}</Notice>}
      <div className={cn("flex flex-col items-center gap-5", !fullscreen && "md:flex-row md:items-center md:gap-8")}>
        <div className={cn("aspect-square w-full rounded-lg border border-line bg-white p-3", fullscreen ? "max-w-[min(70vh,90vw)]" : "max-w-[280px]")}>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated QR data URL
            <img src={qr.image} alt="Check-in QR code" className="h-full w-full [image-rendering:pixelated]" />
          ) : (
            <div className="h-full w-full animate-pulse rounded bg-sunken" />
          )}
        </div>
        <div className={cn("text-center", !fullscreen && "md:text-left")}>
          <p className="text-sm text-ink-3">Code to type</p>
          <p className={cn("font-mono font-semibold tracking-[0.2em] text-ink tabular-nums", fullscreen ? "text-6xl" : "text-3xl")}>{qr?.code ?? "····-····"}</p>
          <p className="mt-2 text-sm text-ink-3 tabular-nums" aria-live="polite">
            {qr ? `Changes in ${secondsLeft}s` : "Getting a code…"}
          </p>
          {qr && (
            <div className="mx-auto mt-2 h-1 w-40 overflow-hidden rounded-full bg-sunken md:mx-0">
              <div className="h-full bg-brand transition-[width] duration-1000 ease-linear" style={{ width: `${(secondsLeft / qr.ttl) * 100}%` }} />
            </div>
          )}
          <div className={cn("mt-5 flex flex-wrap justify-center gap-2", !fullscreen && "md:justify-start")}>
            <Button variant="secondary" size="sm" onClick={() => void refresh()}><RefreshCw className="size-4" /> New code</Button>
            <Button variant="secondary" size="sm" onClick={() => void toggleFullscreen()}>
              {fullscreen ? <><Minimize2 className="size-4" /> Exit full screen</> : <><Maximize2 className="size-4" /> Full screen</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
