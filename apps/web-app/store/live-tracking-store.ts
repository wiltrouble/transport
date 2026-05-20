"use client";

import { create } from "zustand";
import type { GpsTrackingPoint, LiveVehicleTracking } from "@school/types";
import {
  mergeGpsPointIntoVehicles,
  refreshVehicleStatuses,
} from "@/lib/live-tracking-state";
import { buildLiveMapSummary, type LiveMapSummary } from "@/services/liveMapService";

type LiveTrackingState = {
  vehicles: LiveVehicleTracking[];
  selectedSessionId: string | null;
  connected: boolean;
  hydrated: boolean;
  summary: LiveMapSummary;
  setInitial: (vehicles: LiveVehicleTracking[]) => void;
  setConnected: (connected: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  selectSession: (sessionId: string | null) => void;
  applyGpsPoint: (point: GpsTrackingPoint) => void;
  refreshStatuses: () => void;
};

function withSummary(vehicles: LiveVehicleTracking[]) {
  return {
    vehicles,
    summary: buildLiveMapSummary(vehicles),
  };
}

export const useLiveTrackingStore = create<LiveTrackingState>((set, get) => ({
  vehicles: [],
  selectedSessionId: null,
  connected: false,
  hydrated: false,
  summary: buildLiveMapSummary([]),

  setInitial: (vehicles) => {
    const sorted = [...vehicles].sort((a, b) =>
      (a.vehiclePlate ?? "").localeCompare(b.vehiclePlate ?? "", "es"),
    );
    set({
      ...withSummary(sorted),
      selectedSessionId: sorted[0]?.transportSessionId ?? null,
    });
  },

  setConnected: (connected) => set({ connected }),
  setHydrated: (hydrated) => set({ hydrated }),

  selectSession: (sessionId) => set({ selectedSessionId: sessionId }),

  applyGpsPoint: (point) => {
    set((state) => withSummary(mergeGpsPointIntoVehicles(state.vehicles, point)));
  },

  refreshStatuses: () => {
    set((state) => withSummary(refreshVehicleStatuses(state.vehicles)));
  },
}));
