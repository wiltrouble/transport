/** Joins class names, skipping falsy values (lightweight alternative to clsx). */
export function cn(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(" ");
}
