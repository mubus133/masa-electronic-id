import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { ensureReady } from "@/lib/db";
import { getSystemSettings } from "@/lib/services/sessions";

export async function GET() {
  await ensureReady();
  const [actor, settings] = await Promise.all([getCurrentActor(), getSystemSettings()]);
  const timezone = settings.timezone || "Africa/Lagos";
  if (!actor) return NextResponse.json({ authenticated: false, actor: null, timezone });
  return NextResponse.json({ authenticated: true, actor, timezone });
}
