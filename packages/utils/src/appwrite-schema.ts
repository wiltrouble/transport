/** Appwrite error: Unknown attribute: "columnKey" */
export function parseUnknownAttributeName(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const quoted = message.match(/Unknown attribute:\s*["']([^"']+)["']/i);
  if (quoted?.[1]) return quoted[1];
  const plain = message.match(/Unknown attribute:\s*(\S+)/i);
  return plain?.[1]?.replace(/["'.]/g, "") ?? null;
}

export function isUnknownAttributeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Unknown attribute");
}
