import "server-only";

import { Client, ID, Query, TablesDB, Users } from "node-appwrite";

let adminClient: Client | undefined;

export function getAppwriteAdminConfig() {
  const endpoint =
    process.env.APPWRITE_ENDPOINT?.trim() ||
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim();
  const projectId =
    process.env.APPWRITE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
  const apiKey = process.env.APPWRITE_API_KEY?.trim();

  if (!endpoint || !projectId) {
    throw new Error(
      "Missing Appwrite endpoint or project ID. Set APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID or NEXT_PUBLIC_* equivalents.",
    );
  }
  if (!apiKey) {
    throw new Error(
      "Missing APPWRITE_API_KEY. Create a server API key with users.read and users.write scopes.",
    );
  }

  return { endpoint, projectId, apiKey };
}

export function getAppwriteAdminClient(): Client {
  if (!adminClient) {
    const { endpoint, projectId, apiKey } = getAppwriteAdminConfig();
    adminClient = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
  }
  return adminClient;
}

export function getAdminUsers(): Users {
  return new Users(getAppwriteAdminClient());
}

/** TablesDB with API key — bypasses row-level permissions (server-only). */
export function getAdminTablesDB(): TablesDB {
  return new TablesDB(getAppwriteAdminClient());
}

export type CreateAuthUserInput = {
  email: string;
  password: string;
  name: string;
};

export async function findAuthUserByEmail(email: string) {
  const users = getAdminUsers();
  const normalized = email.trim().toLowerCase();
  const result = await users.list({
    queries: [Query.equal("email", normalized), Query.limit(1)],
  });
  return result.users[0] ?? null;
}

export async function createAuthUser(input: CreateAuthUserInput) {
  const users = getAdminUsers();
  return users.create({
    userId: ID.unique(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    name: input.name.trim(),
  });
}

export async function deleteAuthUser(userId: string): Promise<void> {
  const users = getAdminUsers();
  await users.delete({ userId });
}
