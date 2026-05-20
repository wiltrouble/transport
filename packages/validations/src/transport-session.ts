import { z } from "zod";
import { SESSION_SHIFTS } from "@school/types";

export const createTransportSessionSchema = z.object({
  vehicleId: z.string().min(1, "Seleccione un vehículo"),
  driverId: z.string().min(1, "Seleccione un conductor"),
  sessionDate: z.string().min(1, "Indique la fecha de la sesión"),
  shift: z.enum(SESSION_SHIFTS, { message: "Seleccione un turno" }),
  notes: z.string().optional(),
});

export type CreateTransportSessionValues = z.infer<typeof createTransportSessionSchema>;

export const sessionStudentNotesSchema = z.object({
  notes: z.string().max(2000, "Notas demasiado largas"),
});

export type SessionStudentNotesValues = z.infer<typeof sessionStudentNotesSchema>;
