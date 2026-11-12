import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getSystemSettings } from "@/lib/services/sessions";
import { updateSystemSettings } from "@/lib/services/admin";
import { isPresident } from "@/lib/permissions";

export async function GET() {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role !== "super_admin" && actor.role !== "administrator") {
      throw new Error("Settings access restricted to administrators.");
    }
    const settings = await getSystemSettings();
    return { settings };
  });
}

export async function PATCH(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isPresident(actor)) {
      throw new Error("Only the President of IMASA (Super Admin) can modify operational settings.");
    }

    const body = await req.json();
    const settings = await updateSystemSettings(body, actor);
    return { success: true, settings };
  });
}
