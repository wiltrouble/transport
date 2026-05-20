import { z } from "zod";

/**
 * Sessions are no longer manually created with a vehicle+driver dropdown.
 * The only entry point is `startVehicleSession(vehicleId)` — driver, students
 * and shift are inherited from the vehicle's operational state.
 */
export const startVehicleSessionSchema = z.object({
  vehicleId: z.string().min(1, "Vehículo requerido"),
});

export type StartVehicleSessionValues = z.infer<typeof startVehicleSessionSchema>;

export const sessionStudentNotesSchema = z.object({
  notes: z.string().max(2000, "Notas demasiado largas"),
});

export type SessionStudentNotesValues = z.infer<typeof sessionStudentNotesSchema>;
