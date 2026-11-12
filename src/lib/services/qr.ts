import { database } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { DomainError } from "@/lib/errors";
import { getSystemSettings, getSessionById } from "@/lib/services/sessions";
import type { Actor } from "@/lib/permissions";
import type { QrToken } from "@/lib/types";

export interface GenerateQrResult {
  sessionId: string;
  tokenPlaintext: string;
  qrPayload: string; // The text to encode in the QR code
  expiresAt: string;
  ttlSeconds: number;
}

export async function generateSessionQr(sessionId: string, actor: Actor): Promise<GenerateQrResult> {
  const session = await getSessionById(sessionId);
  if (!session) throw new DomainError("Session not found.", 404);
  if (session.session_status === "completed") {
    throw new DomainError("Cannot generate QR code for a completed session.", 400);
  }
  if (session.session_status === "cancelled") {
    throw new DomainError("Cannot generate QR code for a cancelled session.", 400);
  }

  const settings = await getSystemSettings();
  const ttl = settings.qr_ttl_seconds || 120;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const tokenPlaintext = randomToken();
  const tokenHash = sha256(tokenPlaintext);

  const db = database();

  await db.transaction(async (tx) => {
    // 1. Expire existing active tokens for this session
    await tx.query(
      `UPDATE qr_tokens 
       SET token_status = 'expired'
       WHERE session_id = $1 AND token_status = 'active'`,
      [sessionId]
    );

    // 2. Ensure session status is open
    if (session.session_status === "scheduled") {
      await tx.query(
        `UPDATE sessions SET session_status = 'open', attendance_opened_at = COALESCE(attendance_opened_at, now()) WHERE id = $1`,
        [sessionId]
      );
    }

    // 3. Insert new QR token
    await tx.query(
      `INSERT INTO qr_tokens (
        session_id, token_hash, token_plaintext, issued_by, issued_at, expires_at, token_status
       ) VALUES ($1, $2, $3, $4, now(), $5, 'active')`,
      [sessionId, tokenHash, tokenPlaintext, actor.id, expiresAt]
    );
  });

  // Construct standard IMASA QR payload (contains NO student personal data!)
  const qrPayload = JSON.stringify({
    imasa: "madrasa_session",
    sessionId,
    token: tokenPlaintext,
    exp: expiresAt,
  });

  return {
    sessionId,
    tokenPlaintext,
    qrPayload,
    expiresAt,
    ttlSeconds: ttl,
  };
}

export async function getActiveQrToken(sessionId: string): Promise<QrToken | null> {
  const db = database();
  const rows = await db.query<QrToken>(
    `SELECT * FROM qr_tokens 
     WHERE session_id = $1 AND token_status = 'active' AND expires_at > now()
     ORDER BY issued_at DESC LIMIT 1`,
    [sessionId]
  );
  return rows[0] || null;
}
