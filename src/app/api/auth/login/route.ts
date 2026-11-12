import { NextRequest, NextResponse } from "next/server";
import { database, ensureReady } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSessionCookie, clearSessionCookie, getCurrentActor } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { DomainError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  await ensureReady();
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Please enter your email/username and password." }, { status: 400 });
    }

    const db = database();
    const users = await db.query<any>(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
      [identifier]
    );

    const user = users[0];
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid credentials. Please verify your email and password." }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials. Please verify your email and password." }, { status: 401 });
    }

    if (user.account_status !== "active") {
      return NextResponse.json({ error: `Account is ${user.account_status}. Please contact IMASA administration.` }, { status: 403 });
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
    return NextResponse.json({ error: "An error occurred during authentication." }, { status: 500 });
  }
}
