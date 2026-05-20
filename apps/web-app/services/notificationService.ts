import "server-only";

import { ID, Query } from "node-appwrite";
import { getAdminTablesDB } from "@/lib/appwrite-admin";
import {
  NOTIFICATION_PARENT_COL,
  NOTIFICATION_SESSION_COL,
  NOTIFICATION_STUDENT_COL,
} from "@/lib/notification-relations";
import {
  isQuerySyntaxError,
  isSchemaAttributeError,
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import { type AppwriteRow } from "@/lib/row-utils";
import { getTablesConfig } from "@/lib/tables-config";
import { parseUnknownAttributeName } from "@school/utils";
import type { NotificationType } from "@school/types";

async function getParentIdsForStudent(studentId: string): Promise<string[]> {
  const tablesDB = getAdminTablesDB();
  const { databaseId, parentStudentsTableId } = getTablesConfig();

  let rows: AppwriteRow[];
  try {
    const result = await tablesDB.listRows({
      databaseId,
      tableId: parentStudentsTableId,
      queries: [Query.equal(PARENT_STUDENT_STUDENT_COL, studentId), Query.limit(100)],
    });
    rows = result.rows as AppwriteRow[];
  } catch (error) {
    if (!isSchemaAttributeError(error) && !isQuerySyntaxError(error)) {
      throw error;
    }
    const all = await tablesDB.listRows({
      databaseId,
      tableId: parentStudentsTableId,
      queries: [Query.limit(500)],
    });
    rows = (all.rows as AppwriteRow[]).filter(
      (row) => readStudentIdFromRow(row) === studentId,
    );
  }

  return [...new Set(rows.map((row) => readParentIdFromRow(row)).filter(Boolean))];
}

export type CreateParentNotificationInput = {
  studentId: string;
  transportSessionId: string;
  type: NotificationType;
  title: string;
  message: string;
};

async function createNotificationRow(
  parentId: string,
  input: CreateParentNotificationInput,
): Promise<string> {
  const tablesDB = getAdminTablesDB();
  const { databaseId, notificationsTableId } = getTablesConfig();
  const now = new Date().toISOString();

  const base: Record<string, string | boolean> = {
    [NOTIFICATION_PARENT_COL]: parentId,
    [NOTIFICATION_STUDENT_COL]: input.studentId,
    [NOTIFICATION_SESSION_COL]: input.transportSessionId,
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: false,
    sentAt: now,
    createdAt: now,
  };

  let data = { ...base };
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const row = await tablesDB.createRow({
        databaseId,
        tableId: notificationsTableId,
        rowId: ID.unique(),
        data,
      });
      return (row as AppwriteRow).$id;
    } catch (error) {
      const unknown = parseUnknownAttributeName(error);
      if (unknown && unknown in data) {
        const next = { ...data };
        delete next[unknown];
        data = next;
        continue;
      }
      throw error;
    }
  }

  throw new Error("No se pudo crear la notificación (columnas incompatibles).");
}

export const adminNotificationService = {
  async notifyParentsForStudent(input: CreateParentNotificationInput): Promise<number> {
    const parentIds = await getParentIdsForStudent(input.studentId);

    if (parentIds.length === 0) {
      return 0;
    }

    await Promise.all(
      parentIds.map((parentId) => createNotificationRow(parentId, input)),
    );

    return parentIds.length;
  },
};
