import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const TRANSPORT_SESSION_VEHICLE_COL =
  process.env.NEXT_PUBLIC_APPWRITE_TS_VEHICLE_REL?.trim() || "vehicleId";
export const TRANSPORT_SESSION_DRIVER_COL =
  process.env.NEXT_PUBLIC_APPWRITE_TS_DRIVER_REL?.trim() || "driverId";

export const SESSION_STUDENT_SESSION_COL =
  process.env.NEXT_PUBLIC_APPWRITE_SS_SESSION_REL?.trim() || "transportSessionId";
export const SESSION_STUDENT_STUDENT_COL =
  process.env.NEXT_PUBLIC_APPWRITE_SS_STUDENT_REL?.trim() || "studentId";

export function readVehicleIdFromSessionRow(row: AppwriteRow): string {
  return relationId(row[TRANSPORT_SESSION_VEHICLE_COL]) ?? "";
}

export function readDriverIdFromSessionRow(row: AppwriteRow): string {
  return relationId(row[TRANSPORT_SESSION_DRIVER_COL]) ?? "";
}

export function readSessionIdFromStudentRow(row: AppwriteRow): string {
  return relationId(row[SESSION_STUDENT_SESSION_COL]) ?? "";
}

export function readStudentIdFromSessionStudentRow(row: AppwriteRow): string {
  return relationId(row[SESSION_STUDENT_STUDENT_COL]) ?? "";
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
