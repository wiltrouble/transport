import type { AppwriteRow } from "@/lib/row-utils";
import { mapStatus } from "@school/utils";
import type { Driver } from "@school/types";
import type { Parent } from "@school/types";
import type { Student } from "@school/types";
import type { User, UserRole, UserStatus } from "@school/types";
import { isUserRole } from "@school/types";
import type { GpsTrackingPoint, Vehicle } from "@school/types";
import {
  readDriverIdFromGpsRow,
  readSessionIdFromGpsRow,
  readVehicleIdFromGpsRow,
} from "@/lib/gps-relations";

export function mapParent(row: AppwriteRow): Parent {
  return {
    id: row.$id,
    fullName: String(row.fullName ?? ""),
    appwriteUserId: row.appwriteUserId ? String(row.appwriteUserId) : null,
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    address: String(row.address ?? ""),
    emergencyPhone: String(row.emergencyPhone ?? ""),
    status: mapStatus(row.status),
  };
}

export function mapDriver(row: AppwriteRow): Driver {
  return {
    id: row.$id,
    appwriteUserId: row.appwriteUserId ? String(row.appwriteUserId) : null,
    fullName: String(row.fullName ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    licenseNumber: String(row.licenseNumber ?? ""),
    licenseCategory: String(row.licenseCategory ?? ""),
    licenseExpiration: String(row.licenseExpiration ?? "").slice(0, 10),
    status: mapStatus(row.status),
  };
}

export function mapVehicle(row: AppwriteRow): Vehicle {
  return {
    id: row.$id,
    plate: String(row.plate ?? ""),
    brand: String(row.brand ?? ""),
    model: String(row.model ?? ""),
    capacity: Number(row.capacity ?? 0),
    color: String(row.color ?? ""),
    year: Number(row.year ?? 0),
    status: mapStatus(row.status),
  };
}

export function mapGpsTracking(row: AppwriteRow): GpsTrackingPoint {
  const transportSessionId =
    readSessionIdFromGpsRow(row) || String(row.transportSessionId ?? "");
  const vehicleId = readVehicleIdFromGpsRow(row) || String(row.vehicleId ?? "");
  const driverId = readDriverIdFromGpsRow(row) || String(row.driverId ?? "");

  return {
    id: row.$id,
    transportSessionId,
    vehicleId,
    driverId,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    speed: Number(row.speed ?? 0),
    heading: Number(row.heading ?? 0),
    accuracy: Number(row.accuracy ?? 0),
    trackedAt: String(row.trackedAt ?? row.$createdAt ?? new Date().toISOString()),
  };
}

export function mapUser(row: AppwriteRow): User {
  const roleValue = String(row.role ?? "").toLowerCase();
  const role: UserRole = isUserRole(roleValue) ? roleValue : "parent";
  const statusValue = String(row.status ?? "").toLowerCase();
  const status: UserStatus = statusValue === "inactive" ? "inactive" : "active";
  return {
    id: row.$id,
    appwriteUserId: String(row.appwriteUserId ?? ""),
    role,
    status,
  };
}

export function mapStudent(row: AppwriteRow): Student {
  return {
    id: row.$id,
    fullName: String(row.fullName ?? ""),
    birthDate: String(row.birthDate ?? ""),
    gender: (row.gender as Student["gender"]) ?? "other",
    grade: String(row.grade ?? ""),
    address: String(row.address ?? ""),
    photo: row.photo ? String(row.photo) : null,
    status: mapStatus(row.status),
  };
}
