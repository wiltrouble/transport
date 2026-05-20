import { create } from "zustand";
import type { GpsTrackingPoint, ParentLiveTracking } from "@school/types";
import { trackingService } from "@/services/trackingService";

type ParentTrackingState = {
  live: ParentLiveTracking | null;
  selectedStudentId: string | null;
  isLoading: boolean;
  error: string | null;
  loadTracking: (parentId: string, studentId?: string) => Promise<void>;
  applyGpsPoint: (point: GpsTrackingPoint) => void;
  setConnected: (connected: boolean) => void;
  setSelectedStudentId: (studentId: string | null) => void;
  reset: () => void;
};

export const useParentTrackingStore = create<ParentTrackingState>((set, get) => ({
  live: null,
  selectedStudentId: null,
  isLoading: false,
  error: null,

  reset: () => set({ live: null, selectedStudentId: null, error: null }),

  setSelectedStudentId: (studentId) => set({ selectedStudentId: studentId }),

  setConnected: (connected) =>
    set((state) => (state.live ? { live: { ...state.live, connected } } : state)),

  loadTracking: async (parentId, studentId) => {
    set({ isLoading: true, error: null, selectedStudentId: studentId ?? null });
    try {
      const live = await trackingService.buildLiveTracking(parentId, studentId);
      if (!live) {
        set({ live: null, error: null });
        return;
      }
      set({ live });
    } catch (e) {
      set({
        live: null,
        error: e instanceof Error ? e.message : "No se pudo cargar el rastreo",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  applyGpsPoint: (point) => {
    const { live } = get();
    if (!live || live.session.id !== point.transportSessionId) return;
    const prev = live.latestPoint;
    if (prev && new Date(point.trackedAt).getTime() < new Date(prev.trackedAt).getTime()) {
      return;
    }
    set({ live: { ...live, latestPoint: point } });
  },
}));
