import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission } from "@/lib/auth";
import { completeSession } from "@/lib/services/sessions";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("sessions.manage");
    const { id } = await context.params;

    const result = await completeSession(id, actor);
    return {
      success: true,
      session: result.session,
      issuedCount: result.issuedCount,
      message: `Session completed successfully. Generated ${result.issuedCount} daily hostel entry authorizations.`,
    };
  });
}
