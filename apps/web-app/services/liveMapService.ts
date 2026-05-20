import type { LiveVehicleTracking } from "@school/types";

export type LiveMapSummary = {
  activeSessions: number;
  activeVehicles: number;
  trackingVehicles: number;
  lastGpsUpdate: string | null;
};

export function buildLiveMapSummary(vehicles: LiveVehicleTracking[]): LiveMapSummary {
  const withGps = vehicles.filter((v) => v.latestPoint);
  const tracking = vehicles.filter((v) => v.status === "tracking");
  const latestMs = withGps.reduce((max, v) => {
    const t = new Date(v.latestPoint!.trackedAt).getTime();
    return t > max ? t : max;
  }, 0);

  return {
    activeSessions: vehicles.length,
    activeVehicles: new Set(vehicles.map((v) => v.vehicleId)).size,
    trackingVehicles: tracking.length,
    lastGpsUpdate: latestMs > 0 ? new Date(latestMs).toISOString() : null,
  };
}
