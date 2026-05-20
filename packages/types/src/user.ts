/**
 * Authoritative roles for the platform.
 *
 * - `admin`  → web administration dashboard ONLY.
 * - `driver` → mobile driver experience ONLY.
 * - `parent` → mobile parent experience ONLY.
 *
 * Anything else is treated as unauthorized.
 */
export type UserRole = "admin" | "driver" | "parent";

export const USER_ROLES: readonly UserRole[] = ["admin", "driver", "parent"] as const;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export type UserStatus = "active" | "inactive";

export const USER_STATUSES: readonly UserStatus[] = ["active", "inactive"] as const;

/**
 * Row in the `users` Appwrite Table. Source of truth for authorization decisions.
 * Business tables (drivers, parents) link via `appwriteUserId` for backward compat;
 * the role itself ALWAYS comes from here for new accounts.
 */
export type User = {
  id: string;
  appwriteUserId: string;
  role: UserRole;
  status: UserStatus;
};

export type UserInput = {
  appwriteUserId: string;
  role: UserRole;
  status?: UserStatus;
};
