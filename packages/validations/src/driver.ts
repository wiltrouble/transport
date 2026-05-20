import { z } from "zod";

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const driverFormSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  phone: z
    .string()
    .min(7, "Teléfono no válido")
    .max(20, "Teléfono demasiado largo"),
  licenseNumber: z.string().min(3, "Número de licencia obligatorio"),
  licenseCategory: z.string().min(1, "Seleccione la categoría"),
  licenseExpiration: z
    .string()
    .min(1, "Fecha de vencimiento obligatoria")
    .refine((value) => {
      const exp = new Date(value);
      if (Number.isNaN(exp.getTime())) return false;
      exp.setHours(0, 0, 0, 0);
      return exp >= today();
    }, "La licencia no puede estar vencida"),
  status: z.boolean(),
});

export type DriverFormValues = z.infer<typeof driverFormSchema>;
