import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const GPS_SESSION_COL =
  process.env.NEXT_PUBLIC_APPWRITE_GT_SESSION_REL?.trim() || "transportSessionId";
export const GPS_VEHICLE_COL =
  process.env.NEXT_PUBLIC_APPWRITE_GT_VEHICLE_REL?.trim() || "vehicleId";
export const GPS_DRIVER_COL =
  process.env.NEXT_PUBLIC_APPWRITE_GT_DRIVER_REL?.trim() || "driverId";

export function readSessionIdFromGpsRow(row: AppwriteRow): string {
  return relationId(row[GPS_SESSION_COL]) ?? "";
}

export function readVehicleIdFromGpsRow(row: AppwriteRow): string {
  return relationId(row[GPS_VEHICLE_COL]) ?? "";
}

export function readDriverIdFromGpsRow(row: AppwriteRow): string {
  return relationId(row[GPS_DRIVER_COL]) ?? "";
}
