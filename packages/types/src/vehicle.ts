import type { VehicleDriverAssignment } from "./vehicle-driver";
import type { VehicleStudentAssignment } from "./vehicle-student";

export type Vehicle = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  capacity: number;
  color: string;
  year: number;
  status: boolean;
};

export type VehicleInput = Omit<Vehicle, "id">;

export type VehicleListItem = Vehicle & {
  assignmentCount: number;
  occupancyPercent: number;
};

export type VehicleWithDetails = Vehicle & {
  /** Active student assignments on this vehicle (route). */
  assignments: VehicleStudentAssignment[];
  assignmentCount: number;
  occupancyPercent: number;
  /** All student assignments including inactive (history). */
  studentAssignmentHistory: VehicleStudentAssignment[];
  currentDriverAssignment: VehicleDriverAssignment | null;
  driverAssignmentHistory: VehicleDriverAssignment[];
};
