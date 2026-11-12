import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor, requirePermission } from "@/lib/auth";
import { listHostelStaff, registerHostelStaff } from "@/lib/services/hostels";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requireActor();
    const url = new URL(req.url);
    const hostelId = url.searchParams.get("hostelId") || undefined;
    const staff = await listHostelStaff(hostelId);
    return { staff };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("hostels.manage");
    const body = await req.json();

    if (!body.fullName || !body.email || !body.hostelId) {
      throw new Error("Full name, email, and hostel ID are required.");
    }

    const staff = await registerHostelStaff(
      {
        fullName: body.fullName,
        email: body.email,
        hostelId: body.hostelId,
        password: body.password,
      },
      actor
    );

    return { success: true, staff };
  });
}
