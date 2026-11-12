import { NextResponse } from "next/server";
import { getCurrentActor } from "@/lib/auth";
import { ensureReady } from "@/lib/db";

export async function GET() {
  await ensureReady();
  const actor = await getCurrentActor();
  if (!actor) {
    return NextResponse.json({ authenticated: false, actor: null });
  }

  return NextResponse.json({ authenticated: true, actor });
}
