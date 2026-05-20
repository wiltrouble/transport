import type { Driver } from "./driver";
import type { Vehicle } from "./vehicle";

export type VehicleDriverOperationalStatus = "active" | "inactive";

export type VehicleDriverAssignment = {
  id: string;
  vehicleId: string;
  driverId: string;
  isPrimary: boolean;
  assignedAt: string;
  unassignedAt: string | null;
  status: boolean;
  driver: Driver | null;
  vehicle: Vehicle | null;
};

export type AssignDriverToVehicleInput = {
  vehicleId: string;
  driverId: string;
  assignedAt: string;
  isPrimary: boolean;
  status: boolean;
};

export function isActiveVehicleDriverAssignment(
  assignment: Pick<VehicleDriverAssignment, "status" | "unassignedAt">,
): boolean {
  return assignment.status && !assignment.unassignedAt;
}

export function getVehicleDriverOperationalStatus(
  assignment: Pick<VehicleDriverAssignment, "status" | "unassignedAt">,
): VehicleDriverOperationalStatus {
  return isActiveVehicleDriverAssignment(assignment) ? "active" : "inactive";
}
