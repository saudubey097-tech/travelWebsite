import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { PROTECTED_PREFIXES } from "@/lib/auth/routing";

// IMPORTANT: this middleware runs on the Edge runtime and only does a cheap
// "is there a session cookie at all" check, purely to bounce obviously
// signed-out visitors to /login without a page render. It is NOT the
// authorization boundary — Prisma/Postgres access isn't available here.
// Every protected layout/page/Server Action re-verifies the session against
// the database and the specific resource being accessed via
// requireUser()/requireRole() in src/lib/auth/session.ts. Treat this file as
// a UX shortcut, never as the security control.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const matched = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!matched) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/coordinator/:path*", "/driver/:path*", "/admin/:path*"],
};
