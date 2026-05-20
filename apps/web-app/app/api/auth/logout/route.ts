import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createServerAppwriteClient,
  createServerAppwriteWithFallback,
} from "@/lib/appwrite";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

/**
 * Deletes the current Appwrite session and clears the mirrored session cookie(s).
 */
export async function POST() {
  const cookieStore = await cookies();
  const secret = cookieStore.get(APPWRITE_SESSION_COOKIE)?.value;
  const fallback = cookieStore.get(APPWRITE_FALLBACK_COOKIE)?.value;

  if (secret?.length) {
    try {
      const { account } = createServerAppwriteClient(secret);
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Still clear cookies so the user can recover client-side state.
    }
  } else if (fallback?.length) {
    try {
      const { account } = createServerAppwriteWithFallback(fallback);
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // Same as above.
    }
  }

  cookieStore.delete(APPWRITE_SESSION_COOKIE);
  cookieStore.delete(APPWRITE_FALLBACK_COOKIE);

  return NextResponse.json({ ok: true });
}
