"use server";

import { revalidatePath } from "next/cache";
import {
  vehicleCreateSchema,
  vehicleEditSchema,
  type VehicleCreateValues,
  type VehicleEditValues,
} from "@school/validations";
import { vehicleService } from "@/services/vehicleService";

function revalidateVehicles(vehicleId?: string, driverId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/drivers");
  if (vehicleId) {
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
  }
  if (driverId) {
    revalidatePath(`/dashboard/drivers/${driverId}`);
  }
}

/**
 * Create a vehicle + driver + (optional) student assignments in a single
 * transactional flow. Used by `/dashboard/vehicles/create` (wizard).
 */
export async function createVehicleWithAssignmentsAction(values: VehicleCreateValues) {
  const parsed = vehicleCreateSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { driverId, students, ...info } = parsed.data;
    const { vehicle, assignedStudents } =
      await vehicleService.createVehicleWithAssignments(info, driverId, students);
    revalidateVehicles(vehicle.id, driverId);
    return { ok: true as const, id: vehicle.id, assignedStudents };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al crear vehículo"] },
    };
  }
}

/**
 * Update vehicle info and replace the active driver if needed.
 * Student operations are handled by `vehicle-students` actions (inline UI).
 */
export async function updateVehicleAssignmentsAction(
  id: string,
  values: VehicleEditValues,
) {
  const parsed = vehicleEditSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { driverId, ...info } = parsed.data;
    await vehicleService.updateVehicleAssignments(id, info, driverId);
    revalidateVehicles(id, driverId);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al actualizar"] },
    };
  }
}

/** @deprecated Use createVehicleWithAssignmentsAction */
export async function createVehicleAction(values: VehicleCreateValues) {
  return createVehicleWithAssignmentsAction(values);
}

/** @deprecated Use updateVehicleAssignmentsAction */
export async function updateVehicleAction(id: string, values: VehicleEditValues) {
  return updateVehicleAssignmentsAction(id, values);
}

export async function deleteVehicleAction(id: string) {
  try {
    await vehicleService.delete(id);
    revalidateVehicles();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
