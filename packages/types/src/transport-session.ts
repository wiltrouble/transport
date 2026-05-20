import type { Driver } from "./driver";
import type { SessionStudent } from "./session-student";
import type { Vehicle } from "./vehicle";
import type { SessionShift, TransportSessionStatus } from "./session-status";

export type TransportSession = {
  id: string;
  vehicleId: string;
  driverId: string;
  sessionDate: string;
  shift: SessionShift | string;
  startTime: string | null;
  endTime: string | null;
  startedBy: string;
  completedBy: string;
  status: TransportSessionStatus;
  notes: string;
  vehicle: Vehicle | null;
  driver: Driver | null;
};

export type TransportSessionListItem = TransportSession & {
  studentCount: number;
};

export type TransportSessionWithDetails = TransportSession & {
  students: SessionStudent[];
  summary: {
    total: number;
    boarded: number;
    droppedOff: number;
    absent: number;
    pending: number;
  };
};
