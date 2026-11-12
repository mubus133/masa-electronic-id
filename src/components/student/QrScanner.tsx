"use client";

import React, { useState, useEffect, useRef } from "react";
import { QrCode, Camera, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

interface QrScannerProps {
  onScanSuccess: (payload: string) => void;
  isSubmitting?: boolean;
}

export function QrScanner({ onScanSuccess, isSubmitting }: QrScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let html5QrCode: any = null;

    if (cameraActive) {
      import("html5-qrcode")
        .then(({ Html5Qrcode }) => {
          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText: string) => {
                // Audio beep feedback if supported
                try {
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = audioCtx.createOscillator();
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                  osc.connect(audioCtx.destination);
                  osc.start();
                  osc.stop(audioCtx.currentTime + 0.15);
                } catch {
                  // ignore audio errors
                }

                // Stop scanning and trigger callback
                html5QrCode.stop().then(() => {
                  setCameraActive(false);
                  onScanSuccess(decodedText);
                });
              },
              () => {
                // frame error, ignore
              }
            )
            .catch((err: any) => {
              console.error("Camera start failed:", err);
              setCameraError(
                "Unable to access phone camera. Please grant camera permission in your browser or paste the session token below."
              );
              setCameraActive(false);
            });
        })
        .catch((err) => {
          console.error("Scanner library load failed:", err);
          setCameraError("Scanner component failed to load.");
        });
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, [cameraActive, onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 max-w-md mx-auto text-center">
      <div className="h-12 w-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mx-auto mb-3">
        <QrCode className="h-6 w-6" />
      </div>

      <h3 className="font-bold text-lg text-[#142B4A] mb-1">Scan Madrasa Attendance QR</h3>
      <p className="text-xs text-slate-500 mb-6">
        Point your camera at the temporary QR code displayed on the teacher&apos;s screen.
      </p>

      {cameraError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex gap-2 text-left">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Camera Box */}
      <div className="relative mb-6">
        <div
          id="reader"
          className={`w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border-2 border-dashed border-[#0F766E] flex flex-col items-center justify-center text-slate-400 ${
            cameraActive ? "" : "hidden"
          }`}
        />

        {!cameraActive && (
          <div className="w-full aspect-square bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-slate-400">
            <Camera className="h-12 w-12 mb-3 text-slate-400" />
            <p className="text-xs font-medium text-slate-600 mb-4">Camera is currently idle</p>
            <button
              onClick={() => {
                setCameraError(null);
                setCameraActive(true);
              }}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F766E] hover:bg-[#0B5C55] text-white text-xs font-semibold shadow transition-colors"
            >
              <Camera className="h-4 w-4" />
              Open Phone Camera
            </button>
          </div>
        )}

        {cameraActive && (
          <button
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
              }
              setCameraActive(false);
            }}
            className="mt-3 px-4 py-1.5 rounded-md bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300"
          >
            Cancel Camera
          </button>
        )}
      </div>

      {/* Fallback code entry */}
      <div className="border-t border-slate-200 pt-4 text-left">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Manual Code Fallback
        </p>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste raw QR token here..."
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !manualCode.trim()}
            className="px-4 py-2 bg-[#142B4A] hover:bg-[#0D1E35] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
