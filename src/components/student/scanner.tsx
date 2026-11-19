"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";

type ScannerProps = { onPayload: (payload: string) => void; onCode: (code: string) => void; busy?: boolean };

type Html5QrcodeInstance = { start: (...args: unknown[]) => Promise<unknown>; stop: () => Promise<void>; isScanning?: boolean };

export const Scanner = ({ onPayload, onCode, busy }: ScannerProps) => {
  const [active, setActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const scanner = useRef<Html5QrcodeInstance | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    handled.current = false;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        const instance = new Html5Qrcode("imasa-reader") as unknown as Html5QrcodeInstance;
        scanner.current = instance;
        return instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (width: number, height: number) => {
            const size = Math.floor(Math.min(width, height) * 0.72);
            return { width: size, height: size };
          } },
          (text: string) => {
            if (handled.current) return;
            handled.current = true;
            navigator.vibrate?.(60);
            instance.stop().catch(() => undefined).finally(() => {
              setActive(false);
              onPayload(text);
            });
          },
          () => undefined,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setCameraError("The camera didn't start. Allow camera access in your browser settings, or type the code below.");
        setActive(false);
      });

    return () => {
      cancelled = true;
      const instance = scanner.current;
      scanner.current = null;
      if (instance?.isScanning !== false) instance?.stop().catch(() => undefined);
    };
  }, [active, onPayload]);

  const submitCode = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim()) onCode(code.trim());
  };

  return (
    <div className="space-y-6">
      {cameraError && <Notice tone="warn">{cameraError}</Notice>}

      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-panel bg-ink">
        <div id="imasa-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-sunken p-6 text-center">
            <Camera className="size-10 text-ink-3" aria-hidden />
            <p className="max-w-[16rem] text-[15px] text-ink-2">Point your camera at the code on your teacher&apos;s screen.</p>
            <Button
              onClick={() => {
                setCameraError(null);
                setActive(true);
              }}
              disabled={busy}
              size="lg"
            >
              <Camera className="size-5" /> Start camera
            </Button>
          </div>
        )}
      </div>
      {active && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => setActive(false)}><CameraOff className="size-4" /> Stop camera</Button>
        </div>
      )}

      <form onSubmit={submitCode} className="mx-auto max-w-sm border-t border-line pt-5">
        <Field label="Or type the code" hint="The 8 characters under the QR code, e.g. K7PD-3QWX.">
          {(props) => (
            <div className="flex gap-2">
              <Input
                {...props}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={9}
                className="font-mono tracking-widest uppercase"
              />
              <Button type="submit" busy={busy} disabled={code.replace(/[^A-Z0-9]/gi, "").length !== 8}>Check in</Button>
            </div>
          )}
        </Field>
      </form>
    </div>
  );
};
