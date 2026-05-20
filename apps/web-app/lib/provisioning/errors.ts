import { AppwriteException } from "node-appwrite";

export function formatProvisioningError(error: unknown): string {
  if (error instanceof AppwriteException) {
    const code = error.code;
    const message = error.message?.trim();

    if (code === 409) {
      return "Ya existe una cuenta de autenticación con este correo electrónico.";
    }
    if (code === 400 && message?.toLowerCase().includes("password")) {
      return "La contraseña generada no cumple las políticas de Appwrite. Intente de nuevo.";
    }
    if (message) return message;
    return `Error de Appwrite (${code}).`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "No se pudo completar el aprovisionamiento del usuario.";
}
