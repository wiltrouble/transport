import * as Location from "expo-location";
import type { LocationObject } from "expo-location";

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
};

let trackingInterval: ReturnType<typeof setInterval> | null = null;
let trackingActive = false;

function mapLocation(location: LocationObject): DeviceLocation {
  const coords = location.coords;
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    speed: coords.speed != null && coords.speed >= 0 ? coords.speed : 0,
    heading: coords.heading != null && coords.heading >= 0 ? coords.heading : 0,
    accuracy: coords.accuracy ?? 0,
  };
}

export const locationService = {
  isTracking(): boolean {
    return trackingActive;
  },

  async requestForegroundPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  },

  async getPermissionStatus(): Promise<Location.PermissionStatus> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status;
  },

  async getCurrentLocation(): Promise<DeviceLocation> {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error("Active los servicios de ubicación del dispositivo.");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });
    return mapLocation(location);
  },

  startTracking(
    onTick: (location: DeviceLocation) => Promise<void>,
    intervalMs = 10_000,
  ): void {
    if (trackingActive) return;
    trackingActive = true;

    const tick = async () => {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: false,
      });
      await onTick(mapLocation(location));
    };

    trackingInterval = setInterval(() => {
      void tick().catch(() => {
        // Errors handled in onTick (hook shows message / stops tracking).
      });
    }, intervalMs);
  },

  stopTracking(): void {
    trackingActive = false;
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
  },
};
