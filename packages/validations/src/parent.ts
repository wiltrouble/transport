import { z } from "zod";

export const parentFormSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  phone: z
    .string()
    .min(7, "Teléfono no válido")
    .max(20, "Teléfono demasiado largo"),
  address: z.string().min(3, "La dirección es obligatoria"),
  emergencyPhone: z
    .string()
    .min(7, "Teléfono de emergencia no válido")
    .max(20, "Teléfono demasiado largo"),
  status: z.boolean(),
});

export type ParentFormValues = z.infer<typeof parentFormSchema>;
