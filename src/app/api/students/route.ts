import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { requirePermission, requireActor } from "@/lib/auth";
import { listStudents, registerStudent } from "@/lib/services/students";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    await requireActor();
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const hostelId = url.searchParams.get("hostelId") || undefined;
    const status = (url.searchParams.get("status") as any) || undefined;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : undefined;

    return await listStudents({ search, hostelId, status, limit, offset });
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requirePermission("students.register");
    const body = await req.json();

    if (!body.fullName || !body.email) {
      throw new Error("Full name and email are required for student registration.");
    }

    const student = await registerStudent(
      {
        fullName: body.fullName,
        email: body.email,
        password: body.password,
        hostelId: body.hostelId,
        classGroup: body.classGroup,
        phone: body.phone,
        emergencyContact: body.emergencyContact,
        photographUrl: body.photographUrl,
      },
      actor
    );

    return { success: true, student };
  });
}
