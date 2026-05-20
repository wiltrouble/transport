import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const NOTIFICATION_PARENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_N_PARENT_REL?.trim() || "parentId";
export const NOTIFICATION_STUDENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_N_STUDENT_REL?.trim() || "studentId";
export const NOTIFICATION_SESSION_COL =
  process.env.EXPO_PUBLIC_APPWRITE_N_SESSION_REL?.trim() || "transportSessionId";

export function readParentIdFromNotificationRow(row: AppwriteRow): string {
  return relationId(row[NOTIFICATION_PARENT_COL]) ?? "";
}

export function readStudentIdFromNotificationRow(row: AppwriteRow): string {
  return relationId(row[NOTIFICATION_STUDENT_COL]) ?? "";
}

export function readSessionIdFromNotificationRow(row: AppwriteRow): string {
  return relationId(row[NOTIFICATION_SESSION_COL]) ?? "";
}
