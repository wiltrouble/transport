"use client";

import {
  realtimeTrackingService,
  type GpsRealtimeHandler,
} from "@/services/realtimeTrackingService";

/** Appwrite Realtime subscription on `gps_tracking` table rows. */
export function subscribeToGpsUpdates(onPoint: GpsRealtimeHandler) {
  return realtimeTrackingService.subscribeToGpsTracking(onPoint);
}

export const liveMapClient = {
  subscribeToGpsUpdates,
};
