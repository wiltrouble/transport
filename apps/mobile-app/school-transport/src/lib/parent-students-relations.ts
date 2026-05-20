import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const PARENT_STUDENT_PARENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_PS_PARENT_REL?.trim() || "parentId";
export const PARENT_STUDENT_STUDENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_PS_STUDENT_REL?.trim() || "studentId";

export function readParentIdFromRow(row: AppwriteRow): string {
  return relationId(row[PARENT_STUDENT_PARENT_COL]) ?? "";
}

export function readStudentIdFromRow(row: AppwriteRow): string {
  return relationId(row[PARENT_STUDENT_STUDENT_COL]) ?? "";
}
