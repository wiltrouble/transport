import { Query } from "appwrite";
import { getTablesDB } from "@/lib/appwrite";
import { mapParent } from "@/lib/mappers";
import type { AppwriteRow } from "@/lib/row-utils";
import { isQuerySyntaxError, isSchemaAttributeError } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import type { Parent } from "@school/types";

const FETCH_LIMIT = 100;

export const parentService = {
  async getById(id: string): Promise<Parent | null> {
    const tablesDB = getTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();
    try {
      const row = await tablesDB.getRow({
        databaseId,
        tableId: parentsTableId,
        rowId: id,
      });
      return mapParent(row as AppwriteRow);
    } catch {
      return null;
    }
  },

  async getByAppwriteUserId(appwriteUserId: string): Promise<Parent | null> {
    const tablesDB = getTablesDB();
    const { databaseId, parentsTableId } = getTablesConfig();

    try {
      const result = await tablesDB.listRows({
        databaseId,
        tableId: parentsTableId,
        queries: [Query.equal("appwriteUserId", appwriteUserId), Query.limit(1)],
      });
      if (result.rows.length > 0) {
        return mapParent(result.rows[0] as AppwriteRow);
      }
    } catch (error) {
      if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
        throw error;
      }
    }

    const all = await tablesDB.listRows({
      databaseId,
      tableId: parentsTableId,
      queries: [Query.limit(FETCH_LIMIT)],
    });
    const match = (all.rows as AppwriteRow[]).find(
      (row) => String(row.appwriteUserId ?? "") === appwriteUserId,
    );
    return match ? mapParent(match) : null;
  },

  async getCurrentParent(appwriteUserId: string): Promise<Parent | null> {
    const parent = await this.getByAppwriteUserId(appwriteUserId);
    if (!parent?.status) return null;
    return parent;
  },
};
