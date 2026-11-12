"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { RefreshCw, QrCode, Clock, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Session } from "@/lib/types";

interface QrDisplayProps {
  session: Session;
  onRefreshAttendance?: () => void;
}

export function QrDisplay({ session, onRefreshAttendance }: QrDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewQr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session.id}/qr`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate session QR code.");

      setExpiresAt(data.expiresAt);
      const diff = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);

      const url = await QRCode.toDataURL(data.qrPayload, {
        width: 380,
        margin: 2,
        color: {
          dark: "#142B4A",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(url);

      if (onRefreshAttendance) onRefreshAttendance();
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code.");
    } finally {
      setLoading(false);
    }
  }, [session.id, onRefreshAttendance]);

  // Initial load
  useEffect(() => {
    fetchNewQr();
  }, [fetchNewQr]);

  // Countdown timer & auto-rotate
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        // Auto rotate when expired
        fetchNewQr();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, fetchNewQr]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-lg mx-auto text-center">
      {/* Session Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          SESSION ATTENDANCE ACTIVE
        </span>
        <h2 className="text-2xl font-bold text-[#142B4A]">{session.session_name}</h2>
        <p className="text-xs text-slate-500 font-medium">
          {session.weekday}, {session.session_date} &bull; {session.class_group || "All Classes"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 text-left">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* QR Code Canvas */}
      <div className="relative mx-auto w-72 h-72 bg-white rounded-xl shadow-inner border-2 border-[#142B4A] flex items-center justify-center p-3 mb-6">
        {loading && !qrDataUrl ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-[#0F766E]" />
            <p className="text-xs font-medium">Generating rotating QR code...</p>
          </div>
        ) : qrDataUrl ? (
          <img src={qrDataUrl} alt="Session QR Code" className="w-full h-full object-contain" />
        ) : (
          <p className="text-xs text-slate-400">No QR Code available</p>
        )}
      </div>

      {/* Expiration countdown bar */}
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[#C8A45D]" />
            Temporary Token Validity
          </span>
          <span className="font-mono font-bold text-[#142B4A]">
            {secondsRemaining > 0 ? `${secondsRemaining}s remaining` : "Rotating..."}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsRemaining < 20 ? "bg-red-500" : "bg-[#0F766E]"
            }`}
            style={{ width: `${Math.min(100, (secondsRemaining / 120) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-left">
          Code rotates automatically to prevent unauthorized forwarding or proxy scans.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={fetchNewQr}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Force Rotate QR
        </button>
      </div>
    </div>
  );
}
