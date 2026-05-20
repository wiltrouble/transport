import { randomInt } from "node:crypto";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const NUMBERS = "23456789";
const SPECIAL = "!@#$%&*";
const ALL = UPPER + LOWER + NUMBERS + SPECIAL;

function pickChar(pool: string): string {
  return pool[randomInt(pool.length)]!;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/**
 * Generates a one-time temporary password for provisioned accounts.
 * Not stored in the database — only returned to the admin once.
 */
export function generateTemporaryPassword(length = 12): string {
  const size = Math.max(10, length);
  const required = [
    pickChar(UPPER),
    pickChar(LOWER),
    pickChar(NUMBERS),
    pickChar(SPECIAL),
  ];
  const rest = Array.from({ length: size - required.length }, () => pickChar(ALL));
  return shuffle([...required, ...rest]).join("");
}
