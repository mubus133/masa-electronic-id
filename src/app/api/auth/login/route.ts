import { NextRequest, NextResponse } from "next/server";
import { database, ensureReady } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; first: number }>();

function tooManyAttempts(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function noteFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

async function rejectLogin(key: string, userId: string | null, role: string | null) {
  noteFailure(key);
  await logAudit({
    actorUserId: userId,
    actorRole: role ?? "anonymous",
    action: "auth.login_failed",
    affectedRecordType: "user",
    affectedRecordId: userId,
    reason: "Failed sign-in attempt",
  });
  return NextResponse.json({ error: "That email or password is incorrect." }, { status: 401 });
}

export async function POST(req: NextRequest) {
  await ensureReady();
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const key = identifier;
    if (tooManyAttempts(key)) {
      return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
    }

    const db = database();
    const users = await db.query<any>(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
      [identifier]
    );

    const user = users[0];
    if (!user || !user.password_hash) return rejectLogin(key, null, null);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return rejectLogin(key, user.id, user.role);
    failures.delete(key);

    if (user.account_status !== "active") {
      return NextResponse.json({ error: `This account is ${user.account_status}. Contact IMASA administration.` }, { status: 403 });
    }

    // Set HTTP-only session cookie
    await createSessionCookie(user.id, user.role, user.email);

    // Update last login
    await db.query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);

    await logAudit({
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.login",
      affectedRecordType: "user",
      affectedRecordId: user.id,
      reason: "Successful login",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Sign-in failed. Try again in a moment." }, { status: 500 });
  }
}
