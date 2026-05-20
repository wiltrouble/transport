import { Account, Client } from "appwrite";
import type { Models } from "appwrite";

/**
 * Public Appwrite settings (safe to expose to the browser via NEXT_PUBLIC_*).
 */
export function getAppwriteConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_APPWRITE_ENDPOINT or NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }
  return { endpoint, projectId };
}

/**
 * Browser Appwrite client (singleton). Session is applied by the SDK after
 * `createEmailPasswordSession` and via `setSession` when restoring from our API.
 */
let browserClient: Client | undefined;

export function getBrowserAppwriteClient(): Client {
  if (typeof window === "undefined") {
    throw new Error("getBrowserAppwriteClient must run in the browser");
  }
  if (!browserClient) {
    const { endpoint, projectId } = getAppwriteConfig();
    browserClient = new Client().setEndpoint(endpoint).setProject(projectId);
  }
  return browserClient;
}

export function getBrowserAccount(): Account {
  return new Account(getBrowserAppwriteClient());
}

/**
 * Clears any existing Appwrite session in this tab (API + SDK headers + cookieFallback).
 * Required before `createEmailPasswordSession` if a session is already active.
 */
export async function clearBrowserAppwriteSession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await getBrowserAccount().deleteSession({ sessionId: "current" });
  } catch {
    // No session, expired session, or offline — still reset local client state.
  }
  try {
    if (browserClient) {
      browserClient.setSession("");
      delete browserClient.headers["X-Fallback-Cookies"];
    }
    window.localStorage.removeItem("cookieFallback");
  } catch {
    // ignore
  }
  browserClient = undefined;
}

/**
 * Server / Route Handler client. Pass the session secret from the HttpOnly cookie.
 */
export function createServerAppwriteClient(sessionSecret: string): {
  client: Client;
  account: Account;
} {
  const { endpoint, projectId } = getAppwriteConfig();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(sessionSecret);
  return { client, account: new Account(client) };
}

/**
 * Server-side client using Appwrite’s cookie fallback (same header the web SDK sends
 * from `localStorage.cookieFallback` when the session secret is not in the JSON body).
 */
export function createServerAppwriteWithFallback(fallbackCookies: string): {
  client: Client;
  account: Account;
} {
  const { endpoint, projectId } = getAppwriteConfig();
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
  client.headers["X-Fallback-Cookies"] = fallbackCookies;
  return { client, account: new Account(client) };
}

export type AppwriteUser = Models.User<Models.DefaultPreferences>;
