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
