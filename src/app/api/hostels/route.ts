import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest, forbidden, isAdministrator } from "@/lib/access";
import { requireActor, requirePermission } from "@/lib/auth";
import { listHostels, createHostel } from "@/lib/services/hostels";

export async function GET() {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isAdministrator(actor)) throw forbidden("You can't view the hostel list.");
    const hostels = await listHostels();
    return { hostels };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("hostels.manage");
    const body = await req.json();

    if (!body.hostelName) {
      throw badRequest("Hostel name is required.");
    }

    const hostel = await createHostel(body.hostelName, body.hostelLocation || null, actor);
    return { success: true, hostel };
  });
}
