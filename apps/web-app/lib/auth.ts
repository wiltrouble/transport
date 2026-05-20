import { cookies } from "next/headers";
import {
  createServerAppwriteClient,
  createServerAppwriteWithFallback,
  type AppwriteUser,
} from "@/lib/appwrite";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

/**
 * Reads the mirrored Appwrite session from cookies and returns the user, or null.
 * Supports either a session secret or Appwrite’s `X-Fallback-Cookies` payload (Cloud /
 * browser flows that omit `secret` in JSON).
 */
export async function getAuthenticatedUser(): Promise<AppwriteUser | null> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(APPWRITE_SESSION_COOKIE)?.value;
  if (secret?.length) {
    try {
      const { account } = createServerAppwriteClient(secret);
      return await account.get();
    } catch {
      // Invalid secret cookie — try fallback if present.
    }
  }

  const fallback = cookieStore.get(APPWRITE_FALLBACK_COOKIE)?.value;
  if (!fallback?.length) {
    return null;
  }
  try {
    const { account } = createServerAppwriteWithFallback(fallback);
    return await account.get();
  } catch {
    return null;
  }
}

/**
 * Max-Age (seconds) for the session cookie, derived from Appwrite session expiry when available.
 */
export function cookieMaxAgeSeconds(expireIso?: string): number {
  if (!expireIso) {
    return 60 * 60 * 24 * 30;
  }
  const diffMs = new Date(expireIso).getTime() - Date.now();
  return Math.max(120, Math.floor(diffMs / 1000));
}
