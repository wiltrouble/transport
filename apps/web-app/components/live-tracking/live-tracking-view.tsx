"use client";

import { useCallback, useEffect } from "react";
import type { LiveVehicleTracking } from "@school/types";
import { TRACKING_OFFLINE_MS } from "@school/types";
import { LiveMapSummaryCards } from "@/components/live-tracking/live-map-summary";
import { LiveSessionSidebar } from "@/components/live-tracking/live-session-sidebar";
import { LiveTrackingMap } from "@/components/live-tracking/live-tracking-map";
import { LiveTrackingSkeleton } from "@/components/live-tracking/live-tracking-skeleton";
import { subscribeToGpsUpdates } from "@/services/liveMapClient";
import { useLiveTrackingStore } from "@/store/live-tracking-store";

type LiveTrackingViewProps = {
  initialVehicles: LiveVehicleTracking[];
};

export function LiveTrackingView({ initialVehicles }: LiveTrackingViewProps) {
  const vehicles = useLiveTrackingStore((s) => s.vehicles);
  const selectedSessionId = useLiveTrackingStore((s) => s.selectedSessionId);
  const connected = useLiveTrackingStore((s) => s.connected);
  const hydrated = useLiveTrackingStore((s) => s.hydrated);
  const summary = useLiveTrackingStore((s) => s.summary);
  const setInitial = useLiveTrackingStore((s) => s.setInitial);
  const setConnected = useLiveTrackingStore((s) => s.setConnected);
  const setHydrated = useLiveTrackingStore((s) => s.setHydrated);
  const selectSession = useLiveTrackingStore((s) => s.selectSession);
  const applyGpsPoint = useLiveTrackingStore((s) => s.applyGpsPoint);
  const refreshStatuses = useLiveTrackingStore((s) => s.refreshStatuses);

  useEffect(() => {
    setInitial(initialVehicles);
    setHydrated(true);
  }, [initialVehicles, setInitial, setHydrated]);

  useEffect(() => {
    let subscription: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    void subscribeToGpsUpdates((point) => {
      applyGpsPoint(point);
      setConnected(true);
    })
      .then((sub) => {
        if (cancelled) {
          void sub.unsubscribe();
          return;
        }
        subscription = sub;
        setConnected(true);
      })
      .catch(() => setConnected(false));

    return () => {
      cancelled = true;
      void subscription?.unsubscribe();
    };
  }, [applyGpsPoint, setConnected]);

  useEffect(() => {
    const timer = setInterval(() => refreshStatuses(), 15_000);
    return () => clearInterval(timer);
  }, [refreshStatuses]);

  const handleSelect = useCallback(
    (sessionId: string) => selectSession(sessionId),
    [selectSession],
  );

  if (!hydrated) {
    return <LiveTrackingSkeleton />;
  }

  return (
    <div className="relative flex h-[calc(100vh-6rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <LiveMapSummaryCards summary={summary} connected={connected} />

      <div className="flex min-h-0 flex-1 flex-col pt-28 lg:flex-row lg:pt-4">
        <LiveSessionSidebar
          vehicles={vehicles}
          selectedSessionId={selectedSessionId}
          onSelect={handleSelect}
        />
        <LiveTrackingMap
          vehicles={vehicles}
          selectedSessionId={selectedSessionId}
          onSelectSession={handleSelect}
        />
      </div>

      <p className="pointer-events-none absolute bottom-2 left-4 text-[10px] text-slate-400 lg:left-80">
        Sin señal tras {TRACKING_OFFLINE_MS / 1000}s · Appwrite Realtime
      </p>
    </div>
  );
}
