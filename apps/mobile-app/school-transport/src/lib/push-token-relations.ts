import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const PUSH_TOKEN_PARENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_PT_PARENT_REL?.trim() || "parentId";

export function readParentIdFromPushTokenRow(row: AppwriteRow): string {
  return relationId(row[PUSH_TOKEN_PARENT_COL]) ?? "";
}
