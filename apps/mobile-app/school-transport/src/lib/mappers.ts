import type { AppwriteRow } from "@/lib/row-utils";
import { mapStatus } from "@school/utils";
import type {
  AppNotification,
  Driver,
  GpsTrackingPoint,
  Parent,
  ParentStudentAssignment,
  PushToken,
  RelationshipType,
  SessionStudent,
  Student,
  TransportSession,
  User,
  UserRole,
  UserStatus,
  Vehicle,
} from "@school/types";
import { isUserRole } from "@school/types";
import {
  readParentIdFromNotificationRow,
  readSessionIdFromNotificationRow,
  readStudentIdFromNotificationRow,
} from "@/lib/notification-relations";
import { readParentIdFromPushTokenRow } from "@/lib/push-token-relations";
import {
  PARENT_STUDENT_PARENT_COL,
  PARENT_STUDENT_STUDENT_COL,
  readParentIdFromRow,
  readStudentIdFromRow,
} from "@/lib/parent-students-relations";
import {
  readDriverIdFromGpsRow,
  readSessionIdFromGpsRow,
  readVehicleIdFromGpsRow,
} from "@/lib/gps-relations";
import {
  readDriverIdFromSessionRow,
  readSessionIdFromStudentRow,
  readStudentIdFromSessionStudentRow,
  readVehicleIdFromSessionRow,
  SESSION_STUDENT_SESSION_COL,
  SESSION_STUDENT_STUDENT_COL,
  TRANSPORT_SESSION_DRIVER_COL,
  TRANSPORT_SESSION_VEHICLE_COL,
} from "@/lib/session-relations";
import type { SessionStudentStatus, TransportSessionStatus } from "@school/types";

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

export function mapTransportSession(row: AppwriteRow): TransportSession {
  const vehicleRef = row[TRANSPORT_SESSION_VEHICLE_COL];
  const driverRef = row[TRANSPORT_SESSION_DRIVER_COL];

  return {
    id: row.$id,
    vehicleId: readVehicleIdFromSessionRow(row),
    driverId: readDriverIdFromSessionRow(row),
    sessionDate: String(row.sessionDate ?? "").slice(0, 10),
    shift: String(row.shift ?? ""),
    startTime: row.startTime ? String(row.startTime) : null,
    endTime: row.endTime ? String(row.endTime) : null,
    startedBy: String(row.startedBy ?? ""),
    completedBy: String(row.completedBy ?? ""),
    status: String(row.status ?? "pending") as TransportSessionStatus,
    notes: String(row.notes ?? ""),
    vehicle:
      vehicleRef && typeof vehicleRef === "object"
        ? mapVehicle(vehicleRef as AppwriteRow)
        : null,
    driver:
      driverRef && typeof driverRef === "object"
        ? mapDriver(driverRef as AppwriteRow)
        : null,
  };
}

export function mapSessionStudent(row: AppwriteRow): SessionStudent {
  const studentRef = row[SESSION_STUDENT_STUDENT_COL];
  return {
    id: row.$id,
    transportSessionId: readSessionIdFromStudentRow(row),
    studentId: readStudentIdFromSessionStudentRow(row),
    pickupOrder: Number(row.pickupOrder ?? 0),
    pickupTime: String(row.pickupTime ?? ""),
    dropoffTime: String(row.dropoffTime ?? ""),
    boarded: Boolean(row.boarded ?? false),
    droppedOff: Boolean(row.droppedOff ?? false),
    absent: Boolean(row.absent ?? false),
    boardedLatitude:
      row.boardedLatitude === null || row.boardedLatitude === undefined
        ? null
        : Number(row.boardedLatitude),
    boardedLongitude:
      row.boardedLongitude === null || row.boardedLongitude === undefined
        ? null
        : Number(row.boardedLongitude),
    droppedLatitude:
      row.droppedLatitude === null || row.droppedLatitude === undefined
        ? null
        : Number(row.droppedLatitude),
    droppedLongitude:
      row.droppedLongitude === null || row.droppedLongitude === undefined
        ? null
        : Number(row.droppedLongitude),
    notes: String(row.notes ?? ""),
    status: String(row.status ?? "pending") as SessionStudentStatus,
    student:
      studentRef && typeof studentRef === "object"
        ? mapStudent(studentRef as AppwriteRow)
        : null,
  };
}

export function mapNotification(row: AppwriteRow): AppNotification {
  return {
    id: row.$id,
    parentId: readParentIdFromNotificationRow(row) || String(row.parentId ?? ""),
    studentId: readStudentIdFromNotificationRow(row) || String(row.studentId ?? ""),
    transportSessionId:
      readSessionIdFromNotificationRow(row) || String(row.transportSessionId ?? ""),
    type: String(row.type ?? ""),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    isRead: Boolean(row.isRead ?? false),
    sentAt: String(row.sentAt ?? row.$createdAt ?? new Date().toISOString()),
  };
}

export function mapPushToken(row: AppwriteRow): PushToken {
  return {
    id: row.$id,
    parentId: readParentIdFromPushTokenRow(row) || String(row.parentId ?? ""),
    token: String(row.token ?? ""),
    platform: String(row.platform ?? "unknown"),
    deviceName: String(row.deviceName ?? ""),
    isActive: Boolean(row.isActive ?? true),
  };
}

export function mapParentStudentAssignment(row: AppwriteRow): ParentStudentAssignment {
  const parentRef = row[PARENT_STUDENT_PARENT_COL];
  const studentRef = row[PARENT_STUDENT_STUDENT_COL];
  return {
    id: row.$id,
    parentId: readParentIdFromRow(row),
    studentId: readStudentIdFromRow(row),
    relationshipType: (row.relationshipType as RelationshipType) ?? "other",
    parent:
      parentRef && typeof parentRef === "object"
        ? mapParent(parentRef as AppwriteRow)
        : null,
    student:
      studentRef && typeof studentRef === "object"
        ? mapStudent(studentRef as AppwriteRow)
        : null,
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
