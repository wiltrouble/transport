import "server-only";

import { ID, Query as SessionQuery } from "appwrite";
import { Query as AdminQuery } from "node-appwrite";
import { getAdminTablesDB } from "@/lib/appwrite-admin";
import { getServerTablesDB } from "@/lib/appwrite-session";
import { mapUser } from "@/lib/mappers";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  type AppwriteRow,
} from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { User, UserInput, UserRole, UserStatus } from "@school/types";
import { isUserRole } from "@school/types";

const FETCH_LIMIT = 100;

type UserClient = "session" | "admin";

async function findWithSession(appwriteUserId: string): Promise<User | null> {
  const tablesDB = await getServerTablesDB();
  const { databaseId, usersTableId } = getTablesConfig();
  try {
    const result = await tablesDB.listRows({
      databaseId,
      tableId: usersTableId,
      queries: [SessionQuery.equal("appwriteUserId", appwriteUserId), SessionQuery.limit(1)],
    });
    if (result.rows.length > 0) {
      return mapUser(result.rows[0] as AppwriteRow);
    }
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }
  const all = await tablesDB.listRows({
    databaseId,
    tableId: usersTableId,
    queries: [SessionQuery.limit(FETCH_LIMIT)],
  });
  const match = (all.rows as AppwriteRow[]).find(
    (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
  );
  return match ? mapUser(match) : null;
}

async function findWithAdmin(appwriteUserId: string): Promise<User | null> {
  const tablesDB = getAdminTablesDB();
  const { databaseId, usersTableId } = getTablesConfig();
  try {
    const result = await tablesDB.listRows({  
      databaseId,
      tableId: usersTableId,
      queries: [AdminQuery.equal("appwriteUserId", appwriteUserId), AdminQuery.limit(1)],
    });
    if (result.rows.length > 0) {
      return mapUser(result.rows[0] as AppwriteRow);
    }
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
  }
  const all = await tablesDB.listRows({
    databaseId,
    tableId: usersTableId,
    queries: [AdminQuery.limit(FETCH_LIMIT)],
  });
  const match = (all.rows as AppwriteRow[]).find(
    (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
  );
  return match ? mapUser(match) : null;
}

/**
 * Centralized access to the `users` Appwrite Table — the single source of truth
 * for role-based authorization across web and mobile.
 */
export const usersService = {
  /**
   * Find the role row for a given Appwrite Auth user.
   *
   * Pass `client: "admin"` from API routes / middleware so we can resolve the
   * role even when the user's Appwrite ACL doesn't grant read on this row.
   */
  async getByAppwriteUserId(
    appwriteUserId: string,
    options: { client?: UserClient } = {},
  ): Promise<User | null> {
    if (!appwriteUserId) return null;
    return options.client === "admin"
      ? findWithAdmin(appwriteUserId)
      : findWithSession(appwriteUserId);
  },

  async ensureForAppwriteUser(
    appwriteUserId: string,
    role: UserRole,
    options: { client?: UserClient; status?: UserStatus } = {},
  ): Promise<User> {
    if (!isUserRole(role)) {
      throw new Error(`Rol no válido: ${String(role)}`);
    }
    const existing = await this.getByAppwriteUserId(appwriteUserId, options);
    if (existing) return existing;
    return this.create(
      { appwriteUserId, role, status: options.status ?? "active" },
      options,
    );
  },

  async create(input: UserInput, options: { client?: UserClient } = {}): Promise<User> {
    if (!isUserRole(input.role)) {
      throw new Error(`Rol no válido: ${String(input.role)}`);
    }
    const { databaseId, usersTableId } = getTablesConfig();
    const data = {
      appwriteUserId: input.appwriteUserId,
      role: input.role,
      status: input.status ?? "active",
    };
    if (options.client === "session") {
      const tablesDB = await getServerTablesDB();
      const row = await tablesDB.createRow({
        databaseId,
        tableId: usersTableId,
        rowId: ID.unique(),
        data,
      });
      return mapUser(row as AppwriteRow);
    }
    const tablesDB = getAdminTablesDB();
    const row = await tablesDB.createRow({
      databaseId,
      tableId: usersTableId,
      rowId: ID.unique(),
      data,
    });
    return mapUser(row as AppwriteRow);
  },

  async update(
    id: string,
    patch: Partial<Pick<User, "role" | "status">>,
    options: { client?: UserClient } = {},
  ): Promise<User> {
    if (patch.role !== undefined && !isUserRole(patch.role)) {
      throw new Error(`Rol no válido: ${String(patch.role)}`);
    }
    const { databaseId, usersTableId } = getTablesConfig();
    const data = {
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    };
    if (options.client === "session") {
      const tablesDB = await getServerTablesDB();
      const row = await tablesDB.updateRow({
        databaseId,
        tableId: usersTableId,
        rowId: id,
        data,
      });
      return mapUser(row as AppwriteRow);
    }
    const tablesDB = getAdminTablesDB();
    const row = await tablesDB.updateRow({
      databaseId,
      tableId: usersTableId,
      rowId: id,
      data,
    });
    return mapUser(row as AppwriteRow);
  },

  async delete(id: string, options: { client?: UserClient } = {}): Promise<void> {
    const { databaseId, usersTableId } = getTablesConfig();
    if (options.client === "session") {
      const tablesDB = await getServerTablesDB();
      await tablesDB.deleteRow({
        databaseId,
        tableId: usersTableId,
        rowId: id,
      });
      return;
    }
    const tablesDB = getAdminTablesDB();
    await tablesDB.deleteRow({
      databaseId,
      tableId: usersTableId,
      rowId: id,
    });
  },
};
