import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { forbidden } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { isPresident } from "@/lib/permissions";
import { updateAdministratorPermissions } from "@/lib/services/admin";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isPresident(actor)) {
      throw forbidden("Only the President of IMASA can modify administrator permissions.");
    }

    const { id } = await context.params;
    const body = await req.json();

    if (!Array.isArray(body.permissions)) {
      throw forbidden("Permissions must be an array of permission keys.");
    }

    const result = await updateAdministratorPermissions(id, body.permissions, actor);
    return result;
  });
}
