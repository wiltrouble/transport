export const TRANSPORT_SESSION_STATUSES = [
  "pending",
  "active",
  "completed",
  "cancelled",
] as const;

export type TransportSessionStatus = (typeof TRANSPORT_SESSION_STATUSES)[number];

export const SESSION_STUDENT_STATUSES = [
  "pending",
  "boarded",
  "dropped_off",
  "absent",
] as const;

export type SessionStudentStatus = (typeof SESSION_STUDENT_STATUSES)[number];

export const TRANSPORT_SESSION_STATUS_LABELS: Record<TransportSessionStatus, string> = {
  pending: "Pendiente",
  active: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const SESSION_STUDENT_STATUS_LABELS: Record<SessionStudentStatus, string> = {
  pending: "Pendiente",
  boarded: "Abordó",
  dropped_off: "Entregado",
  absent: "Ausente",
};

export const SESSION_SHIFTS = ["morning", "afternoon", "evening"] as const;

export type SessionShift = (typeof SESSION_SHIFTS)[number];

export const SESSION_SHIFT_LABELS: Record<SessionShift, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
};

export function canTransitionSession(
  from: TransportSessionStatus,
  to: TransportSessionStatus,
): boolean {
  if (from === to) return true;
  if (from === "pending" && (to === "active" || to === "cancelled")) return true;
  if (from === "active" && (to === "completed" || to === "cancelled")) return true;
  return false;
}

export function isSessionEditable(status: TransportSessionStatus | string): boolean {
  return status === "pending" || status === "active";
}
