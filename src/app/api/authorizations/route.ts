import { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api-helper";
import { forbidden, requireGrant } from "@/lib/access";
import { requireActor } from "@/lib/auth";
import { listAllAuthorizations, listStudentAuthorizations } from "@/lib/services/authorizations";

export async function GET(req: NextRequest) {
  return handleApiRoute(async () => {
    const actor = await requireActor();
    const studentId = new URL(req.url).searchParams.get("studentId");

    if (actor.role === "student") {
      if (!actor.studentId || (studentId && studentId !== actor.studentId)) {
        throw forbidden("You can only view your own passes.");
      }
      return { authorizations: await listStudentAuthorizations(actor.studentId) };
    }

    requireGrant(actor, "authorizations.view");
    if (studentId) return { authorizations: await listStudentAuthorizations(studentId) };
    return { authorizations: await listAllAuthorizations() };
  });
}
