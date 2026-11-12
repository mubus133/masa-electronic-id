import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requireActor } from "@/lib/auth";
import { isPresident } from "@/lib/permissions";
import { listAdministrators, createAdministrator } from "@/lib/services/admin";

export async function GET() {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isPresident(actor)) {
      throw new Error("Only the President of IMASA can view the full administrator roster.");
    }
    const administrators = await listAdministrators();
    return { administrators };
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (!isPresident(actor)) {
      throw new Error("Only the President of IMASA can appoint delegated administrators.");
    }

    const body = await req.json();
    if (!body.fullName || !body.email) {
      throw new Error("Full name and email are required.");
    }

    const admin = await createAdministrator(
      {
        fullName: body.fullName,
        email: body.email,
        password: body.password,
        permissions: body.permissions || [],
      },
      actor
    );

    return { success: true, administrator: admin };
  });
}
