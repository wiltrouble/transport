import { cookies } from "next/headers";
import { Storage, TablesDB } from "appwrite";
import {
  createServerAppwriteClient,
  createServerAppwriteWithFallback,
} from "@/lib/appwrite";
import {
  APPWRITE_FALLBACK_COOKIE,
  APPWRITE_SESSION_COOKIE,
} from "@/lib/auth-config";

/**
 * Authenticated Appwrite client for Server Components, Server Actions, and Route Handlers.
 */
export async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const secret = cookieStore.get(APPWRITE_SESSION_COOKIE)?.value;
  if (secret?.length) {
    return createServerAppwriteClient(secret).client;
  }
  const fallback = cookieStore.get(APPWRITE_FALLBACK_COOKIE)?.value;
  if (fallback?.length) {
    return createServerAppwriteWithFallback(fallback).client;
  }
  throw new Error("No autenticado");
}

export async function getServerTablesDB(): Promise<TablesDB> {
  return new TablesDB(await getAuthenticatedClient());
}

export async function getServerStorage(): Promise<Storage> {
  return new Storage(await getAuthenticatedClient());
}
