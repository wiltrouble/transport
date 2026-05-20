/**
 * Cookie used to mirror the Appwrite session secret on our origin.
 * Middleware checks for presence; API routes and RSC validate with Appwrite.
 */
export const APPWRITE_SESSION_COOKIE = "school-transport-appwrite-session";

/**
 * When Appwrite omits `session.secret` in the browser, it stores session state in
 * localStorage (`cookieFallback`) and expects `X-Fallback-Cookies` on requests.
 * We mirror that payload here so Server Components / middleware can authenticate.
 */
export const APPWRITE_FALLBACK_COOKIE = "school-transport-appwrite-fallback";

/**
 * Cookie mirror of the authoritative `users.role` for the active session.
 *
 * IMPORTANT: this cookie is HttpOnly but still client-tamperable (it can be
 * deleted from devtools). It exists ONLY to let Edge middleware fast-path
 * /dashboard/* requests without an Appwrite round trip. The real
 * authorization check happens server-side via `requireAdmin()` in the
 * dashboard layout and in any API route that mutates data.
 */
export const APPWRITE_ROLE_COOKIE = "school-transport-role";
