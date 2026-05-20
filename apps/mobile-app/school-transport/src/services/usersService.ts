import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapUser } from "@/lib/mappers";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  type AppwriteRow,
} from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { User } from "@school/types";

const FETCH_LIMIT = 100;

/**
 * Mobile-side access to the authoritative `users` Appwrite Table.
 * Used during login to ensure the account is allowed to use the mobile app
 * (only `driver` and `parent` roles).
 */
export const usersService = {
  async getByAppwriteUserId(appwriteUserId: string): Promise<User | null> {
    if (!appwriteUserId) return null;
    const tablesDB = getTablesDB();
    const { databaseId, usersTableId } = getTablesConfig();

    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: usersTableId,
        queries: [Query.equal("appwriteUserId", appwriteUserId), Query.limit(1)],
      });
      if (result.rows.length > 0) {
        return mapUser(result.rows[0] as AppwriteRow);
      }
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
    }

    try {
      const all = await tablesDB.listRows({
        databaseId,
        tableId: usersTableId,
        queries: [Query.limit(FETCH_LIMIT)],
      });
      const match = (all.rows as AppwriteRow[]).find(
        (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
      );
      return match ? mapUser(match) : null;
    } catch {
      return null;
    }
  },
};
