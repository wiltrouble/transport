import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { transportSessionService } from "@/services/transportSessionService";
import { sessionStudentService } from "@/services/sessionStudentService";
import { useTrackingStore } from "@/store/tracking-store";

export function useDriverSession() {
  const driver = useAuthStore((s) => s.driver);
  const activeSession = useAuthStore((s) => s.activeSession);
  const sessionStudents = useAuthStore((s) => s.sessionStudents);
  const refreshOperationalData = useAuthStore((s) => s.refreshOperationalData);
  const updateSessionStudent = useAuthStore((s) => s.updateSessionStudent);
  const setActiveSession = useAuthStore((s) => s.setActiveSession);
  const setSessionStudents = useAuthStore((s) => s.setSessionStudents);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSessionAction = useCallback(
    async (action: () => Promise<void>) => {
      setError(null);
      setLoadingAction("session");
      try {
        await action();
        await refreshOperationalData();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error en la operación");
      } finally {
        setLoadingAction(null);
      }
    },
    [refreshOperationalData],
  );

  const startSession = useCallback(() => {
    if (!activeSession) return;
    return runSessionAction(async () => {
      const updated = await transportSessionService.startSession(
        activeSession.id,
        driver?.fullName ?? "",
      );
      setActiveSession(updated);
    });
  }, [activeSession, driver, runSessionAction, setActiveSession]);

  const completeSession = useCallback(() => {
    if (!activeSession) return;
    return runSessionAction(async () => {
      useTrackingStore.getState().stopTracking();
      const updated = await transportSessionService.completeSession(
        activeSession.id,
        driver?.fullName ?? "",
      );
      setActiveSession(updated);
    });
  }, [activeSession, driver, runSessionAction, setActiveSession]);

  const cancelSession = useCallback(() => {
    if (!activeSession) return;
    return runSessionAction(async () => {
      useTrackingStore.getState().stopTracking();
      const updated = await transportSessionService.cancelSession(activeSession.id);
      setActiveSession(updated);
    });
  }, [activeSession, runSessionAction, setActiveSession]);

  const runAttendanceAction = useCallback(
    async (studentId: string, action: () => Promise<void>) => {
      setError(null);
      setLoadingAction(studentId);
      try {
        await action();
        if (activeSession) {
          const students = await sessionStudentService.getSessionStudents(activeSession.id);
          setSessionStudents(students);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar la asistencia");
      } finally {
        setLoadingAction(null);
      }
    },
    [activeSession, setSessionStudents],
  );

  const markBoarded = useCallback(
    (id: string) =>
      runAttendanceAction(id, async () => {
        const updated = await sessionStudentService.markBoarded(id);
        updateSessionStudent(updated);
      }),
    [runAttendanceAction, updateSessionStudent],
  );

  const markDroppedOff = useCallback(
    (id: string) =>
      runAttendanceAction(id, async () => {
        const updated = await sessionStudentService.markDroppedOff(id);
        updateSessionStudent(updated);
      }),
    [runAttendanceAction, updateSessionStudent],
  );

  const markAbsent = useCallback(
    (id: string) =>
      runAttendanceAction(id, async () => {
        const updated = await sessionStudentService.markAbsent(id);
        updateSessionStudent(updated);
      }),
    [runAttendanceAction, updateSessionStudent],
  );

  return {
    activeSession,
    sessionStudents,
    loadingAction,
    error,
    startSession,
    completeSession,
    cancelSession,
    markBoarded,
    markDroppedOff,
    markAbsent,
    refreshOperationalData,
  };
}
