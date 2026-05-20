import { resolveVehicleTrackingStatus } from "@school/utils";
import type { GpsTrackingPoint, LiveVehicleTracking } from "@school/types";

export function mergeGpsPointIntoVehicles(
  vehicles: LiveVehicleTracking[],
  point: GpsTrackingPoint,
): LiveVehicleTracking[] {
  const now = Date.now();
  let found = false;

  const next = vehicles.map((vehicle) => {
    if (vehicle.transportSessionId !== point.transportSessionId) {
      return vehicle;
    }
    found = true;
    const latest =
      !vehicle.latestPoint ||
      new Date(point.trackedAt).getTime() >= new Date(vehicle.latestPoint.trackedAt).getTime()
        ? point
        : vehicle.latestPoint;

    return {
      ...vehicle,
      latestPoint: latest,
      status: resolveVehicleTrackingStatus(vehicle.sessionStatus, latest, now),
    };
  });

  return found ? next : vehicles;
}

export function refreshVehicleStatuses(
  vehicles: LiveVehicleTracking[],
  now = Date.now(),
): LiveVehicleTracking[] {
  return vehicles.map((vehicle) => ({
    ...vehicle,
    status: resolveVehicleTrackingStatus(
      vehicle.sessionStatus,
      vehicle.latestPoint,
      now,
    ),
  }));
}
