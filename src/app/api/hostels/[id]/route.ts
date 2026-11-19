import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest, forbidden, isAdministrator } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { getHostelById } from "@/lib/services/hostels";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isAdministrator(actor) && actor.hostelId !== (await context.params).id) throw forbidden("You can't view this hostel.");
    const { id } = await context.params;
    const hostel = await getHostelById(id);
    if (!hostel) {
      throw badRequest("Hostel not found.");
    }
    return { hostel };
  });
}
