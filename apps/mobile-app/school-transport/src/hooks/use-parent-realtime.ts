import { useEffect, useRef } from "react";
import { getClientSessionSecret } from "@/lib/appwrite";
import { notificationService } from "@/services/notificationService";
import { trackingService } from "@/services/trackingService";
import { useAuthStore } from "@/store/auth-store";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";
import { useParentTrackingStore } from "@/store/parent-tracking-store";

function logRealtimeIssue(scope: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[realtime] ${scope}:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Single Appwrite Realtime coordinator for the parent app.
 *
 * - Waits for hydration + session before subscribing (avoids auth-less WS loops).
 * - Uses generation counters so Strict Mode / fast tab switches don't leave stale subs.
 * - Call once from `(parent)/_layout` only — not from individual tab screens.
 */
export function useParentRealtime(enableGps = false) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const parentId = useAuthStore((s) => s.parent?.id);
  const liveSessionId = useParentTrackingStore((s) => s.live?.session.id);
  const applyGpsPoint = useParentTrackingStore((s) => s.applyGpsPoint);
  const setGpsConnected = useParentTrackingStore((s) => s.setConnected);
  const mergeNotification = useParentNotificationsStore((s) => s.mergeNotification);
  const setNotifConnected = useParentNotificationsStore((s) => s.setConnected);

  const notifGenRef = useRef(0);
  const gpsGenRef = useRef(0);

  useEffect(() => {
    if (!isHydrated || !parentId || !getClientSessionSecret()) {
      setNotifConnected(false);
      return;
    }

    const gen = ++notifGenRef.current;
    let sub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    void notificationService
      .subscribeToNotifications(parentId, (n) => {
        mergeNotification(n);
        void useAuthStore.getState().refreshParentData();
      })
      .then((s) => {
        if (cancelled || gen !== notifGenRef.current) {
          void s.unsubscribe();
          return;
        }
        sub = s;
        setNotifConnected(true);
      })
      .catch((err) => {
        logRealtimeIssue("notifications subscribe", err);
        setNotifConnected(false);
      });

    return () => {
      cancelled = true;
      void sub?.unsubscribe();
      setNotifConnected(false);
    };
  }, [isHydrated, parentId, mergeNotification, setNotifConnected]);

  useEffect(() => {
    if (!isHydrated || !parentId || !enableGps || !liveSessionId || !getClientSessionSecret()) {
      setGpsConnected(false);
      return;
    }

    const gen = ++gpsGenRef.current;
    let sub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    void trackingService
      .subscribeToGpsUpdates(liveSessionId, (point) => {
        applyGpsPoint(point);
        setGpsConnected(true);
      })
      .then((s) => {
        if (cancelled || gen !== gpsGenRef.current) {
          void s.unsubscribe();
          return;
        }
        sub = s;
        setGpsConnected(true);
      })
      .catch((err) => {
        logRealtimeIssue("gps subscribe", err);
        setGpsConnected(false);
      });

    return () => {
      cancelled = true;
      void sub?.unsubscribe();
      setGpsConnected(false);
    };
  }, [
    isHydrated,
    parentId,
    enableGps,
    liveSessionId,
    applyGpsPoint,
    setGpsConnected,
  ]);
}
