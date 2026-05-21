import { z } from "zod";

/**
 * Change-password schema for the mobile app (drivers + parents).
 *
 * Only minimum length is enforced; no uppercase/digit/symbol complexity rules.
 * The minimum is 8 because the Appwrite Auth backend rejects anything shorter
 * with `Invalid 'password' param: Password must be at least 8 characters`,
 * and we want the client to surface that constraint before the round-trip.
 */
export const MIN_PASSWORD_LENGTH = 8;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Ingrese su contraseña actual"),
    newPassword: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      ),
    confirmPassword: z.string().min(1, "Confirme su nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
