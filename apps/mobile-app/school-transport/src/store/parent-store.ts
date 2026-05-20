import { create } from "zustand";
import type {
  Parent,
  ParentChildOverview,
  ParentChildTransportStatus,
  ParentStudentAssignment,
  Student,
} from "@school/types";
import { notificationService } from "@/services/notificationService";
import { parentStudentService } from "@/services/parentStudentService";
import { sessionStudentService } from "@/services/sessionStudentService";
import { trackingService } from "@/services/trackingService";
type ParentState = {
  parent: Parent | null;
  assignments: ParentStudentAssignment[];
  childrenOverviews: ParentChildOverview[];
  isRefreshing: boolean;
  error: string | null;
  setParent: (parent: Parent | null) => void;
  refreshParentData: (parentId: string) => Promise<void>;
  reset: () => void;
};

function resolveTransportStatus(
  sessionStatus: string | undefined,
): ParentChildTransportStatus {
  if (!sessionStatus) return "no_session";
  if (sessionStatus === "active") return "active";
  if (sessionStatus === "pending") return "pending";
  if (sessionStatus === "completed") return "completed";
  if (sessionStatus === "cancelled") return "cancelled";
  return "no_session";
}

async function buildChildOverview(
  assignment: ParentStudentAssignment,
  activeSessions: Awaited<ReturnType<typeof trackingService.getActiveSessionsForParent>>,
  notifications: Awaited<ReturnType<typeof notificationService.listForParent>>,
): Promise<ParentChildOverview> {
  const student: Student =
    assignment.student ??
    ({
      id: assignment.studentId,
      fullName: "Estudiante",
      grade: "",
      photo: null,
      birthDate: "",
      gender: "other",
      address: "",
      status: true,
    } satisfies Student);

  let session: ParentChildOverview["session"] = null;
  let sessionStudent: ParentChildOverview["sessionStudent"] = null;

  for (const active of activeSessions) {
    const students = await sessionStudentService.getSessionStudents(active.id);
    const match = students.find((ss) => ss.studentId === assignment.studentId);
    if (match) {
      session = active;
      sessionStudent = match;
      break;
    }
  }

  const latestNotification =
    notifications.find((n) => n.studentId === assignment.studentId) ?? null;

  return {
    student,
    relationshipType: assignment.relationshipType,
    session: session ?? null,
    sessionStudent,
    transportStatus: resolveTransportStatus(session?.status),
    latestNotification,
  };
}

export const useParentStore = create<ParentState>((set) => ({
  parent: null,
  assignments: [],
  childrenOverviews: [],
  isRefreshing: false,
  error: null,

  setParent: (parent) => set({ parent }),

  reset: () =>
    set({
      parent: null,
      assignments: [],
      childrenOverviews: [],
      error: null,
    }),

  refreshParentData: async (parentId) => {
    set({ isRefreshing: true, error: null });
    try {
      const [assignments, activeSessions, notifications] = await Promise.all([
        parentStudentService.listByParentId(parentId),
        trackingService.getActiveSessionsForParent(parentId),
        notificationService.listForParent(parentId),
      ]);

      const childrenOverviews = await Promise.all(
        assignments.map((a) => buildChildOverview(a, activeSessions, notifications)),
      );

      set({ assignments, childrenOverviews });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "No se pudieron cargar los datos del padre",
      });
    } finally {
      set({ isRefreshing: false });
    }
  },
}));
