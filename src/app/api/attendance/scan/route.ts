import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { submitQrScan } from "@/lib/services/attendance";

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const body = await req.json().catch(() => ({}));
    const qrPayload = typeof body.qrPayload === "string" ? body.qrPayload : undefined;
    const code = typeof body.code === "string" ? body.code : undefined;
    if (!qrPayload && !code) throw badRequest("Scan the code, or type it in.");
    const attendance = await submitQrScan({ qrPayload, code }, actor);
    return { success: true, attendance };
  });
}
