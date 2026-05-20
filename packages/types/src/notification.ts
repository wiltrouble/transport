export type NotificationType =
  | "session_started"
  | "student_boarded"
  | "student_dropped_off"
  | "vehicle_arriving"
  | "session_completed"
  | "student_absent";

export type AppNotification = {
  id: string;
  parentId: string;
  studentId: string;
  transportSessionId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  createdAt: string;
};
