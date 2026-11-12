import { database } from "@/lib/db";
import { randomBytes } from "crypto";

export interface LogAuditParams {
  actorUserId?: string | null;
  actorRole: string;
  action: string;
  affectedRecordType?: string | null;
  affectedRecordId?: string | null;
  reason?: string | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  requestReference?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const db = database();
    const ref = params.requestReference || randomBytes(16).toString("hex");

    await db.query(
      `INSERT INTO audit_logs (
        actor_user_id, actor_role, action, affected_record_type, affected_record_id,
        reason, previous_value, new_value, ip_address, request_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.actorUserId || null,
        params.actorRole,
        params.action,
        params.affectedRecordType || null,
        params.affectedRecordId || null,
        params.reason || null,
        params.previousValue ? JSON.stringify(params.previousValue) : null,
        params.newValue ? JSON.stringify(params.newValue) : null,
        params.ipAddress || null,
        ref,
      ]
    );
  } catch (err) {
    // We do not let audit logging failure silently fail without log, but we don't crash main transaction
    console.error("Failed to write audit log:", err);
  }
}
