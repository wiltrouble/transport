import { useEffect } from "react";
import { notificationService } from "@/services/notificationService";
import { trackingService } from "@/services/trackingService";
import { useAuthStore } from "@/store/auth-store";
import { useParentNotificationsStore } from "@/store/parent-notifications-store";
import { useParentTrackingStore } from "@/store/parent-tracking-store";

/** Subscribes to Appwrite Realtime for parent GPS + notifications while mounted. */
export function useParentRealtime(enableGps = true) {
  const parent = useAuthStore((s) => s.parent);
  const live = useParentTrackingStore((s) => s.live);
  const applyGpsPoint = useParentTrackingStore((s) => s.applyGpsPoint);
  const setGpsConnected = useParentTrackingStore((s) => s.setConnected);
  const mergeNotification = useParentNotificationsStore((s) => s.mergeNotification);
  const setNotifConnected = useParentNotificationsStore((s) => s.setConnected);

  useEffect(() => {
    if (!parent) return;

    let notifSub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    void notificationService
      .subscribeToNotifications(parent.id, (n) => {
        mergeNotification(n);
        void useAuthStore.getState().refreshParentData();
      })
      .then((sub) => {
        if (cancelled) void sub.unsubscribe();
        else {
          notifSub = sub;
          setNotifConnected(true);
        }
      })
      .catch(() => setNotifConnected(false));

    return () => {
      cancelled = true;
      void notifSub?.unsubscribe();
    };
  }, [parent, mergeNotification, setNotifConnected]);

  useEffect(() => {
    if (!parent || !enableGps || !live?.session.id) return;

    let gpsSub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    void trackingService
      .subscribeToGpsUpdates(live.session.id, (point) => {
        applyGpsPoint(point);
        setGpsConnected(true);
      })
      .then((sub) => {
        if (cancelled) void sub.unsubscribe();
        else gpsSub = sub;
      })
      .catch(() => setGpsConnected(false));

    return () => {
      cancelled = true;
      void gpsSub?.unsubscribe();
    };
  }, [parent, enableGps, live?.session.id, applyGpsPoint, setGpsConnected]);
}
