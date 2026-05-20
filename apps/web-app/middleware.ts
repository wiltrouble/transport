import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_ROLE_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

/**
 * Edge gate for the admin dashboard.
 *
 * SECURITY model:
 *  - This middleware is a fast first line of defense — it can read cookies
 *    but cannot call Appwrite. It rejects obvious unauthorized requests
 *    (no session, wrong role cookie) early.
 *  - Every dashboard page additionally calls `requireAdmin()` server-side
 *    in the layout, which re-validates the cookie + role against the `users`
 *    Appwrite Table on every request. Cookie tampering cannot bypass that.
 */
const PUBLIC_PATHS = new Set(["/login", "/unauthorized"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(APPWRITE_SESSION_COOKIE)?.value;
  const fallbackCookie = request.cookies.get(APPWRITE_FALLBACK_COOKIE)?.value;
  const roleCookie = request.cookies.get(APPWRITE_ROLE_COOKIE)?.value ?? null;
  const hasSession = Boolean(sessionCookie?.length || fallbackCookie?.length);

  // /api/auth/* always runs the route handler (logout must work without cookies;
  // session must run the role check) — let it through.
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Admin-only API namespace: must have an admin role cookie OR a session that
  // the route can validate. We keep this loose at the edge and rely on
  // `assertAdminApiCaller()` inside handlers for the authoritative check.
  if (pathname.startsWith("/api/")) {
    if (!hasSession) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (roleCookie && roleCookie !== "admin" && !pathname.startsWith("/api/mobile/")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === "/login" && hasSession && roleCookie === "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Authenticated session but role cookie says they are not an admin → block.
  // (When the cookie is missing we let the request through; the dashboard
  // layout's `requireAdmin()` will resolve the role from the users table.)
  if (roleCookie && roleCookie !== "admin") {
    const url = new URL("/unauthorized", request.url);
    url.searchParams.set("required", "admin");
    url.searchParams.set("actual", roleCookie);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
