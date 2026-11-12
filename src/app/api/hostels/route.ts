import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor, requirePermission } from "@/lib/auth";
import { listHostels, createHostel } from "@/lib/services/hostels";

export async function GET() {
  return handleApiRoute(async () => {
    await requireActor();
    const hostels = await listHostels();
    return { hostels };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("hostels.manage");
    const body = await req.json();

    if (!body.hostelName) {
      throw new Error("Hostel name is required.");
    }

    const hostel = await createHostel(body.hostelName, body.hostelLocation || null, actor);
    return { success: true, hostel };
  });
}
