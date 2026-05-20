import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const VEHICLE_STUDENT_VEHICLE_COL =
  process.env.NEXT_PUBLIC_APPWRITE_VS_VEHICLE_REL?.trim() || "vehicleId";
export const VEHICLE_STUDENT_STUDENT_COL =
  process.env.NEXT_PUBLIC_APPWRITE_VS_STUDENT_REL?.trim() || "studentId";

export function readVehicleIdFromRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_STUDENT_VEHICLE_COL]) ?? "";
}

export function readStudentIdFromRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_STUDENT_STUDENT_COL]) ?? "";
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
