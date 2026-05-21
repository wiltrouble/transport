import { create } from "zustand";
import {
  passwordService,
  type ChangePasswordInput,
} from "@/services/passwordService";

type PasswordState = {
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
  changePassword: (input: ChangePasswordInput) => Promise<boolean>;
  reset: () => void;
  setError: (message: string | null) => void;
};

/**
 * Dedicated store for the change-password flow.
 *
 * - Prevents multiple submits via `isSubmitting` (also disables the button).
 * - Surfaces the error/success state to the screen without leaking it to the
 *   global auth store (the user remains logged in regardless).
 */
export const usePasswordStore = create<PasswordState>((set, get) => ({
  isSubmitting: false,
  error: null,
  successMessage: null,

  async changePassword(input) {
    if (get().isSubmitting) return false;

    set({ isSubmitting: true, error: null, successMessage: null });
    try {
      await passwordService.changePassword(input);
      set({
        isSubmitting: false,
        successMessage:
          "Su contraseña fue actualizada. Su sesión sigue activa.",
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña.";
      set({ isSubmitting: false, error: message });
      return false;
    }
  },

  reset() {
    set({ isSubmitting: false, error: null, successMessage: null });
  },

  setError(message) {
    set({ error: message });
  },
}));
