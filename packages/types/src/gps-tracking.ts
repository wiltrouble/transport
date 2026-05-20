export type GpsTrackingPoint = {
  id: string;
  transportSessionId: string;
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  trackedAt: string;
};

export type VehicleTrackingStatus = "online" | "offline" | "tracking" | "inactive";

export type LiveVehicleTracking = {
  transportSessionId: string;
  vehicleId: string;
  driverId: string;
  vehiclePlate: string;
  driverName: string;
  sessionStatus: string;
  studentCount: number;
  latestPoint: GpsTrackingPoint | null;
  status: VehicleTrackingStatus;
};

export const TRACKING_OFFLINE_MS = 60_000;
export const TRACKING_INTERVAL_MS = 10_000;
