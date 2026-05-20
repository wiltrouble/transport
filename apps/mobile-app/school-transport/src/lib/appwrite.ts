import { Account, Client, Realtime, TablesDB } from "appwrite";

const SESSION_KEY = "appwrite_session_secret";

let client: Client | null = null;
let realtime: Realtime | null = null;
let activeSessionSecret: string | null = null;

export function getAppwriteConfig() {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    throw new Error(
      "Missing EXPO_PUBLIC_APPWRITE_ENDPOINT or EXPO_PUBLIC_APPWRITE_PROJECT_ID",
    );
  }
  return { endpoint, projectId };
}

export function getAppwriteClient(): Client {
  if (!client) {
    const { endpoint, projectId } = getAppwriteConfig();
    client = new Client().setEndpoint(endpoint).setProject(projectId);
  }
  return client;
}

export function getAccount(): Account {
  return new Account(getAppwriteClient());
}

export function getTablesDB(): TablesDB {
  return new TablesDB(getAppwriteClient());
}

/** Single Realtime instance per Appwrite client (avoids duplicate WebSocket connections). */
export function getRealtime(): Realtime {
  if (!realtime) {
    realtime = new Realtime(getAppwriteClient());
  }
  return realtime;
}

export async function disconnectRealtime(): Promise<void> {
  if (!realtime) return;
  try {
    await realtime.disconnect();
  } catch {
    // ignore
  }
  realtime = null;
}

export function setClientSession(secret: string): void {
  const trimmed = secret.trim();
  activeSessionSecret = trimmed || null;
  getAppwriteClient().setSession(secret);
}

export function clearClientSession(): void {
  activeSessionSecret = null;
  getAppwriteClient().setSession("");
  void disconnectRealtime();
}

export function getClientSessionSecret(): string | null {
  return activeSessionSecret;
}

export { SESSION_KEY };
