import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { submitQrScan } from "@/lib/services/attendance";

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const body = await req.json();

    if (!body.qrPayload) {
      throw new Error("Missing QR code payload.");
    }

    const attendance = await submitQrScan({ qrPayload: body.qrPayload }, actor);
    return {
      success: true,
      attendance,
      message: "Attendance scan recorded successfully! Status is PENDING teacher physical verification.",
    };
  });
}
