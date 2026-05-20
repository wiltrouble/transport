import "server-only";

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import type { AppwriteUser } from "@/lib/appwrite";
import { driverService } from "@/services/driverService";
import { parentService } from "@/services/parentService";
import { usersService } from "@/services/usersService";
import type { UserRole, UserStatus } from "@school/types";

export type AuthorizedUser = {
  user: AppwriteUser;
  role: UserRole | null;
  status: UserStatus;
  /** Tells how the role was resolved — useful for logs/diagnostics. */
  source: "users-table" | "drivers-table" | "parents-table" | "admin-bootstrap" | "unknown";
};

function getBootstrapAdminIds(): Set<string> {
  const raw = process.env.ADMIN_APPWRITE_USER_IDS;
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0),
  );
}

/**
 * Resolve the role of the currently authenticated Appwrite user.
 *
 * Resolution order (first hit wins):
 *   1. `users` table row (the authoritative source going forward).
 *   2. Legacy fallback: `drivers` table → role=driver. Preserves backward
 *      compatibility with accounts provisioned before the users table existed.
 *   3. Legacy fallback: `parents` table → role=parent.
 *   4. Bootstrap admins via `ADMIN_APPWRITE_USER_IDS` env (helps seed the
 *      first admin without manually inserting a users row).
 *   5. Otherwise → role is `null` (treated as unauthorized).
 *
 * Returns `null` only when no Appwrite session exists.
 */
export async function getAuthorizedUser(): Promise<AuthorizedUser | null> {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  try {
    const usersRow = await usersService.getByAppwriteUserId(user.$id, {
      client: "admin",
    });
    if (usersRow) {
      return {
        user,
        role: usersRow.role,
        status: usersRow.status,
        source: "users-table",
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authorization] users table lookup failed", error);
    }
  }

  try {
    const driver = await driverService.getByAppwriteUserId(user.$id);
    if (driver) {
      return {
        user,
        role: "driver",
        status: driver.status ? "active" : "inactive",
        source: "drivers-table",
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authorization] drivers fallback failed", error);
    }
  }

  try {
    const parent = await parentService.getByAppwriteUserId(user.$id);
    if (parent) {
      return {
        user,
        role: "parent",
        status: parent.status ? "active" : "inactive",
        source: "parents-table",
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authorization] parents fallback failed", error);
    }
  }

  if (getBootstrapAdminIds().has(user.$id)) {
    return { user, role: "admin", status: "active", source: "admin-bootstrap" };
  }

  return { user, role: null, status: "inactive", source: "unknown" };
}

export type RequireRoleOptions = {
  /** Required role(s). When omitted, only an active session is required. */
  roles?: UserRole | UserRole[];
  /**
   * When the user is logged-in but lacks the required role, redirect to this
   * URL instead of /unauthorized. Useful for landing pages that branch by role.
   */
  unauthorizedRedirect?: string;
};

/**
 * Guard for Server Components / Server Actions / Route Handlers.
 *
 * - No session → redirect to `/login`.
 * - Wrong role / inactive → redirect to `/unauthorized?reason=...`.
 *
 * NEVER returns when a redirect is triggered (Next.js throws).
 */
export async function requireRole(options: RequireRoleOptions = {}): Promise<AuthorizedUser> {
  const authorized = await getAuthorizedUser();
  if (!authorized) {
    redirect("/login");
  }

  if (authorized.status !== "active") {
    redirect(options.unauthorizedRedirect ?? "/unauthorized?reason=inactive");
  }

  const required = options.roles
    ? Array.isArray(options.roles)
      ? options.roles
      : [options.roles]
    : null;

  if (required && (authorized.role === null || !required.includes(authorized.role))) {
    redirect(options.unauthorizedRedirect ?? buildUnauthorizedUrl(required, authorized.role));
  }

  return authorized;
}

export function buildUnauthorizedUrl(
  required: UserRole[],
  actual: UserRole | null,
): string {
  const params = new URLSearchParams({
    required: required.join(","),
    actual: actual ?? "none",
  });
  return `/unauthorized?${params.toString()}`;
}

/** Admin-only guard (web dashboard, admin APIs, admin server actions). */
export function requireAdmin(): Promise<AuthorizedUser> {
  return requireRole({ roles: "admin" });
}

/** Driver guard for any future driver-facing web endpoint (kept symmetric). */
export function requireDriver(): Promise<AuthorizedUser> {
  return requireRole({ roles: "driver" });
}

/** Parent guard for any future parent-facing web endpoint (kept symmetric). */
export function requireParent(): Promise<AuthorizedUser> {
  return requireRole({ roles: "parent" });
}

/**
 * Asserts the current session's role is one of `allowed`. Returns the resolved
 * role (or null when no session exists). Use this from API routes that want to
 * craft their own JSON error responses instead of redirecting.
 */
export async function validateSessionRole(
  allowed: UserRole[],
): Promise<{
  ok: boolean;
  authorized: AuthorizedUser | null;
  reason: "no-session" | "wrong-role" | "inactive" | null;
}> {
  const authorized = await getAuthorizedUser();
  if (!authorized) return { ok: false, authorized: null, reason: "no-session" };
  if (authorized.status !== "active") {
    return { ok: false, authorized, reason: "inactive" };
  }
  if (!authorized.role || !allowed.includes(authorized.role)) {
    return { ok: false, authorized, reason: "wrong-role" };
  }
  return { ok: true, authorized, reason: null };
}

/**
 * Convenience for API/server-action layers: throws `AuthorizationError` when
 * the user is not an active admin. Catch upstream and translate to a 401/403.
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly code: "no-session" | "wrong-role" | "inactive",
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function assertAdminApiCaller(): Promise<AuthorizedUser> {
  const result = await validateSessionRole(["admin"]);
  if (!result.ok || !result.authorized) {
    throw new AuthorizationError(
      result.reason === "no-session" ? "No autenticado" : "Acceso denegado",
      (result.reason ?? "wrong-role") as AuthorizationError["code"],
    );
  }
  return result.authorized;
}
