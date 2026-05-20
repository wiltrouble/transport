import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

/** Appwrite relationship column keys on the `parent_student` junction table. */
export const PARENT_STUDENT_PARENT_COL =
  process.env.NEXT_PUBLIC_APPWRITE_PS_PARENT_REL?.trim() || "parentId";
export const PARENT_STUDENT_STUDENT_COL =
  process.env.NEXT_PUBLIC_APPWRITE_PS_STUDENT_REL?.trim() || "studentId";

export function readParentIdFromRow(row: AppwriteRow): string {
  return relationId(row[PARENT_STUDENT_PARENT_COL]) ?? "";
}

export function readStudentIdFromRow(row: AppwriteRow): string {
  return relationId(row[PARENT_STUDENT_STUDENT_COL]) ?? "";
}

export function isSchemaAttributeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Attribute not found in schema") ||
    message.includes("Unknown attribute")
  );
}

export function isQuerySyntaxError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Invalid query") || message.includes("Syntax error");
}
