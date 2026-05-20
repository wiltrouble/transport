import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createServerAppwriteClient,
  createServerAppwriteWithFallback,
} from "@/lib/appwrite";
import { cookieMaxAgeSeconds } from "@/lib/auth";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

type SessionBody = {
  secret?: string;
  /** Value from `localStorage.getItem("cookieFallback")` after browser login */
  fallbackCookies?: string;
  expire?: string;
};

/**
 * Persists the Appwrite session secret in an HttpOnly cookie on our origin so that
 * middleware and Server Components can treat the user as authenticated after refresh.
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

  try {
    if (secret) {
      const { account } = createServerAppwriteClient(secret);
      await account.get();
    } else {
      const { account } = createServerAppwriteWithFallback(fallbackCookies);
      await account.get();
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
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

  return NextResponse.json({ ok: true });
}
