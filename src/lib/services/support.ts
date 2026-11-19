import { database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";
import type { Actor } from "@/lib/permissions";
import type { SupportRequest } from "@/lib/types";

export async function createSupportRequest(input: {
  userId?: string | null;
  category: "technical" | "dispute" | "account" | "other";
  subject: string;
  message: string;
}): Promise<SupportRequest> {
  const subject = String(input.subject ?? "").trim().slice(0, 200);
  const message = String(input.message ?? "").trim().slice(0, 5000);
  if (!subject || !message) throw new DomainError("Add a subject and a message.", 400);
  const category = ["technical", "dispute", "account", "other"].includes(input.category) ? input.category : "other";

  const db = database();
  const rows = await db.query<SupportRequest>(
    `INSERT INTO support_requests (user_id, category, subject, message, status)
     VALUES ($1, $2, $3, $4, 'open')
     RETURNING *`,
    [input.userId || null, category, subject, message]
  );

  return rows[0];
}

export async function listSupportRequests(status?: string): Promise<SupportRequest[]> {
  const db = database();
  const params: unknown[] = [];
  let filter = "";
  if (status) {
    params.push(status);
    filter = "WHERE sr.status = $1";
  }

  return await db.query<any>(
    `SELECT sr.*, u.full_name as user_name, u.email as user_email
     FROM support_requests sr
     LEFT JOIN users u ON u.id = sr.user_id
     ${filter}
     ORDER BY sr.created_at DESC`,
    params
  );
}

export async function resolveSupportRequest(
  id: string,
  resolution: string,
  actor: Actor
): Promise<SupportRequest> {
  const db = database();
  const rows = await db.query<SupportRequest>(
    `UPDATE support_requests
     SET status = 'closed', resolution = $2
     WHERE id = $1
     RETURNING *`,
    [id, resolution.trim()]
  );

  if (!rows[0]) throw new DomainError("Support request not found.", 404);

  await logAudit({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "support.resolved",
    affectedRecordType: "support_request",
    affectedRecordId: id,
    reason: `Support request resolved: ${resolution.trim()}`,
  });

  return rows[0];
}
