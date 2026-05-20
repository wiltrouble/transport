import type { Driver } from "./driver";
import type { TransportSession } from "./transport-session";
import type { Vehicle } from "./vehicle";

/**
 * Operational readiness of a vehicle for the Transport Sessions dashboard.
 *
 * A vehicle is the unit of operational execution: each card knows whether it
 * can start a session right now ("ready"), is already running one ("active"),
 * or is blocked for a specific business reason that the operator can fix.
 *
 * - `ready`            → all preconditions met; primary CTA is "Iniciar sesión".
 * - `active`           → there is an in-flight transport_session row.
 * - `no_driver`        → no active driver assignment.
 * - `no_students`      → no active students in vehicle_students.
 * - `driver_inactive`  → assigned driver is inactive.
 * - `vehicle_inactive` → vehicle row is inactive.
 */
export type VehicleOperationalStatus =
  | "ready"
  | "active"
  | "no_driver"
  | "no_students"
  | "driver_inactive"
  | "vehicle_inactive";

export type OperationalVehicle = {
  vehicle: Vehicle;
  driver: Driver | null;
  assignedStudentCount: number;
  capacity: number;
  occupancyPercent: number;
  operationalStatus: VehicleOperationalStatus;
  activeSession: TransportSession | null;
  /** Human-friendly reason when `operationalStatus !== "ready" && !== "active"`. */
  blockingReason: string | null;
};

export function isVehicleReadyForSession(
  status: VehicleOperationalStatus,
): boolean {
  return status === "ready";
}

export const VEHICLE_OPERATIONAL_STATUS_LABELS: Record<
  VehicleOperationalStatus,
  string
> = {
  ready: "Listo",
  active: "En curso",
  no_driver: "Sin conductor",
  no_students: "Sin estudiantes",
  driver_inactive: "Conductor inactivo",
  vehicle_inactive: "Vehículo inactivo",
};
