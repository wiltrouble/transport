import * as Location from "expo-location";
import { Alert } from "react-native";
import { create } from "zustand";
import { TRACKING_INTERVAL_MS } from "@school/types";
import type { Driver, TransportSession } from "@school/types";
import { formatAppwriteError } from "@/lib/appwrite-errors";
import { resolveGpsDriverId, resolveGpsVehicleId } from "@/lib/gps-relations";
import { gpsTrackingService } from "@/services/gpsTrackingService";
import { locationService, type DeviceLocation } from "@/services/locationService";
import { useAuthStore } from "@/store/auth-store";

type TrackingContext = {
  session: TransportSession;
  driver: Driver;
  vehicleId: string;
};

type TrackingState = {
  isTracking: boolean;
  isStarting: boolean;
  sending: boolean;
  permissionGranted: boolean | null;
  currentLocation: DeviceLocation | null;
  lastSentAt: string | null;
  error: string | null;
  trackingSessionId: string | null;
  lastWriteAt: number;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  sendLocationTick: (location: DeviceLocation, force?: boolean) => Promise<void>;
  reset: () => void;
};

function getTrackingContext(): TrackingContext | null {
  const { activeSession, driver, vehicle } = useAuthStore.getState();
  if (!activeSession || activeSession.status !== "active" || !driver || !vehicle) {
    return null;
  }
  return { session: activeSession, driver, vehicleId: vehicle.id };
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  isTracking: false,
  isStarting: false,
  sending: false,
  permissionGranted: null,
  currentLocation: null,
  lastSentAt: null,
  error: null,
  trackingSessionId: null,
  lastWriteAt: 0,

  reset: () => {
    locationService.stopTracking();
    set({
      isTracking: false,
      isStarting: false,
      sending: false,
      currentLocation: null,
      lastSentAt: null,
      error: null,
      trackingSessionId: null,
      lastWriteAt: 0,
    });
  },

  stopTracking: () => {
    get().reset();
  },

  sendLocationTick: async (location, force = false) => {
    const ctx = getTrackingContext();
    if (!ctx) {
      get().stopTracking();
      throw new Error("La sesión ya no está activa.");
    }

    const now = Date.now();
    if (!force && now - get().lastWriteAt < TRACKING_INTERVAL_MS - 500) {
      set({ currentLocation: location });
      return;
    }

    const driverId = resolveGpsDriverId(ctx.session, ctx.driver);
    if (!driverId) {
      throw new Error("No se encontró el ID del conductor en la sesión.");
    }

    set({ sending: true, error: null, currentLocation: location });

    try {
      const point = await gpsTrackingService.saveLocation(
        {
          transportSessionId: ctx.session.id,
          vehicleId: resolveGpsVehicleId(ctx.session, ctx.vehicleId),
          driverId,
          location,
        },
        ctx.driver,
      );
      set({ lastSentAt: point.trackedAt, lastWriteAt: now });
    } catch (e) {
      set({ error: formatAppwriteError(e) });
      throw e;
    } finally {
      set({ sending: false });
    }
  },

  startTracking: async () => {
    if (get().isTracking || get().isStarting) return;

    set({ error: null, isStarting: true });

    try {
      await useAuthStore.getState().refreshOperationalData();
      const ctx = getTrackingContext();
      if (!ctx) {
        throw new Error(
          "No hay sesión activa. Inicie el viaje en la pestaña Sesión antes de rastrear.",
        );
      }

      const granted = await locationService.requestForegroundPermission();
      set({ permissionGranted: granted });
      if (!granted) {
        throw new Error("Permiso de ubicación denegado.");
      }

      await gpsTrackingService.validateTrackingSession(ctx.session.id);

      const initial = await locationService.getCurrentLocation();
      set({ currentLocation: initial, trackingSessionId: ctx.session.id });

      await get().sendLocationTick(initial, true);

      locationService.startTracking(async (loc) => {
        try {
          await get().sendLocationTick(loc);
        } catch {
          // Error stored in state; keep interval until user stops or session ends.
        }
      }, TRACKING_INTERVAL_MS);

      set({ isTracking: true, trackingSessionId: ctx.session.id });
    } catch (e) {
      locationService.stopTracking();
      const message = formatAppwriteError(e);
      set({ isTracking: false, error: message });
      Alert.alert("No se pudo iniciar el rastreo", message);
    } finally {
      set({ isStarting: false });
    }
  },
}));

void locationService.getPermissionStatus().then((status) => {
  useTrackingStore.setState({
    permissionGranted: status === Location.PermissionStatus.GRANTED,
  });
});
