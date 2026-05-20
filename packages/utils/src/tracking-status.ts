import {
  TRACKING_OFFLINE_MS,
  type GpsTrackingPoint,
  type VehicleTrackingStatus,
} from "@school/types";

export function resolveVehicleTrackingStatus(
  sessionStatus: string,
  latestPoint: GpsTrackingPoint | null,
  now = Date.now(),
): VehicleTrackingStatus {
  if (sessionStatus !== "active") {
    return "inactive";
  }
  if (!latestPoint?.trackedAt) {
    return "offline";
  }
  const age = now - new Date(latestPoint.trackedAt).getTime();
  if (age > TRACKING_OFFLINE_MS) {
    return "offline";
  }
  if (latestPoint.speed > 1) {
    return "tracking";
  }
  return "online";
}

export const VEHICLE_TRACKING_STATUS_LABELS: Record<VehicleTrackingStatus, string> = {
  online: "En línea",
  offline: "Sin señal",
  tracking: "En movimiento",
  inactive: "Inactivo",
};
