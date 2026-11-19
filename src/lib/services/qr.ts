import { database } from "@/lib/db";
import { randomBytes } from "crypto";
import { randomToken, sha256 } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";
import { assertSessionAccess, badRequest, notFound } from "@/lib/access";
import { assertCheckInWindow, getSessionById, getSystemSettings } from "@/lib/services/sessions";
import type { Actor } from "@/lib/permissions";

export interface GenerateQrResult {
  sessionId: string;
  code: string;
  qrPayload: string;
  expiresAt: string;
  ttlSeconds: number;
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const normalizeCheckInCode = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

const newCheckInCode = () =>
  Array.from(randomBytes(8), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");

// Only the hash of each token is stored. The plaintext exists in the response
// to the teacher's screen and nowhere else, so a database read can't replay it.
export async function generateSessionQr(sessionId: string, actor: Actor): Promise<GenerateQrResult> {
  await assertSessionAccess(sessionId, actor, "qr.generate");
  const session = await getSessionById(sessionId);
  if (!session) throw notFound("Session not found.");
  if (session.session_status === "completed" || session.session_status === "cancelled" || session.session_status === "closed") {
    throw badRequest(`This session is ${session.session_status}, so no new check-in code can be shown.`);
  }

  const settings = await getSystemSettings();
  if (session.session_status === "scheduled") assertCheckInWindow(session, settings);

  const ttl = settings.qr_ttl_seconds || 120;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
  const token = randomToken();
  const code = newCheckInCode();

  await database().transaction(async (tx) => {
    // Earlier codes stay valid until their own expiry, so two teachers showing
    // the same session on different screens don't cancel each other's codes.
    await tx.query(
      "UPDATE qr_tokens SET token_status = 'expired' WHERE session_id = $1 AND token_status = 'active' AND expires_at <= now()",
      [sessionId],
    );
    if (session.session_status === "scheduled") {
      await tx.query(
        "UPDATE sessions SET session_status = 'open', attendance_opened_at = COALESCE(attendance_opened_at, now()) WHERE id = $1",
        [sessionId],
      );
      await logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: "session.open_attendance",
        affectedRecordType: "session",
        affectedRecordId: sessionId,
        reason: "Check-in opened by showing the first session code",
      });
    }
    const rows = await tx.query<{ id: string }>(
      `INSERT INTO qr_tokens (session_id, token_hash, code_hash, issued_by, expires_at, token_status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
      [sessionId, sha256(token), sha256(code), actor.id, expiresAt],
    );
    await logAudit({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "qr.generate",
      affectedRecordType: "qr_token",
      affectedRecordId: rows[0].id,
      reason: "Session code issued",
      newValue: { sessionId, expiresAt },
    });
  });

  return {
    sessionId,
    code: `${code.slice(0, 4)}-${code.slice(4)}`,
    qrPayload: JSON.stringify({ imasa: "madrasa_session", sessionId, token, exp: expiresAt }),
    expiresAt,
    ttlSeconds: ttl,
  };
}
