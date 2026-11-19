import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { forbidden, isActiveHostelStaff } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { redeemDailyAuthorization } from "@/lib/services/authorizations";

// Entry is recorded only by hostel staff, at their own hostel.
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isActiveHostelStaff(actor)) throw forbidden("Only hostel staff can confirm entry.");
    const { id } = await context.params;
    return redeemDailyAuthorization(id, actor.hostelId!, actor);
  });
}
