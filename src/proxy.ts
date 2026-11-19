import { NextResponse, type NextRequest } from "next/server";
import { peekPayload } from "@/lib/crypto";
import { homeForRole, type Role } from "@/lib/permissions";

// Optimistic gate only (the cookie isn't verified here): sends signed-out visitors to sign-in and keeps each role
// in its own portal. Every API route still checks the account and permissions.
const AREAS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/student", roles: ["student"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/hostel", roles: ["hostel_staff"] },
  { prefix: "/admin", roles: ["super_admin", "administrator"] },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = AREAS.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  const session = peekPayload<{ role: Role; exp: number }>(request.cookies.get("imasa_session")?.value);
  const signedIn = session && session.exp > Date.now() / 1000;

  if (pathname === "/login" && signedIn) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  if (!area) return NextResponse.next();
  if (!signedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!area.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/student/:path*", "/teacher/:path*", "/hostel/:path*", "/admin/:path*"],
};
