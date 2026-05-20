import type { Models } from "appwrite";

export type AppwriteRow = Models.Row & Record<string, unknown>;

export function relationId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "$id" in value) {
    return String((value as { $id: string }).$id);
  }
  return null;
}

export function isSchemaAttributeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Attribute not found in schema") ||
    message.includes("Unknown attribute") ||
    message.includes("Invalid document structure")
  );
}

export function isQuerySyntaxError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Invalid query") || message.includes("Syntax error");
}
