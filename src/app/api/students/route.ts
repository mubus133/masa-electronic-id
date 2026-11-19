import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { badRequest, canSearchStudents, forbidden, isActiveHostelStaff, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { listStudents, registerStudent } from "@/lib/services/students";
import type { StudentStatus } from "@/lib/types";

const STATUSES = new Set(["active", "suspended", "revoked", "graduated", "inactive"]);

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    if (actor.role === "student" || !canSearchStudents(actor)) throw forbidden("You can't browse student records.");

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const status = statusParam && STATUSES.has(statusParam) ? (statusParam as StudentStatus) : undefined;
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
    const hostelId = isActiveHostelStaff(actor) ? actor.hostelId! : url.searchParams.get("hostelId") || undefined;

    return listStudents({ search: url.searchParams.get("search") || undefined, hostelId, status, limit, offset });
  });
}

export async function POST(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    requireGrant(actor, "students.register");
    const body = await req.json().catch(() => ({}));
    if (!body.fullName?.trim() || !body.email?.trim()) throw badRequest("Full name and email are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw badRequest("Enter a valid email address.");

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
      actor,
    );
    return { success: true, student };
  });
}
