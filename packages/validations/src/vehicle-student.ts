import { z } from "zod";

export const assignStudentToVehicleSchema = z.object({
  vehicleId: z.string().min(1),
  studentId: z.string().min(1, "Seleccione un estudiante"),
  pickupTime: z.string().optional(),
  dropoffTime: z.string().optional(),
});

export type AssignStudentToVehicleValues = z.infer<typeof assignStudentToVehicleSchema>;

export const updateVehicleStudentSchema = z.object({
  pickupTime: z.string().optional(),
  dropoffTime: z.string().optional(),
  status: z.boolean().optional(),
});

export type UpdateVehicleStudentValues = z.infer<typeof updateVehicleStudentSchema>;

export const reorderVehicleStudentsSchema = z.object({
  vehicleId: z.string().min(1),
  orderedAssignmentIds: z.array(z.string().min(1)).min(1),
});

export type ReorderVehicleStudentsValues = z.infer<typeof reorderVehicleStudentsSchema>;
