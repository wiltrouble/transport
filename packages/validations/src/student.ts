import { z } from "zod";

export const studentFormSchema = z
  .object({
    fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    gender: z.enum(["male", "female", "other"]),
    grade: z.string().min(1, "El grado es obligatorio"),
    address: z.string().min(3, "La dirección es obligatoria"),
    status: z.boolean(),
    photo: z.string().optional(),
  })
  .refine(
    (data) => {
      const birth = new Date(data.birthDate);
      if (Number.isNaN(birth.getTime())) return false;
      return birth <= new Date();
    },
    { message: "La fecha de nacimiento no puede ser futura", path: ["birthDate"] },
  );

export type StudentFormValues = z.infer<typeof studentFormSchema>;
