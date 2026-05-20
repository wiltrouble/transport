import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createServerAppwriteClient,
  createServerAppwriteWithFallback,
  type AppwriteUser,
} from "@/lib/appwrite";
import { cookieMaxAgeSeconds } from "@/lib/auth";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_ROLE_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";
import { driverService } from "@/services/driverService";
import { parentService } from "@/services/parentService";
import { usersService } from "@/services/usersService";
import type { UserRole } from "@school/types";

type SessionBody = {
  secret?: string;
  /** Value from `localStorage.getItem("cookieFallback")` after browser login */
  fallbackCookies?: string;
  expire?: string;
};

function getBootstrapAdminIds(): Set<string> {
  const raw = process.env.ADMIN_APPWRITE_USER_IDS;
  if (!raw) return new Set();
  return new Set(raw.split(",").map((v) => v.trim()).filter(Boolean));
}

/**
 * Resolve the authoritative role for the just-authenticated user using the
 * admin client (so this works even when the user has no ACL on the users row).
 * Mirrors `lib/authorization.getAuthorizedUser` but accepts the freshly
 * fetched Appwrite user — we cannot read cookies yet here because we are
 * still inside the login handshake.
 */
async function resolveRoleForUser(user: AppwriteUser): Promise<UserRole | null> {
  try {
    const row = await usersService.getByAppwriteUserId(user.$id, { client: "admin" });
    if (row && row.status === "active") return row.role;
    if (row && row.status === "inactive") return null;
  } catch {
    // Fall through to legacy lookups when the users table is unavailable.
  }

  try {
    const driver = await driverService.getByAppwriteUserId(user.$id);
    if (driver?.status) return "driver";
  } catch {
    // ignore
  }
  try {
    const parent = await parentService.getByAppwriteUserId(user.$id);
    if (parent?.status) return "parent";
  } catch {
    // ignore
  }

  if (getBootstrapAdminIds().has(user.$id)) return "admin";
  return null;
}

/**
 * Persists the Appwrite session secret in an HttpOnly cookie on our origin so that
 * middleware and Server Components can treat the user as authenticated after refresh.
 *
 * SECURITY: this endpoint is admin-only. Drivers and parents may have valid
 * Appwrite sessions (mobile app) but MUST be rejected here so they cannot
 * obtain web-dashboard cookies. The role is resolved from the authoritative
 * `users` table (with backward-compatible fallbacks to drivers/parents).
 */
export async function POST(request: Request) {
  let body: SessionBody;
  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const secret = typeof body.secret === "string" ? body.secret.trim() : "";
  const fallbackCookies =
    typeof body.fallbackCookies === "string" ? body.fallbackCookies.trim() : "";

  if (!secret && !fallbackCookies) {
    return NextResponse.json(
      { error: "Provide session secret or fallbackCookies" },
      { status: 400 },
    );
  }

  if (secret && fallbackCookies) {
    return NextResponse.json(
      { error: "Send only one of secret or fallbackCookies" },
      { status: 400 },
    );
  }

  let user: AppwriteUser;
  let revokeSession: () => Promise<void>;
  try {
    if (secret) {
      const { account } = createServerAppwriteClient(secret);
      user = await account.get();
      revokeSession = async () => {
        try {
          await account.deleteSession({ sessionId: "current" });
        } catch {
          // best-effort
        }
      };
    } else {
      const { account } = createServerAppwriteWithFallback(fallbackCookies);
      user = await account.get();
      revokeSession = async () => {
        try {
          await account.deleteSession({ sessionId: "current" });
        } catch {
          // best-effort
        }
      };
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const role = await resolveRoleForUser(user);

  if (role !== "admin") {
    // CRITICAL: revoke the just-created session so the rejected user cannot
    // continue authenticated in their browser tab against Appwrite directly.
    await revokeSession();
    return NextResponse.json(
      {
        error:
          role === "driver" || role === "parent"
            ? "Esta cuenta solo tiene acceso a la aplicación móvil. Use la app de Transporte Escolar para iniciar sesión."
            : "Su cuenta no tiene permisos para acceder al panel administrativo.",
        code: "FORBIDDEN_ROLE",
        role,
      },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const maxAge = cookieMaxAgeSeconds(
    typeof body.expire === "string" ? body.expire : undefined,
  );

  const baseOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };

  if (secret) {
    cookieStore.set(APPWRITE_SESSION_COOKIE, secret, baseOpts);
    cookieStore.delete(APPWRITE_FALLBACK_COOKIE);
  } else {
    cookieStore.set(APPWRITE_FALLBACK_COOKIE, fallbackCookies, baseOpts);
    cookieStore.delete(APPWRITE_SESSION_COOKIE);
  }

  // Cache the role for cheap middleware checks. Server still re-validates from
  // the users table on every protected request (see lib/authorization.ts).
  cookieStore.set(APPWRITE_ROLE_COOKIE, role, baseOpts);

  return NextResponse.json({ ok: true, role });
}
