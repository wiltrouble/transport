import { z } from "zod";

/**
 * Driver-replacement is the only assignment operation exposed to the UI
 * after the standalone Assignments module was removed; all other
 * vehicle_drivers row mutations happen inside the vehicle service.
 */
export const replaceVehicleDriverSchema = z.object({
  vehicleId: z.string().min(1, "Vehículo requerido"),
  driverId: z.string().min(1, "Seleccione un conductor"),
});

export type ReplaceVehicleDriverValues = z.infer<typeof replaceVehicleDriverSchema>;
