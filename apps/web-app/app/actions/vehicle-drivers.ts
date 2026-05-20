"use server";

import { revalidatePath } from "next/cache";
import {
  replaceVehicleDriverSchema,
  type ReplaceVehicleDriverValues,
} from "@school/validations";
import { vehicleDriverService } from "@/services/vehicleDriverService";

function revalidate(vehicleId: string, driverId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/drivers");
  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  revalidatePath(`/dashboard/vehicles/${vehicleId}/edit`);
  revalidatePath(`/dashboard/drivers/${driverId}`);
}

/**
 * Single mutation kept after the standalone Assignments module was removed.
 * Marks the previous active assignment as inactive (preserving history) and
 * creates a new active `vehicle_drivers` row pointing at the new driver.
 */
export async function replaceVehicleDriverAction(values: ReplaceVehicleDriverValues) {
  const parsed = replaceVehicleDriverSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  try {
    await vehicleDriverService.replaceVehicleDriver(
      parsed.data.vehicleId,
      parsed.data.driverId,
    );
    revalidate(parsed.data.vehicleId, parsed.data.driverId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
