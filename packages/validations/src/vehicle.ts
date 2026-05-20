import { z } from "zod";

export const vehicleFormSchema = z.object({
  plate: z
    .string()
    .min(4, "Placa obligatoria")
    .max(15, "Placa demasiado larga")
    .transform((v) => v.trim().toUpperCase()),
  brand: z.string().min(2, "Marca obligatoria"),
  model: z.string().min(1, "Modelo obligatorio"),
  capacity: z.coerce
    .number()
    .int("Capacidad debe ser un número entero")
    .min(1, "Capacidad debe ser mayor a 0")
    .max(200, "Capacidad demasiado alta"),
  color: z.string().min(2, "Color obligatorio"),
  year: z.coerce
    .number()
    .int()
    .min(1990, "Año no válido")
    .max(new Date().getFullYear() + 1, "Año no válido"),
  status: z.boolean(),
  driverId: z.string().min(1, "Seleccione un conductor"),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
