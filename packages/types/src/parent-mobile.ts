import type { AppNotification } from "./notification";
import type { GpsTrackingPoint } from "./gps-tracking";
import type { SessionStudent } from "./session-student";
import type { Student } from "./student";
import type { TransportSession } from "./transport-session";

export type ParentChildTransportStatus =
  | "no_session"
  | "pending"
  | "active"
  | "completed"
  | "cancelled";

export type ParentChildOverview = {
  student: Student;
  relationshipType: string;
  session: TransportSession | null;
  sessionStudent: SessionStudent | null;
  transportStatus: ParentChildTransportStatus;
  latestNotification: AppNotification | null;
};

export type ParentLiveTracking = {
  session: TransportSession;
  sessionStudent: SessionStudent | null;
  student: Student | null;
  latestPoint: GpsTrackingPoint | null;
  connected: boolean;
};
