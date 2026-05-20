import * as SecureStore from "expo-secure-store";
import type { Models } from "appwrite";
import {
  clearClientSession,
  getAccount,
  getClientSessionSecret,
  SESSION_KEY,
  setClientSession,
} from "@/lib/appwrite";

export type AuthSession = Models.Session;

async function persistSession(secret: string): Promise<void> {
  const trimmed = secret.trim();
  setClientSession(trimmed);
  if (trimmed) {
    await SecureStore.setItemAsync(SESSION_KEY, trimmed);
  }
}

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    const account = getAccount();
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      // no active session
    }

    const session = await account.createEmailPasswordSession({
      email: email.trim().toLowerCase(),
      password,
    });

    await persistSession(session.secret);
    return session;
  },

  async logout(): Promise<void> {
    try {
      await getAccount().deleteSession({ sessionId: "current" });
    } catch {
      // ignore
    }
    clearClientSession();
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async restoreSession(): Promise<boolean> {
    const secret = await SecureStore.getItemAsync(SESSION_KEY);
    if (!secret) return false;
    setClientSession(secret);
    try {
      await getAccount().get();
      return true;
    } catch {
      clearClientSession();
      await SecureStore.deleteItemAsync(SESSION_KEY);
      return false;
    }
  },

  async getCurrentUser(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await getAccount().get();
    } catch {
      return null;
    }
  },

  /** Credential for server routes (session secret or short-lived JWT). */
  async getServerAuthHeaders(): Promise<Record<string, string>> {
    const stored = await SecureStore.getItemAsync(SESSION_KEY);
    if (stored?.trim()) {
      return { "X-Appwrite-Session": stored.trim() };
    }

    const inMemory = getClientSessionSecret();
    if (inMemory) {
      return { "X-Appwrite-Session": inMemory };
    }

    const jwt = await getAccount().createJWT();
    if (jwt.jwt?.trim()) {
      return { "X-Appwrite-JWT": jwt.jwt.trim() };
    }

    throw new Error("Sin sesión de conductor.");
  },
};
