import { z } from "zod";

export const assignVehicleDriverSchema = z.object({
  vehicleId: z.string().min(1, "Seleccione un vehículo"),
  driverId: z.string().min(1, "Seleccione un conductor"),
  assignedAt: z.string().min(1, "Indique la fecha de asignación"),
  isPrimary: z.boolean(),
  status: z.boolean(),
});

export type AssignVehicleDriverValues = z.infer<typeof assignVehicleDriverSchema>;

export const setPrimaryVehicleDriverSchema = z.object({
  assignmentId: z.string().min(1),
  vehicleId: z.string().min(1),
});

export type SetPrimaryVehicleDriverValues = z.infer<typeof setPrimaryVehicleDriverSchema>;

export const unassignVehicleDriverSchema = z.object({
  assignmentId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
});

export type UnassignVehicleDriverValues = z.infer<typeof unassignVehicleDriverSchema>;
