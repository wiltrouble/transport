import type { SessionStudentStatus } from "./session-status";
import type { Student } from "./student";

export type SessionStudent = {
  id: string;
  transportSessionId: string;
  studentId: string;
  pickupOrder: number;
  pickupTime: string;
  dropoffTime: string;
  boarded: boolean;
  droppedOff: boolean;
  absent: boolean;
  boardedLatitude: number | null;
  boardedLongitude: number | null;
  droppedLatitude: number | null;
  droppedLongitude: number | null;
  notes: string;
  status: SessionStudentStatus | string;
  student: Student | null;
};

export type UpdateSessionStudentNotesInput = {
  notes: string;
};
