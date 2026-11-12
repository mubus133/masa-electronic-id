import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getAdminStats } from "@/lib/services/admin";

export async function GET() {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role !== "super_admin" && actor.role !== "administrator") {
      throw new Error("Admin overview access required.");
    }
    const stats = await getAdminStats();
    return { stats };
  });
}
