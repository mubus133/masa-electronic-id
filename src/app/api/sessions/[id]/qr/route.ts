import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { generateSessionQr } from "@/lib/services/qr";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    // Teachers or authorized administrators can generate QR
    const actor = await requirePermission("qr.generate");
    const { id } = await context.params;

    const qr = await generateSessionQr(id, actor);
    return { success: true, ...qr };
  });
}
