/** Appwrite stores `status` as boolean (true = active). */
export function mapStatus(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "active" || value === 1) return true;
  if (value === "false" || value === "inactive" || value === 0) return false;
  return true;
}

export function statusLabel(active: boolean): string {
  return active ? "Activo" : "Inactivo";
}

/** Parse list filter from URL search param. */
export function parseStatusFilter(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
