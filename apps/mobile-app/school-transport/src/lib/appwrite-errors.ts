import { AppwriteException } from "appwrite";

export function formatAppwriteError(error: unknown): string {
  if (error instanceof AppwriteException) {
    if (error.code === 401 || error.code === 403) {
      return "Sin permiso para guardar GPS. En Appwrite, permita crear filas en la tabla gps_tracking para usuarios autenticados.";
    }
    if (error.message) return error.message;
    return `Error de Appwrite (${error.code}).`;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Ocurrió un error inesperado.";
}
