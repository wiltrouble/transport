import type { AppwriteRow } from "@/lib/row-utils";
import { relationId } from "@/lib/row-utils";

export const TRANSPORT_SESSION_VEHICLE_COL =
  process.env.EXPO_PUBLIC_APPWRITE_TS_VEHICLE_REL?.trim() || "vehicleId";
export const TRANSPORT_SESSION_DRIVER_COL =
  process.env.EXPO_PUBLIC_APPWRITE_TS_DRIVER_REL?.trim() || "driverId";

export const SESSION_STUDENT_SESSION_COL =
  process.env.EXPO_PUBLIC_APPWRITE_SS_SESSION_REL?.trim() || "transportSessionId";
export const SESSION_STUDENT_STUDENT_COL =
  process.env.EXPO_PUBLIC_APPWRITE_SS_STUDENT_REL?.trim() || "studentId";

export const VEHICLE_DRIVER_VEHICLE_COL =
  process.env.EXPO_PUBLIC_APPWRITE_VD_VEHICLE_REL?.trim() || "vehicleId";
export const VEHICLE_DRIVER_DRIVER_COL =
  process.env.EXPO_PUBLIC_APPWRITE_VD_DRIVER_REL?.trim() || "driverId";

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

export function readVehicleIdFromAssignmentRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_DRIVER_VEHICLE_COL]) ?? "";
}

export function readDriverIdFromAssignmentRow(row: AppwriteRow): string {
  return relationId(row[VEHICLE_DRIVER_DRIVER_COL]) ?? "";
}
