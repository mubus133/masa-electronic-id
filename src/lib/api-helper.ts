import { NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { DomainError, publicError } from "@/lib/errors";

export async function handleApiRoute<T>(handler: () => Promise<T>) {
  try {
    await ensureReady();
    const result = await handler();
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = publicError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
