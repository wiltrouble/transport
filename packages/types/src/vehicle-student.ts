import type { Student } from "./student";
import type { Vehicle } from "./vehicle";

export type VehicleStudentOperationalStatus = "active" | "inactive";

export type VehicleStudentAssignment = {
  id: string;
  vehicleId: string;
  studentId: string;
  pickupOrder: number;
  pickupTime: string;
  dropoffTime: string;
  status: boolean;
  student: Student | null;
  vehicle: Vehicle | null;
};

export type AssignStudentToVehicleInput = {
  vehicleId: string;
  studentId: string;
  pickupTime?: string;
  dropoffTime?: string;
};

export type UpdateVehicleStudentInput = {
  pickupTime?: string;
  dropoffTime?: string;
  status?: boolean;
};

export type VehicleOccupancy = {
  vehicleId: string;
  capacity: number;
  assignedCount: number;
  availableSeats: number;
  occupancyPercent: number;
};

export function isActiveVehicleStudentAssignment(
  assignment: Pick<VehicleStudentAssignment, "status">,
): boolean {
  return assignment.status === true;
}

export function getVehicleStudentOperationalStatus(
  assignment: Pick<VehicleStudentAssignment, "status">,
): VehicleStudentOperationalStatus {
  return isActiveVehicleStudentAssignment(assignment) ? "active" : "inactive";
}
