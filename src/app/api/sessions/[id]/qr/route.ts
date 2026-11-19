import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { generateSessionQr } from "@/lib/services/qr";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const { id } = await context.params;
    return { success: true, ...(await generateSessionQr(id, actor)) };
  });
}
