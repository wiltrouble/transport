import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const VEHICLE_DRIVER_VEHICLE_COL =
  process.env.NEXT_PUBLIC_APPWRITE_VD_VEHICLE_REL?.trim() || "vehicleId";
export const VEHICLE_DRIVER_DRIVER_COL =
  process.env.NEXT_PUBLIC_APPWRITE_VD_DRIVER_REL?.trim() || "driverId";

export function readVehicleIdFromRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_DRIVER_VEHICLE_COL]) ?? "";
}

export function readDriverIdFromRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_DRIVER_DRIVER_COL]) ?? "";
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
