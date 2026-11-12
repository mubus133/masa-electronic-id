import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { redeemDailyAuthorization } from "@/lib/services/authorizations";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role !== "hostel_staff" && actor.role !== "super_admin" && actor.role !== "administrator") {
      throw new Error("Only authorized hostel staff or administrators can confirm hostel entry.");
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const hostelId = body.hostelId || actor.hostelId;

    if (!hostelId) {
      throw new Error("Hostel assignment is required to redeem entry pass.");
    }

    const result = await redeemDailyAuthorization(id, hostelId, actor);
    return result;
  });
}
