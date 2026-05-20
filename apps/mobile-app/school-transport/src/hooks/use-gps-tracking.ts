import { useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useTrackingStore } from "@/store/tracking-store";

export function useGpsTracking() {
  const driver = useAuthStore((s) => s.driver);
  const vehicle = useAuthStore((s) => s.vehicle);
  const activeSession = useAuthStore((s) => s.activeSession);
  const refreshOperationalData = useAuthStore((s) => s.refreshOperationalData);

  const isTracking = useTrackingStore((s) => s.isTracking);
  const isStarting = useTrackingStore((s) => s.isStarting);
  const permissionGranted = useTrackingStore((s) => s.permissionGranted);
  const currentLocation = useTrackingStore((s) => s.currentLocation);
  const lastSentAt = useTrackingStore((s) => s.lastSentAt);
  const error = useTrackingStore((s) => s.error);
  const sending = useTrackingStore((s) => s.sending);
  const startTracking = useTrackingStore((s) => s.startTracking);
  const stopTracking = useTrackingStore((s) => s.stopTracking);

  const canTrack = Boolean(
    activeSession?.status === "active" && driver && vehicle && activeSession,
  );

  useFocusEffect(
    useCallback(() => {
      void refreshOperationalData();
    }, [refreshOperationalData]),
  );

  useEffect(() => {
    if (activeSession?.status !== "active" && isTracking) {
      stopTracking();
    }
  }, [activeSession?.status, isTracking, stopTracking]);

  return {
    driver,
    vehicle,
    activeSession,
    canTrack,
    isTracking,
    isStarting,
    permissionGranted,
    currentLocation,
    lastSentAt,
    error,
    sending,
    startTracking,
    stopTracking,
    refreshOperationalData,
  };
}
