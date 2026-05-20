"use server";

import { revalidatePath } from "next/cache";
import {
  assignVehicleDriverSchema,
  setPrimaryVehicleDriverSchema,
  unassignVehicleDriverSchema,
  type AssignVehicleDriverValues,
  type SetPrimaryVehicleDriverValues,
  type UnassignVehicleDriverValues,
} from "@school/validations";
import { vehicleDriverService } from "@/services/vehicleDriverService";

function revalidateVehicleDrivers(vehicleId: string, driverId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicle-drivers");
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/drivers");
  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  revalidatePath(`/dashboard/vehicles/${vehicleId}/drivers`);
  revalidatePath(`/dashboard/drivers/${driverId}`);
  revalidatePath(`/dashboard/drivers/${driverId}/vehicles`);
}

export async function assignVehicleDriverAction(values: AssignVehicleDriverValues) {
  const parsed = assignVehicleDriverSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const current = await vehicleDriverService.getCurrentVehicleDriver(parsed.data.vehicleId);
    if (current && current.driverId !== parsed.data.driverId) {
      await vehicleDriverService.replaceVehicleDriver(
        parsed.data.vehicleId,
        parsed.data.driverId,
      );
    } else {
      await vehicleDriverService.assignDriverToVehicle({
        ...parsed.data,
        isPrimary: true,
        status: true,
      });
    }
    revalidateVehicleDrivers(parsed.data.vehicleId, parsed.data.driverId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function setPrimaryVehicleDriverAction(values: SetPrimaryVehicleDriverValues) {
  const parsed = setPrimaryVehicleDriverSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    const assignment = await vehicleDriverService.setPrimaryDriver(parsed.data.assignmentId);
    revalidateVehicleDrivers(parsed.data.vehicleId, assignment.driverId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

export async function unassignVehicleDriverAction(values: UnassignVehicleDriverValues) {
  const parsed = unassignVehicleDriverSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await vehicleDriverService.unassignDriver(parsed.data.assignmentId);
    revalidateVehicleDrivers(parsed.data.vehicleId, parsed.data.driverId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
