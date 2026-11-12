import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { getHostelById } from "@/lib/services/hostels";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    await requireActor();
    const { id } = await context.params;
    const hostel = await getHostelById(id);
    if (!hostel) {
      throw new Error("Hostel not found.");
    }
    return { hostel };
  });
}
