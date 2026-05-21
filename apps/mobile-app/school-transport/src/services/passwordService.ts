import { AppwriteException } from "appwrite";
import { getAccount } from "@/lib/appwrite";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/validations/change-password";

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Map Appwrite error codes to user-friendly messages.
 *
 * Appwrite returns:
 *   - 401 `user_invalid_credentials` when `oldPassword` is wrong.
 *   - 400 `general_argument_invalid` when the new password fails server-side rules.
 *   - 401 with `user_session_not_found` / `general_unauthorized_scope` when the
 *     session expired and the account scope is gone.
 */
function mapAppwriteError(error: AppwriteException): string {
  const type = error.type ?? "";
  const code = error.code ?? 0;

  if (
    type === "user_invalid_credentials" ||
    (code === 401 && /password|credentials/i.test(error.message))
  ) {
    return "La contraseña actual es incorrecta.";
  }

  if (code === 401) {
    return "Su sesión expiró. Inicie sesión nuevamente para cambiar su contraseña.";
  }

  if (code === 400) {
    return error.message?.trim().length
      ? error.message
      : "La nueva contraseña no cumple los requisitos del servidor.";
  }

  return error.message?.trim().length
    ? error.message
    : `Error de Appwrite (${code || "desconocido"}).`;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && /network/i.test(error.message)) return true;
  return error instanceof Error && /network request failed/i.test(error.message);
}

export const passwordService = {
  /**
   * Re-runs the Zod rules outside of the form layer so callers (stores,
   * automated flows) can rely on the same guarantees as the UI.
   */
  validatePasswordChange(values: ChangePasswordFormValues) {
    return changePasswordSchema.safeParse(values);
  },

  /**
   * Update the currently logged-in user's password. Appwrite verifies the
   * old password server-side and KEEPS the active session valid, so callers
   * stay authenticated and do not need to re-login.
   *
   * Throws `Error` with a user-friendly message on failure.
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    const currentPassword = input.currentPassword;
    const newPassword = input.newPassword;
    if (!currentPassword || !newPassword) {
      throw new Error("Complete todos los campos para cambiar la contraseña.");
    }

    try {
      await getAccount().updatePassword({
        password: newPassword,
        oldPassword: currentPassword,
      });
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error(
          "No hay conexión con el servidor. Verifique su internet e intente nuevamente.",
        );
      }
      if (error instanceof AppwriteException) {
        throw new Error(mapAppwriteError(error));
      }
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error("No se pudo cambiar la contraseña. Intente más tarde.");
    }
  },
};
