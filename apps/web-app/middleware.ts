import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

/**
 * Lightweight gate: presence of the mirrored session cookie.
 * Actual validity is checked in Server Components and API routes via Appwrite.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(APPWRITE_SESSION_COOKIE)?.value;
  const fallbackCookie = request.cookies.get(APPWRITE_FALLBACK_COOKIE)?.value;
  const hasSession = Boolean(
    sessionCookie?.length || fallbackCookie?.length,
  );

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname !== "/login" && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
