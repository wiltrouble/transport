"use server";

import { revalidatePath } from "next/cache";
import { vehicleFormSchema, type VehicleFormValues } from "@school/validations";
import { vehicleService } from "@/services/vehicleService";

function revalidateVehicles(vehicleId?: string, driverId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/vehicle-drivers");
  revalidatePath("/dashboard/drivers");
  if (vehicleId) {
    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/students`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/drivers`);
    revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
  }
  if (driverId) {
    revalidatePath(`/dashboard/drivers/${driverId}`);
    revalidatePath(`/dashboard/drivers/${driverId}/vehicles`);
  }
}

export async function createVehicleAction(values: VehicleFormValues) {
  const parsed = vehicleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { driverId, ...vehicleInput } = parsed.data;
    const { vehicle } = await vehicleService.createWithDriver(vehicleInput, driverId);
    revalidateVehicles(vehicle.id, driverId);
    return { ok: true as const, id: vehicle.id };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al crear vehículo"] },
    };
  }
}

export async function updateVehicleAction(id: string, values: VehicleFormValues) {
  const parsed = vehicleFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const { driverId, ...vehicleInput } = parsed.data;
    await vehicleService.updateWithDriver(id, vehicleInput, driverId);
    revalidateVehicles(id, driverId);
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: { _form: [(e as Error).message || "Error al actualizar"] },
    };
  }
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
